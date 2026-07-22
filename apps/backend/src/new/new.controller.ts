import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { NewService } from './new.service';
import { CreateNewDto } from './dto/create-new.dto';
import { UpdateNewDto } from './dto/update-new.dto';

@ApiTags('New')
@Controller('new')
export class NewController {
  constructor(private readonly newService: NewService) {}

  @Post()
  @ApiOperation({ summary: 'Yangilik yaratish' })
  create(@Body() data: CreateNewDto) {
    return this.newService.create(data);
  }

  @Get('/all')
  @ApiOperation({ summary: 'Barcha yangiliklar ro’yxati' })
  findAll() {
    return this.newService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta yangilik' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id') id: string) {
    return this.newService.findOne(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Yangilikni tahrirlash' })
  @ApiParam({ name: 'id', type: Number })
  update(@Param('id') id: string, @Body() data: UpdateNewDto) {
    return this.newService.update(+id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Yangilikni o’chirish' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id') id: string) {
    return this.newService.remove(+id);
  }
}
