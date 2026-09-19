import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { RolesGuardFactory } from 'src/_guard/roles.guard';
import { RegionService } from './region.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';

@ApiTags('Region')
@Controller('region')
export class RegionController {

  constructor(private readonly regionService: RegionService) {}

  // Writes are for the platform admin (dashboard) only; GET /all and GET :id
  // stay public (mobile reads them).
  @Post()
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Hudud yaratish (SUPER)' })
  create(@Body() data: CreateRegionDto) {
    return this.regionService.create(data);
  }

  @Get('/all')
  @ApiOperation({ summary: 'Barcha hududlar ro’yxati' })
  findAll() {
    return this.regionService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta hudud' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id') id: string) {
    return this.regionService.findOne(+id);
  }

  @Put(':id')
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Hududni tahrirlash (SUPER)' })
  @ApiParam({ name: 'id', type: Number })
  update(@Param('id') id: string, @Body() data: UpdateRegionDto) {
    return this.regionService.update(+id, data);
  }

  @Delete(':id')
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Hududni o’chirish (SUPER)' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id') id: string) {
    return this.regionService.remove(+id);
  }
}
