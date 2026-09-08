import { Module } from '@nestjs/common';
import { StoreTelegramController } from './store-telegram.controller';
import { StoreTelegramService } from './store-telegram.service';
import { PrismaClientModule } from 'src/_prisma_client/prisma_client.module';
import { SmsModule } from 'src/sms/sms.module';

@Module({
  imports: [PrismaClientModule, SmsModule],
  controllers: [StoreTelegramController],
  providers: [StoreTelegramService],
  exports: [StoreTelegramService],
})
export class StoreTelegramModule {}
