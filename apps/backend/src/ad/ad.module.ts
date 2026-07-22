import { Module } from '@nestjs/common';
import { AdService } from './ad.service';
import { AdController } from './ad.controller';

@Module({
  providers: [AdService],
  controllers: [AdController]
})
export class AdModule {}
