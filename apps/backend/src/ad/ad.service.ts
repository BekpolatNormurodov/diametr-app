import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';
import { CreateAdDto } from './dto/create-ad-dto';
import { AD_TYPE } from '@prisma/client';
import { UpdateAdDto } from './dto/update-ad-dto';

@Injectable()
export class AdService {
  constructor(private readonly prisma: PrismaClientService) {}
  private logger = new Logger('Ad service');
  async create(data: CreateAdDto) {
    this.logger.log('create');

    // A banner may be static (no link target). Only validate the target when an
    // id is actually provided — otherwise findUnique({ where: { id: undefined } })
    // throws a Prisma validation error.
    if (data.type == AD_TYPE.SHOP && data.shop_id != null) {
      const shop = await this.prisma.shop.findUnique({ where: { id: data.shop_id } });
      if (!shop) throw new NotFoundException('shop not found');
    } else if (data.type == AD_TYPE.REGION && data.region_id != null) {
      const region = await this.prisma.region.findUnique({ where: { id: data.region_id } });
      if (!region) throw new NotFoundException('region not found');
    } else if (data.type == AD_TYPE.PRODUCT && data.product_id != null) {
      const product = await this.prisma.product.findUnique({ where: { id: data.product_id } });
      if (!product) throw new NotFoundException('product not found');
    } else if (data.type == AD_TYPE.WORKER && data.worker_id != null) {
      const worker = await this.prisma.worker.findUnique({ where: { id: data.worker_id } });
      if (!worker) throw new NotFoundException('worker not found');
    }

    return await this.prisma.ad.create({
      data: data,
    });
  }

  async findAll() {
    this.logger.log('findAll');
    const payments = await this.prisma.ad.findMany({
      orderBy: { id: 'desc' },
      include: {
        shop: true,
        worker: true,
        region: true,
        product: true,
      },
    });
    return payments;
  }
  async findOne(id: number) {
    this.logger.log('findOne');
    let payment = await this.prisma.ad.findUnique({
      where: { id },

      include: {
        shop: true,
        worker: true,
        region: true,
        product: true,
      },
    });
    if (!payment) {
      throw new NotFoundException('ad not found');
    }

    return payment;
  }

  async update(id: number, data: UpdateAdDto) {
    this.logger.log('update');
    let ad = await this.prisma.ad.findUnique({
      where: { id },
    });
    if (!ad) {
      throw new NotFoundException('ad not found');
    }
    // Validate the link target only when its id is present (static banner = none).
    if (data.type) {
      if (data.type == AD_TYPE.SHOP && data.shop_id != null) {
        const shop = await this.prisma.shop.findUnique({ where: { id: data.shop_id } });
        if (!shop) throw new NotFoundException('shop not found');
      } else if (data.type == AD_TYPE.REGION && data.region_id != null) {
        const region = await this.prisma.region.findUnique({ where: { id: data.region_id } });
        if (!region) throw new NotFoundException('region not found');
      } else if (data.type == AD_TYPE.PRODUCT && data.product_id != null) {
        const product = await this.prisma.product.findUnique({ where: { id: data.product_id } });
        if (!product) throw new NotFoundException('product not found');
      } else if (data.type == AD_TYPE.WORKER && data.worker_id != null) {
        const worker = await this.prisma.worker.findUnique({ where: { id: data.worker_id } });
        if (!worker) throw new NotFoundException('worker not found');
      }
    }

    return await this.prisma.ad.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    this.logger.log('remove');
    let payment = await this.prisma.ad.findUnique({
      where: { id },
    });
    if (!payment) {
      throw new NotFoundException('ad not found');
    }

    return await this.prisma.ad.delete({
      where: { id },
    });
  }
}
