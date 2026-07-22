import {
  Controller,
  Get,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  Headers,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SmsService } from './sms.service';
import { SmsSendDto } from './dto/sms-send.dto';
import { SmsVerifyDto } from './dto/sms-verify.dto';
import { EskizCallbackDto } from './dto/eskiz-callback.dto';

@ApiTags('Auth')
@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'SMS yuborish (telefon raqamga OTP)' })
  send(@Body() data: SmsSendDto, @Headers('accept-language') lang: string) {
    return this.smsService.send(data, lang);
  }

  @Post('/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'SMS kodni tekshirish va foydalanuvchini ro’yxatdan o’tkazish',
  })
  verify(@Body() data: SmsVerifyDto, @Headers('accept-language') lang: string) {
    return this.smsService.verify(data, lang);
  }

  @Post('/eskiz-callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Eskiz delivery report callback (PUBLIC, Eskiz tomonidan chaqiriladi)',
  })
  eskizCallback(@Body() body: EskizCallbackDto) {
    return this.smsService.handleEskizCallback(body);
  }
}
