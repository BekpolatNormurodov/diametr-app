import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PAYMENT_TYPE } from '@prisma/client';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaClientService) {}
  private logger = new Logger('Payment service');
  async create(data: CreatePaymentDto) {
    this.logger.log('create');

    if (data.type == PAYMENT_TYPE.SHOP) {
      let shop = await this.prisma.shop.findUnique({
        where: {
          id: data.shop_id,
        },
      });

      if (!shop) {
        throw new NotFoundException('shop not found');
      }
    }

    if (data.type == PAYMENT_TYPE.AD) {
      let ad = await this.prisma.ad.findUnique({
        where: {
          id: data.ad_id,
        },
      });

      if (!ad) {
        throw new NotFoundException('ad not found');
      }
    }

    if (data.type == PAYMENT_TYPE.WORKER) {
      let worker = await this.prisma.worker.findUnique({
        where: {
          id: data.worker_id,
        },
      });

      if (!worker) {
        throw new NotFoundException('worker not found');
      }
    }

    return await this.prisma.payment.create({
      data: data,
    });
  }

  async findAll() {
    this.logger.log('findAll');
    const payments = await this.prisma.payment.findMany({
      include: {
        shop: true,
        worker: true,
        ad: true,
      },
    });
    return payments;
  }
  async findOne(id: string) {
    this.logger.log('findOne');
    let payment = await this.prisma.payment.findUnique({
      where: { id },

      include: {
        shop: true,
        worker: true,
        ad: true,
      },
    });
    if (!payment) {
      throw new NotFoundException('payment not found');
    }

    return payment;
  }

  async update(id: string, data: UpdatePaymentDto) {
    this.logger.log('update');
    let payment = await this.prisma.payment.findUnique({
      where: { id },
    });
    if (!payment) {
      throw new NotFoundException('payment not found');
    }
    if (data.type) {
      if (data.type == PAYMENT_TYPE.SHOP) {
        let shop = await this.prisma.shop.findUnique({
          where: {
            id: data.shop_id,
          },
        });

        if (!shop) {
          throw new NotFoundException('shop not found');
        }
      }

      if (data.type == PAYMENT_TYPE.AD) {
        let ad = await this.prisma.ad.findUnique({
          where: {
            id: data.ad_id,
          },
        });

        if (!ad) {
          throw new NotFoundException('ad not found');
        }
      }

      if (data.type == PAYMENT_TYPE.WORKER) {
        let worker = await this.prisma.worker.findUnique({
          where: {
            id: data.ad_id,
          },
        });

        if (!worker) {
          throw new NotFoundException('worker not found');
        }
      }
    }

    return await this.prisma.payment.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    this.logger.log('remove');
    let payment = await this.prisma.payment.findUnique({
      where: { id },
    });
    if (!payment) {
      throw new NotFoundException('payment not found');
    }

    return await this.prisma.payment.delete({
      where: { id },
    });
  }
}
