import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';
import {
  EskizLoginResponse,
  EskizSendSmsParams,
  EskizSendSmsResponse,
} from './eskiz.types';

@Injectable()
export class EskizService implements OnModuleInit {
  private readonly logger = new Logger('EskizService');
  private readonly enabled: boolean;
  private readonly baseUrl: string;
  private readonly email: string;
  private readonly password: string;
  private readonly from: string;
  private readonly callbackUrl: string | undefined;

  private http!: AxiosInstance;
  private tokenCache: { token: string; expiresAt: Date } | null = null;

  constructor(private readonly prisma: PrismaClientService) {
    this.enabled =
      (process.env.ESKIZ_ENABLED ?? 'false').toLowerCase() === 'true';
    this.baseUrl = process.env.ESKIZ_BASE_URL ?? 'https://notify.eskiz.uz';
    this.email = process.env.ESKIZ_EMAIL ?? '';
    this.password = process.env.ESKIZ_PASSWORD ?? '';
    this.from = process.env.ESKIZ_FROM ?? '4546';
    this.callbackUrl = process.env.ESKIZ_CALLBACK_URL || undefined;
  }

  onModuleInit() {
    this.http = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000,
    });

    if (!this.enabled) {
      this.logger.warn(
        "ESKIZ_ENABLED=false — real SMS o'chirilgan (test rejimi).",
      );
      return;
    }
    if (!this.email || !this.password) {
      this.logger.error('ESKIZ_EMAIL / ESKIZ_PASSWORD .env da topilmadi.');
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /** Joriy tokenni qaytaradi: cache → DB → login */
  async getToken(forceRefresh = false): Promise<string> {
    if (
      !forceRefresh &&
      this.tokenCache &&
      this.tokenCache.expiresAt > new Date()
    ) {
      return this.tokenCache.token;
    }

    if (!forceRefresh) {
      const dbToken = await this.prisma.eskizToken.findFirst({
        orderBy: { id: 'desc' },
      });
      if (dbToken && dbToken.expires_at > new Date()) {
        this.tokenCache = {
          token: dbToken.token,
          expiresAt: dbToken.expires_at,
        };
        return dbToken.token;
      }
    }

    return this.login();
  }

  /** Yangi token oladi va DB ga saqlaydi */
  private async login(): Promise<string> {
    this.logger.log('Eskiz login...');
    try {
      const params = new URLSearchParams();
      params.append('email', this.email);
      params.append('password', this.password);

      const res = await this.http.post<EskizLoginResponse>(
        '/api/auth/login',
        params.toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      );

      const token = res.data?.data?.token;
      if (!token) {
        throw new Error('Eskiz login: token kelmadi');
      }

      // Eskiz tokeni 30 kun yashaydi — biz 25 kun bilan keshlaymiz
      const expiresAt = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000);

      // Eski tokenlarni tozalash (bittasini saqlash kifoya)
      await this.prisma.eskizToken.deleteMany({});
      await this.prisma.eskizToken.create({
        data: { token, expires_at: expiresAt },
      });

      this.tokenCache = { token, expiresAt };
      this.logger.log('Eskiz login muvaffaqiyatli.');
      return token;
    } catch (e) {
      const err = e as AxiosError;
      this.logger.error(
        `Eskiz login xatosi: ${err.message} ${JSON.stringify(err.response?.data ?? {})}`,
      );
      throw err;
    }
  }

  /** SMS yuborish. 401 bo'lsa 1 marta token reset + retry. */
  async sendSms(params: EskizSendSmsParams): Promise<EskizSendSmsResponse> {
    if (!this.enabled) {
      throw new Error('Eskiz disabled');
    }

    const phone = this.normalizePhone(params.phone);

    const body: Record<string, string> = {
      mobile_phone: phone,
      message: params.message,
      from: this.from,
    };
    if (this.callbackUrl) body.callback_url = this.callbackUrl;
    // Eskiz da user_sms_id juda qattiq format talab qiladi (ko'pincha xatolik beradi),
    // shu sababli yubormayapmiz. Callback bizning yozuvga `message_id` (= eskiz_id) orqali topiladi.

    const send = async (token: string) => {
      const form = new URLSearchParams();
      Object.entries(body).forEach(([k, v]) => form.append(k, v));
      return this.http.post<EskizSendSmsResponse>(
        '/api/message/sms/send',
        form.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Bearer ${token}`,
          },
        },
      );
    };

    let token = await this.getToken();
    try {
      const res = await send(token);
      return res.data;
    } catch (e) {
      const err = e as AxiosError;
      if (err.response?.status === 401) {
        this.logger.warn('Eskiz 401 — tokenni yangilab qayta urinish...');
        token = await this.getToken(true);
        const res = await send(token);
        return res.data;
      }
      this.logger.error(
        `Eskiz sendSms xatosi: ${err.message} ${JSON.stringify(err.response?.data ?? {})}`,
      );
      throw err;
    }
  }

  /** +998901234567 / 998 90 123 45 67 → 998901234567 */
  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }
}
