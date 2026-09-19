import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';
import { WORKER_PUBLIC_SELECT } from 'src/_utils/password';
import { SHOP_PUBLIC_SELECT } from 'src/shop/shop-public.select';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PAYMENT_TYPE } from '@prisma/client';

const NOT_YOUR_SHOP = "Bu to'lov sizning do'koningizga tegishli emas";
const SHOP_TYPE_ONLY = "Do'kon admini faqat do'kon to'lovini (SHOP) kirita oladi";

/** Relations shown by both panels (they read shop.name only). */
const PAYMENT_INCLUDE = {
  shop: { select: SHOP_PUBLIC_SELECT },
  worker: { select: WORKER_PUBLIC_SELECT },
  ad: true,
} as const;

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaClientService) {}
  private logger = new Logger('Payment service');

  /**
   * The route is guarded [ADMIN, SUPER]. Returns the caller's shop id when the
   * caller is a shop owner (ADMIN), `null` when it is SUPER (unrestricted).
   * An ADMIN without a shop can own nothing.
   */
  private ownerShopId(req: any): number | null {
    const role: string | undefined = req?.['role'] ?? req?.['user']?.role;
    if (role === 'SUPER') return null;
    const shopId = req?.['user']?.shop_id;
    if (role !== 'ADMIN' || shopId == null) {
      throw new ForbiddenException(NOT_YOUR_SHOP);
    }
    return shopId;
  }

  /** ADMIN: a payment row of another shop (or of no shop) is off limits. */
  private assertOwnPayment(payment: { shop_id: number | null }, req: any) {
    const ownShop = this.ownerShopId(req);
    if (ownShop !== null && payment.shop_id !== ownShop) {
      throw new ForbiddenException(NOT_YOUR_SHOP);
    }
  }

  async create(data: CreatePaymentDto, req?: any) {
    this.logger.log('create');

    const ownShop = this.ownerShopId(req);
    if (ownShop !== null) {
      // A shop owner records payments of their own shop only.
      if (data.type !== PAYMENT_TYPE.SHOP) {
        throw new BadRequestException(SHOP_TYPE_ONLY);
      }
      data.shop_id = ownShop;
      delete data.ad_id;
      delete data.worker_id;
    }

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

  async findAll(req?: any) {
    this.logger.log('findAll');
    const role: string | undefined = req?.['role'] ?? req?.['user']?.role;
    let where: { shop_id?: number } = {};
    if (role !== 'SUPER') {
      const shopId = req?.['user']?.shop_id;
      if (role !== 'ADMIN' || shopId == null) return [];
      where = { shop_id: shopId };
    }
    const payments = await this.prisma.payment.findMany({
      where,
      include: PAYMENT_INCLUDE,
    });
    return payments;
  }
  async findOne(id: string, req?: any) {
    this.logger.log('findOne');
    let payment = await this.prisma.payment.findUnique({
      where: { id },
      include: PAYMENT_INCLUDE,
    });
    if (!payment) {
      throw new NotFoundException('payment not found');
    }
    this.assertOwnPayment(payment, req);

    return payment;
  }

  async update(id: string, data: UpdatePaymentDto, req?: any) {
    this.logger.log('update');
    let payment = await this.prisma.payment.findUnique({
      where: { id },
    });
    if (!payment) {
      throw new NotFoundException('payment not found');
    }
    this.assertOwnPayment(payment, req);

    const ownShop = this.ownerShopId(req);
    if (ownShop !== null) {
      // The row stays a SHOP payment of the owner's shop.
      if (data.type !== undefined && data.type !== PAYMENT_TYPE.SHOP) {
        throw new BadRequestException(SHOP_TYPE_ONLY);
      }
      data.shop_id = ownShop;
      delete data.ad_id;
      delete data.worker_id;
    }

    if (data.type) {
      // A target id left out of the body keeps the row's current one.
      if (data.type == PAYMENT_TYPE.SHOP) {
        const shopId = data.shop_id ?? payment.shop_id;
        let shop =
          shopId != null
            ? await this.prisma.shop.findUnique({ where: { id: shopId } })
            : null;

        if (!shop) {
          throw new NotFoundException('shop not found');
        }
      }

      if (data.type == PAYMENT_TYPE.AD) {
        const adId = data.ad_id ?? payment.ad_id;
        let ad =
          adId != null
            ? await this.prisma.ad.findUnique({ where: { id: adId } })
            : null;

        if (!ad) {
          throw new NotFoundException('ad not found');
        }
      }

      if (data.type == PAYMENT_TYPE.WORKER) {
        const workerId = data.worker_id ?? payment.worker_id;
        let worker =
          workerId != null
            ? await this.prisma.worker.findUnique({ where: { id: workerId } })
            : null;

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

  async remove(id: string, req?: any) {
    this.logger.log('remove');
    let payment = await this.prisma.payment.findUnique({
      where: { id },
    });
    if (!payment) {
      throw new NotFoundException('payment not found');
    }
    this.assertOwnPayment(payment, req);

    return await this.prisma.payment.delete({
      where: { id },
    });
  }
}
