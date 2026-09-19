import { Module } from '@nestjs/common';
import { StoreTelegramController } from './store-telegram.controller';
import { StoreTelegramService } from './store-telegram.service';
import { PrismaClientModule } from 'src/_prisma_client/prisma_client.module';
import { SmsModule } from 'src/sms/sms.module';
import { OrderCheckoutModule } from 'src/order/order-checkout.module';
import { TelegramModule } from 'src/telegram/telegram.module';

@Module({
  imports: [PrismaClientModule, SmsModule, OrderCheckoutModule, TelegramModule],
  controllers: [StoreTelegramController],
  providers: [StoreTelegramService],
  exports: [StoreTelegramService],
})
export class StoreTelegramModule {}
