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
import { WorkerService } from './worker.service';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';

@ApiTags('Worker')
@Controller('worker')
export class WorkerController {
  constructor(private readonly workerService: WorkerService) {}

  @Post()
  @ApiOperation({ summary: 'Usta yaratish' })
  create(@Body() data: CreateWorkerDto) {
    return this.workerService.create(data);
  }

  @Get('/all')
  @ApiOperation({ summary: 'Barcha ustalar ro’yxati' })
  findAll() {
    return this.workerService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta usta' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id') id: string) {
    return this.workerService.findOne(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Ustani tahrirlash' })
  @ApiParam({ name: 'id', type: Number })
  update(@Param('id') id: string, @Body() data: UpdateWorkerDto) {
    return this.workerService.update(+id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Ustani o’chirish' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id') id: string) {
    return this.workerService.remove(+id);
  }
}
