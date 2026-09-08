import { Controller, Get, Post, Body, Patch, Param, Delete, Put } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { RegionService } from './region.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';

@ApiTags('Region')
@Controller('region')
export class RegionController {

  constructor(private readonly regionService: RegionService) {}

  @Post()
  @ApiOperation({ summary: 'Hudud yaratish' })
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
  @ApiOperation({ summary: 'Hududni tahrirlash' })
  @ApiParam({ name: 'id', type: Number })
  update(@Param('id') id: string, @Body() data: UpdateRegionDto) {
    return this.regionService.update(+id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hududni o’chirish' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id') id: string) {
    return this.regionService.remove(+id);
  }
}
