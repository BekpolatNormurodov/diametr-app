import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServiceService {
  constructor(private readonly prisma: PrismaClientService) {}
  private logger = new Logger('Service service');
  async create(data: CreateServiceDto) {
    this.logger.log('create');

    return await this.prisma.service.create({
      data: data,
    });
  }

  async findAll() {
    this.logger.log('findAll');
    return await this.prisma.service.findMany({
      orderBy: { id: 'desc' },
    });
  }
  async findOne(id: number) {
    this.logger.log('findOne');
    let service = await this.prisma.service.findUnique({
      where: { id },
    });
    if (!service) {
      throw new NotFoundException('service not found');
    }

    return service;
  }

  async update(id: number, data: UpdateServiceDto) {
    this.logger.log('update');
    let service = await this.prisma.service.findUnique({
      where: { id },
    });
    if (!service) {
      throw new NotFoundException('service not found');
    }

    return await this.prisma.service.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    this.logger.log('remove');
    let service = await this.prisma.service.findUnique({
      where: { id },
    });
    if (!service) {
      throw new NotFoundException('service not found');
    }

    return await this.prisma.service.delete({
      where: { id },
    });
  }
}
