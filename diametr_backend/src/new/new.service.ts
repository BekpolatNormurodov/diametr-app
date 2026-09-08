import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';
import { CreateNewDto } from './dto/create-new.dto';
import { UpdateNewDto } from './dto/update-new.dto';

@Injectable()
export class NewService {
  constructor(private readonly prisma: PrismaClientService) {}
  private logger = new Logger('New service');
  async create(data: CreateNewDto) {
    this.logger.log('create');

    return await this.prisma.new.create({
      data: data,
    });
  }

  async findAll() {
    this.logger.log('findAll');
    const news = await this.prisma.new.findMany({
      orderBy: { id: 'desc' },
    });
    return news;
  }
  async findOne(id: number) {
    this.logger.log('findOne');
    let news = await this.prisma.new.findUnique({
      where: { id },
    });
    if (!news) {
      throw new NotFoundException('news not found');
    }

    return news;
  }

  async update(id: number, data: UpdateNewDto) {
    this.logger.log('update');
    let news = await this.prisma.new.findUnique({
      where: { id },
    });
    if (!news) {
      throw new NotFoundException('news not found');
    }

    return await this.prisma.new.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    this.logger.log('remove');
    let news = await this.prisma.new.findUnique({
      where: { id },
    });
    if (!news) {
      throw new NotFoundException('news not found');
    }

    return await this.prisma.new.delete({
      where: { id },
    });
  }
}
