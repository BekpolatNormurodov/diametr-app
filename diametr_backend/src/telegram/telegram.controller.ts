import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { TelegramService } from './telegram.service';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(@Body() update: any) {
    await this.telegramService.handleUpdate(update);
    return { ok: true };
  }
}
