import { Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SmsController } from './sms.controller';
import { EskizService } from './eskiz/eskiz.service';

@Module({
  providers: [SmsService, EskizService],
  controllers: [SmsController],
  exports: [SmsService, EskizService],
})
export class SmsModule {}
