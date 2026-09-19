import { Module } from '@nestjs/common';
import { PromoCodeModule } from 'src/promo-code/promo-code.module';
import { OrderCheckoutService } from './order-checkout.service';

/**
 * Order pricing/validation shared by OrderModule and the Telegram store bot.
 * Kept apart from OrderService (which notifies through StoreTelegramService)
 * so the bot can use it without a circular module import.
 */
@Module({
  imports: [PromoCodeModule],
  providers: [OrderCheckoutService],
  exports: [OrderCheckoutService],
})
export class OrderCheckoutModule {}
