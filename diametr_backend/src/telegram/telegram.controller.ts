import { Controller, Post, Body, HttpCode, Headers } from '@nestjs/common';
import { TelegramService } from './telegram.service';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  // Public route: only updates carrying the secret_token registered with
  // setWebhook are processed; anything else gets a silent 200.
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Body() update: any,
    @Headers('x-telegram-bot-api-secret-token') secret?: string,
  ) {
    if (!this.telegramService.acceptsWebhook(secret)) return { ok: true };
    await this.telegramService.handleUpdate(update);
    return { ok: true };
  }
}
