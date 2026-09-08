import { Module } from '@nestjs/common';
import { UnitTypeService } from './unit-type.service';
import { UnitTypeController } from './unit-type.controller';

@Module({
  providers: [UnitTypeService],
  controllers: [UnitTypeController],
})
export class UnitTypeModule {}
