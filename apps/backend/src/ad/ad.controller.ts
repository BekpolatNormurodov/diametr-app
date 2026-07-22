import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AdService } from './ad.service';
import { UpdateAdDto } from './dto/update-ad-dto';
import { CreateAdDto } from './dto/create-ad-dto';

@ApiTags('Ad')
@Controller('ad')
export class AdController {
  constructor(private readonly adService: AdService) {}

  @Post()
  @ApiOperation({ summary: 'Reklama yaratish' })
  create(@Body() data: CreateAdDto) {
    return this.adService.create(data);
  }

  @Get('/all')
  @ApiOperation({ summary: 'Barcha reklamalar ro’yxati' })
  findAll() {
    return this.adService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta reklama' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id') id: string) {
    return this.adService.findOne(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Reklamani tahrirlash' })
  @ApiParam({ name: 'id', type: Number })
  update(@Param('id') id: string, @Body() data: UpdateAdDto) {
    return this.adService.update(+id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Reklamani o’chirish' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id') id: string) {
    return this.adService.remove(+id);
  }
}
