import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { TelegramModule } from 'src/telegram/telegram.module';
import { StoreTelegramModule } from 'src/store-telegram/store-telegram.module';
import { OrderCheckoutModule } from './order-checkout.module';

@Module({
  imports: [OrderCheckoutModule, TelegramModule, StoreTelegramModule],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
