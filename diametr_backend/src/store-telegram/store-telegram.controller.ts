import {
  Controller,
  Get,
  Post,
  Body,
  Logger,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { StoreTelegramService } from './store-telegram.service';
import { StoreGuard } from 'src/_guard/store.guard';

@Controller('store')
export class StoreTelegramController {
  private readonly logger = new Logger(StoreTelegramController.name);

  constructor(private readonly storeTelegram: StoreTelegramService) {}

  // Public route: only updates carrying the secret_token registered with
  // setWebhook (webhook mode) are processed; anything else gets a silent 200.
  @Post('webhook')
  async handleWebhook(
    @Body() update: any,
    @Headers('x-telegram-bot-api-secret-token') secret?: string,
  ) {
    if (!this.storeTelegram.acceptsWebhook(secret)) return { ok: true };
    try {
      await this.storeTelegram.handleUpdate(update);
    } catch (e: any) {
      this.logger.error(`webhook error: ${e?.message}`);
    }
    return { ok: true };
  }

  /**
   * Store web-app calls this on init to verify the token is a genuine
   * STORE_BOT token. Returns 403 for regular mobile/web JWTs.
   */
  @Get('session')
  @UseGuards(StoreGuard)
  session() {
    return { ok: true, source: 'STORE_BOT' };
  }
}
