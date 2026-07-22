import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';
import { generatePassword } from 'src/_utils/number.gen';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaClientService) {}
  private logger = new Logger('Admin service');
  async create(data: CreateAdminDto) {
    this.logger.log('create');
    let admin = await this.prisma.admin.findUnique({
      where: { phone: data.phone },
    });
    if (admin) {
      throw new BadRequestException('This phone is used');
    }

    let shop = await this.prisma.shop.findUnique({
      where: {
        id: data.shop_id,
      },
    });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    let password = generatePassword({
      length: 8,
    });
    data.password = password;

    admin = await this.prisma.admin.create({
      data: data,
    });
    return admin;
  }

  async findAll() {
    this.logger.log('findAll');
    const admins = await this.prisma.admin.findMany({
      include: { shop: true },
    });
    return admins;
  }
  async findOne(id: number) {
    this.logger.log('findOne');
    let admin = await this.prisma.admin.findUnique({
      where: { id },
    });
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return admin;
  }

  async update(id: number, data: UpdateAdminDto) {
    this.logger.log('update');
    let admin = await this.prisma.admin.findUnique({
      where: { id },
    });
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return await this.prisma.admin.update({
      where: { id },
      data,
    });
  }

  async updateMe(id: number, chat_id: string) {
    this.logger.log('updateMe');
    return await this.prisma.admin.update({
      where: { id },
      data: { chat_id },
      include: { shop: true },
    });
  }

  async remove(id: number) {
    this.logger.log('remove');
    let admin = await this.prisma.admin.findUnique({
      where: { id },
    });
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return await this.prisma.admin.delete({
      where: { id },
    });
  }
}
