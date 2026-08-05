import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';
import { generatePassword } from 'src/_utils/number.gen';
import { hashPassword } from 'src/_utils/password';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';

@Injectable()
export class WorkerService {
  constructor(private readonly prisma: PrismaClientService) {}
  private logger = new Logger('Worker service');
  async create(data: CreateWorkerDto) {
    this.logger.log('create');
    let worker = await this.prisma.worker.findUnique({
      where: { phone: data.phone },
    });
    if (worker) {
      throw new BadRequestException('This phone is used');
    }

    let service = await this.prisma.service.findUnique({
      where: {
        id: data.service_id,
      },
    });

    if (!service) {
      throw new NotFoundException('service not found');
    }

    // Store the password in plain text so the shop owner can read and share it
    // from the panel (see auth.service for the rationale).
    data.password = generatePassword({ length: 8 });

    worker = await this.prisma.worker.create({
      data: data,
    });
    return worker;
  }

  async findAll() {
    this.logger.log('findAll');
    const workers = await this.prisma.worker.findMany({
      orderBy: { id: 'desc' },
    });
    return workers;
  }
  async findOne(id: number) {
    this.logger.log('findOne');
    let worker = await this.prisma.worker.findUnique({
      where: { id },
    });
    if (!worker) {
      throw new NotFoundException('worker not found');
    }

    return worker;
  }

  async update(id: number, data: UpdateWorkerDto) {
    this.logger.log('update');
    let worker = await this.prisma.worker.findUnique({
      where: { id },
    });
    if (!worker) {
      throw new NotFoundException('worker not found');
    }
    if (data.service_id) {
      let service = await this.prisma.shop.findUnique({
        where: {
          id: data.service_id,
        },
      });
      if (!service) {
        throw new NotFoundException('service not found');
      }
    }

    return await this.prisma.worker.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    this.logger.log('remove');
    let worker = await this.prisma.worker.findUnique({
      where: { id },
    });
    if (!worker) {
      throw new NotFoundException('worker not found');
    }

    return await this.prisma.worker.delete({
      where: { id },
    });
  }
}
