import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { PromoCodeModule } from 'src/promo-code/promo-code.module';
import { TelegramModule } from 'src/telegram/telegram.module';
import { StoreTelegramModule } from 'src/store-telegram/store-telegram.module';

@Module({
  imports: [PromoCodeModule, TelegramModule, StoreTelegramModule],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
