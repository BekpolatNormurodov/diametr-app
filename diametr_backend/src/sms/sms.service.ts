import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';
import { SmsSendDto } from './dto/sms-send.dto';
import { SmsVerifyDto } from './dto/sms-verify.dto';
import { EskizCallbackDto } from './dto/eskiz-callback.dto';
import { generatePassword } from 'src/_utils/number.gen';
import { addMinutes, isAfter } from 'date-fns';
import { JwtService } from '@nestjs/jwt';
import { EskizService } from './eskiz/eskiz.service';

const smsMessages = {
  uz: {
    smsSendError:
      "SMS yuborishda xatolik yuz berdi. Keyinroq qayta urinib ko'ring.",
    serverError: "Serverda xatolik yuz berdi. Qayta urinib ko'ring.",
    codeNotFound: 'Tasdiqlash kodi topilmadi. Qayta SMS oling.',
    codeExpired: 'Kod muddati tugagan (2 daqiqa). Yangi kod oling.',
    codeUsed: 'Bu kod allaqachon ishlatilgan. Yangi SMS oling.',
    codeWrong: "Kod noto'g'ri. Qayta tekshiring.",
    tooManyAttempts: "Juda ko'p noto'g'ri urinish. Yangi kod oling.",
    retry: "So'rov bajarilmadi. Qayta urinib ko'ring.",
  },
  ru: {
    smsSendError: 'Ошибка при отправке SMS. Попробуйте позже.',
    serverError: 'Ошибка сервера. Попробуйте ещё раз.',
    codeNotFound: 'Код подтверждения не найден. Получите новый SMS.',
    codeExpired: 'Срок действия кода истёк (2 минуты). Получите новый код.',
    codeUsed: 'Этот код уже использован. Получите новый SMS.',
    codeWrong: 'Неверный код. Проверьте ещё раз.',
    tooManyAttempts: 'Слишком много неверных попыток. Получите новый код.',
    retry: 'Запрос не выполнен. Попробуйте ещё раз.',
  },
};

/** A code lives 2 minutes. */
const CODE_TTL_MINUTES = 2;
/** One new code per phone per minute (both clients' resend timers are >= 60s). */
const RESEND_COOLDOWN_MS = 60_000;
/**
 * Every verify attempt burns this much of the code's life, atomically in the
 * DB (so it holds across both replicas and concurrent requests): at most
 * about 5 tries fit into the 2-minute life of one code.
 */
const ATTEMPT_COST_MS = 24_000;
const MAX_RESERVE_RETRIES = 8;

/** HTTP 429 body for a resend inside the cooldown (clients show `message`). */
export const SMS_RESEND_WAIT_MESSAGE = 'Kodni qayta yuborish uchun biroz kuting';

function m(lang: string): typeof smsMessages.uz {
  return smsMessages[lang === 'ru' ? 'ru' : 'uz'];
}

@Injectable()
export class SmsService {
  constructor(
    private readonly prisma: PrismaClientService,
    private jwtService: JwtService,
    private readonly eskiz: EskizService,
  ) {}
  private logger = new Logger('Sms service');

