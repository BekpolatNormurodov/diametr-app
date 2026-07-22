import { Module } from '@nestjs/common';
import { NewService } from './new.service';
import { NewController } from './new.controller';

@Module({
  providers: [NewService],
  controllers: [NewController]
})
export class NewModule {}
