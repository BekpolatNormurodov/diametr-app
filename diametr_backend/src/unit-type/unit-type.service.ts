import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';
import { CreateUnitTypeDto } from './dto/create-unit-type.dto';

@Injectable()
export class UnitTypeService {
  constructor(private readonly prisma: PrismaClientService) {}
  private logger = new Logger('UnitTypeService');

  async create(data: CreateUnitTypeDto) {
    this.logger.log('create');
    // Backward compat: agar name_uz berilmagan bo'lsa, name'dan oladi; aksincha
    const name = data.name ?? data.name_uz ?? '';
    const name_uz = data.name_uz ?? data.name ?? null;
    const payload: any = { ...data, name, name_uz };
    return this.prisma.unitType.create({ data: payload });
  }

  async findAll() {
    this.logger.log('findAll');
    return this.prisma.unitType.findMany({ orderBy: { id: 'asc' } });
  }

  async update(id: number, data: Partial<CreateUnitTypeDto>) {
    this.logger.log('update');
    const unit = await this.prisma.unitType.findUnique({ where: { id } });
    if (!unit) throw new NotFoundException('UnitType not found');
    // Agar name_uz yangilansa va name yuborilmasa, name ni ham sinxronlaymiz
    const patch: any = { ...data };
    if (data.name_uz && !data.name) patch.name = data.name_uz;
    return this.prisma.unitType.update({ where: { id }, data: patch });
  }

  async remove(id: number) {
    this.logger.log('remove');
    const unit = await this.prisma.unitType.findUnique({ where: { id } });
    if (!unit) throw new NotFoundException('UnitType not found');
    return this.prisma.unitType.delete({ where: { id } });
  }
}