  private resendTooSoon() {
    return new HttpException(
      { message: SMS_RESEND_WAIT_MESSAGE },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  async send(data: SmsSendDto, lang = 'uz') {
    this.logger.log(`send → ${data.phone}`);

    const code = this.eskiz.isEnabled()
      ? generatePassword({ length: 6 })
      : '666666'; // ESKIZ_ENABLED=false bo'lsa test rejimi

    // Per-phone cooldown (every code is a paid SMS). Codes whose SMS failed
    // to send do not count, so a provider error can be retried at once.
    const since = new Date(Date.now() - RESEND_COOLDOWN_MS);
    const recentWhere = {
      phone: data.phone,
      createdt: { gt: since },
      eskiz_error: null,
    };

    let verify;
    try {
      const recent = await this.prisma.verify.findFirst({
        where: recentWhere,
        select: { id: true },
      });
      if (recent) throw this.resendTooSoon();

      verify = await this.prisma.verify.create({
        data: {
          phone: data.phone,
          code,
          expired: addMinutes(new Date(), CODE_TTL_MINUTES),
        },
      });

      // Two sends at the same moment (e.g. one per replica) both passed the
      // check above: only the earliest row survives, the other one is 429.
      const earlier = await this.prisma.verify.findFirst({
        where: {
          ...recentWhere,
          id: { not: verify.id },
          OR: [
            { createdt: { lt: verify.createdt } },
            { createdt: verify.createdt, id: { lt: verify.id } },
          ],
        },
        select: { id: true },
      });
      if (earlier) {
        await this.prisma.verify.update({
          where: { id: verify.id },
          data: { used: true },
        });
        throw this.resendTooSoon();
      }

      // Eski ishlatilmagan verifylarni bekor qilish
      await this.prisma.verify.updateMany({
        where: { phone: data.phone, used: false, id: { not: verify.id } },
        data: { used: true },
      });
    } catch (e: any) {
      if (e instanceof HttpException) throw e;
      this.logger.error('verify.create error', e?.message);
      throw new InternalServerErrorException(m(lang).smsSendError);
    }

    // Real SMS yuborish (Eskiz)
    if (this.eskiz.isEnabled()) {
      try {
        // Eskiz da tasdiqlangan shablon — faqat o'zbek tilida
        const message = `Diametr.uz platformasiga kirish uchun tasdiqlash kodi: ${code}. Kodni hech kimga bermang.`;

        const res = await this.eskiz.sendSms({
          phone: data.phone,
          message,
          requestId: verify.id,
        });

        await this.prisma.verify.update({
          where: { id: verify.id },
          data: {
            eskiz_id: String(res.id ?? ''),
            eskiz_status: res.status ?? 'waiting',
            sent_at: new Date(),
          },
        });
      } catch (e: any) {
        const errMsg = e?.response?.data
          ? JSON.stringify(e.response.data)
          : e?.message;
        this.logger.error('Eskiz sendSms error', errMsg);

        await this.prisma.verify.update({
          where: { id: verify.id },
          data: { used: true, eskiz_error: String(errMsg).slice(0, 1000) },
        });
        throw new InternalServerErrorException(m(lang).smsSendError);
      }
    }

    return {
      id: verify.id,
      phone: data.phone,
    };
  }

  /**
   * Eskiz delivery report callback handler.
   * URL: POST /sms/eskiz-callback (PUBLIC)
   * Eskiz tomonidan request_id (bizning user_sms_id = verify.id) yoki message_id orqali topiladi.
   */
  async handleEskizCallback(
    payload: EskizCallbackDto,
  ): Promise<{ ok: boolean }> {
    this.logger.log(`eskiz-callback: ${JSON.stringify(payload)}`);

    const status = payload.status;
    const messageId = payload.message_id
      ? String(payload.message_id)
      : undefined;
    const requestId = payload.request_id || payload.user_sms_id;

    if (!status || (!messageId && !requestId)) {
      return { ok: true }; // 200 qaytaramiz — Eskiz retry qilmasin
    }

    try {
      // Avval request_id (bizning verify.id) orqali qidirib ko'ramiz
      let verify = requestId
        ? await this.prisma.verify.findUnique({ where: { id: requestId } })
        : null;

      // Aks holda eskiz_id orqali
      if (!verify && messageId) {
        verify = await this.prisma.verify.findFirst({
          where: { eskiz_id: messageId },
        });
      }

      if (!verify) {
        this.logger.warn(
          `eskiz-callback: verify topilmadi (msg=${messageId}, req=${requestId})`,
        );
        return { ok: true };
      }

      const isDelivered = status === 'DELIVIVERED' || status === 'DELIVERED';
      await this.prisma.verify.update({
        where: { id: verify.id },
        data: {
          eskiz_status: status,
          eskiz_id: verify.eskiz_id ?? messageId,
          delivered_at: isDelivered ? new Date() : verify.delivered_at,
        },
      });
    } catch (e: any) {
      this.logger.error('eskiz-callback handle error', e?.message);
    }

    return { ok: true };
  }

  async verify(data: SmsVerifyDto, lang = 'uz') {
    this.logger.log('verify');

    let verify: any;
    try {
      verify = await this.prisma.verify.findUnique({ where: { id: data.id } });
    } catch (e: any) {
      this.logger.error('verify.findUnique error', e?.message);
      throw new InternalServerErrorException(m(lang).serverError);
    }

    if (!verify) {
      throw new NotFoundException(m(lang).codeNotFound);
    }

    // Reserve one attempt: compare-and-swap on `expired`, moving it
    // ATTEMPT_COST_MS earlier. Concurrent attempts (either replica) cannot
    // reuse the same slot, so one code allows only about 5 guesses in total.
    let reservedExpiry: Date | null = null;
    for (let i = 0; i < MAX_RESERVE_RETRIES && !reservedExpiry; i++) {
      if (i > 0) {
        verify = await this.prisma.verify.findUnique({ where: { id: data.id } });
        if (!verify) throw new NotFoundException(m(lang).codeNotFound);
      }
      const now = new Date();
      if (verify.used) {
        throw new BadRequestException(m(lang).codeUsed);
      }
      // An expiry at "now" counts as expired (same boundary as below), so the
      // attempt that burns the last slot and the one after it agree.
      if (!verify.expired || verify.expired.getTime() <= now.getTime()) {
        // Burnt by wrong attempts before its natural 2-minute end?
        const naturalEnd = verify.createdt
          ? addMinutes(verify.createdt, CODE_TTL_MINUTES)
          : null;
        throw new BadRequestException(
          naturalEnd && isAfter(naturalEnd, now)
            ? m(lang).tooManyAttempts
            : m(lang).codeExpired,
        );
      }
      const next = new Date(verify.expired.getTime() - ATTEMPT_COST_MS);
      const claimed = await this.prisma.verify.updateMany({
        where: { id: verify.id, used: false, expired: verify.expired },
        data: { expired: next },
      });
      if (claimed.count === 1) reservedExpiry = next;
    }
    if (!reservedExpiry) {
      throw new BadRequestException(m(lang).retry);
    }

    if (verify.code !== data.code) {
      throw new BadRequestException(
        reservedExpiry.getTime() <= Date.now()
          ? m(lang).tooManyAttempts
          : m(lang).codeWrong,
      );
    }

    // Single use, also under a double submit.
    const consumed = await this.prisma.verify.updateMany({
      where: { id: verify.id, used: false },
      data: { used: true },
    });
    if (consumed.count !== 1) {
      throw new BadRequestException(m(lang).codeUsed);
    }

    try {
      let user = await this.prisma.user.findUnique({
        where: { phone: verify.phone },
      });
      if (!user) {
        user = await this.prisma.user.create({
          data: { phone: verify.phone },
        });
      }

      // Save chat_id and lang if provided (store bot login)
      const updateData: { chat_id?: string; lang?: string } = {};
      if (data.chat_id) updateData.chat_id = data.chat_id;
      if (data.lang && ['uz', 'ru'].includes(data.lang))
        updateData.lang = data.lang;
      if (Object.keys(updateData).length > 0) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
      }

      const payload = { user_id: user.id, role: user.role };
      const accessToken = await this.jwtService.signAsync(payload);
      return {
        user,
        access_token: accessToken,
        // Same token under the key the mobile app reads (verify_bloc.dart
        // reads data["token"]). Without it every installed mobile build stored
        // the string "null", sent "Bearer null", got 401 on the first request
        // after login and was sent back to the login screen.
        token: accessToken,
        message: 'Verified successfully',
      };
    } catch (e: any) {
      this.logger.error('verify update/user error', e?.message);
      throw new InternalServerErrorException(
        "Serverda xatolik yuz berdi. Qayta urinib ko'ring.",
      );
    }
  }
}
