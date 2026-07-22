import {
  BadRequestException,
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
import { addMinutes, isBefore } from 'date-fns';
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
  },
  ru: {
    smsSendError: 'Ошибка при отправке SMS. Попробуйте позже.',
    serverError: 'Ошибка сервера. Попробуйте ещё раз.',
    codeNotFound: 'Код подтверждения не найден. Получите новый SMS.',
    codeExpired: 'Срок действия кода истёк (2 минуты). Получите новый код.',
    codeUsed: 'Этот код уже использован. Получите новый SMS.',
    codeWrong: 'Неверный код. Проверьте ещё раз.',
  },
};

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

  async send(data: SmsSendDto, lang = 'uz') {
    this.logger.log(`send → ${data.phone}`);

    const code = this.eskiz.isEnabled()
      ? generatePassword({ length: 6 })
      : '666666'; // ESKIZ_ENABLED=false bo'lsa test rejimi

    let verify;
    try {
      // Eski ishlatilmagan verifylarni bekor qilish
      await this.prisma.verify.updateMany({
        where: { phone: data.phone, used: false },
        data: { used: true },
      });

      verify = await this.prisma.verify.create({
        data: {
          phone: data.phone,
          code,
          expired: addMinutes(new Date(), 2),
        },
      });
    } catch (e: any) {
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

    if (isBefore(verify.expired, new Date())) {
      throw new BadRequestException(m(lang).codeExpired);
    }

    if (verify.used) {
      throw new BadRequestException(m(lang).codeUsed);
    }

    if (verify.code !== data.code) {
      throw new BadRequestException(m(lang).codeWrong);
    }

    try {
      await this.prisma.verify.update({
        where: { id: data.id },
        data: { used: true },
      });

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
      return {
        user,
        access_token: await this.jwtService.signAsync(payload),
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
