import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { UnitTypeService } from './unit-type.service';
import { CreateUnitTypeDto } from './dto/create-unit-type.dto';
import { Role } from '@prisma/client';
import { RolesGuardFactory } from 'src/_guard/roles.guard';

@ApiTags('Unit-Type')
@Controller('unit-type')
export class UnitTypeController {
  constructor(private readonly unitTypeService: UnitTypeService) {}

  @Post()
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Yangi o\'lchov birligi yaratish (SUPER)' })
  create(@Body() dto: CreateUnitTypeDto) {
    return this.unitTypeService.create(dto);
  }

  @Get('/all')
  @ApiOperation({ summary: 'Barcha o\'lchov birliklari (public)' })
  findAll() {
    return this.unitTypeService.findAll();
  }

  @Put('/:id')
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'O\'lchov birligini tahrirlash (SUPER)' })
  @ApiParam({ name: 'id', type: Number })
  update(@Param('id') id: string, @Body() dto: CreateUnitTypeDto) {
    return this.unitTypeService.update(+id, dto);
  }

  @Delete('/:id')
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'O\'lchov birligini o\'chirish (SUPER)' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id') id: string) {
    return this.unitTypeService.remove(+id);
  }
}
