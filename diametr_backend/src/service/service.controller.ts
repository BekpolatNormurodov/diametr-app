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
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@ApiTags('Service')
@Controller('service')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Post()
  @ApiOperation({ summary: 'Xizmat yaratish' })
  create(@Body() data: CreateServiceDto) {
    return this.serviceService.create(data);
  }

  @Get('/all')
  @ApiOperation({ summary: 'Barcha xizmatlar ro’yxati' })
  findAll() {
    return this.serviceService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta xizmat' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id') id: string) {
    return this.serviceService.findOne(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Xizmatni tahrirlash' })
  @ApiParam({ name: 'id', type: Number })
  update(@Param('id') id: string, @Body() data: UpdateServiceDto) {
    return this.serviceService.update(+id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xizmatni o’chirish' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id') id: string) {
    return this.serviceService.remove(+id);
  }
}
