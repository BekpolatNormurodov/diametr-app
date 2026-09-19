import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ORDER_STATUS, Prisma } from '@prisma/client';
import { TelegramService } from 'src/telegram/telegram.service';
import { StoreTelegramService } from 'src/store-telegram/store-telegram.service';
import { OrderCheckoutService, orderLineName } from './order-checkout.service';
import { SHOP_PUBLIC_SELECT, toPublicShop } from 'src/shop/shop-public.select';

const STATUS_CHANGED_MESSAGE =
  "Buyurtma holati allaqachon o'zgargan. Sahifani yangilang";

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaClientService,
    private readonly checkout: OrderCheckoutService,
    private readonly telegram: TelegramService,
    private readonly storeTelegram: StoreTelegramService,
  ) {}
  private logger = new Logger('Order service');
  async create(data: CreateOrderDto, userId?: number) {
    this.logger.log('create');
    // Validation, server-side pricing and the write live in OrderCheckoutService
    // (shared with the Telegram store bot).
    const fullOrder = await this.checkout.placeOrder(data, userId);

    this.telegram.notifyNewOrder(fullOrder).catch(() => {});
    this.storeTelegram.notifyUserNewOrder(fullOrder).catch(() => {});
    // The notifications above read fullOrder concurrently, so it is never
    // mutated: the customer gets a copy without the shop's internal billing
    // fields and with only the public part of the promo code.
    if (!fullOrder) return fullOrder;
    const promo = fullOrder.promo_code;
    return {
      ...fullOrder,
      shop: toPublicShop(fullOrder.shop),
      promo_code: promo
        ? {
            id: promo.id,
            code: promo.code,
            discount_type: promo.discount_type,
            discount_value: Number(promo.discount_value),
          }
        : null,
    };
  }

  /**
   * Panels only (guarded ADMIN/SUPER). A shop owner (ADMIN) sees only the
   * orders of their own shop (none when no shop is assigned); SUPER sees all.
   */
  async findAll(req?: any) {
    this.logger.log('findAll');
    const role: string | undefined = req?.['role'] ?? req?.['user']?.role;
    let where: Prisma.OrderWhereInput = {};
    if (role !== 'SUPER') {
      const shopId = req?.['user']?.shop_id;
      if (role !== 'ADMIN' || shopId == null) return [];
      where = { shop_id: shopId };
    }
    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { id: 'desc' },
      include: {
        shop: { select: SHOP_PUBLIC_SELECT },
        // The panels' Mijoz/Telefon columns (never in a public response).
        user: { select: { id: true, fullname: true, phone: true } },
        products: {
          include: {
            shop_product: {
              include: {
                product_item: {
                  include: {
                    product: {
                      include: { category: true, unit_type: true },
                    },
                    unit_type: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    return orders;
  }
  async findByUser(userId: number) {
    this.logger.log(`findByUser: ${userId}`);
    return this.prisma.order.findMany({
      where: { user_id: userId },
      orderBy: { createdt: 'desc' },
      include: {
        shop: { select: { id: true, name: true, image: true } },
        products: {
          include: {
            shop_product: {
              include: {
                product_item: {
                  include: {
                    product: {
                      include: { category: true, unit_type: true },
                    },
                    unit_type: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: number, req?: any) {
    this.logger.log('findOne');
    this.assertId(id);
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        shop: { select: SHOP_PUBLIC_SELECT },
        products: {
          include: {
            shop_product: {
              include: {
                product_item: {
                  include: {
                    product: {
                      include: { category: true, unit_type: true },
                    },
                    unit_type: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!order) {
      throw new NotFoundException('order not found');
    }
    // USER: own order only; ADMIN: own shop only; SUPER: any.
    this.assertCanAct(order, req, true);

    return order;
  }

  async remove(id: number, req?: any) {
    this.logger.log('remove');
    this.assertId(id);
    const order = await this.prisma.order.findUnique({
      where: { id },
    });
    if (!order) {
      throw new NotFoundException('order not found');
    }
    this.assertCanAct(order, req);

    return await this.prisma.order.delete({
      where: { id },
    });
  }

  /** A non-numeric / non-positive id can never exist (and would 500 in Prisma). */
  private assertId(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new NotFoundException('order not found');
    }
  }

  /**
   * SUPER may act on any order; a shop owner (ADMIN) only on orders of their
   * own shop; a customer (USER, only where allowed) only on their own orders.
   */
  private assertCanAct(
    order: { shop_id: number | null; user_id: number | null },
    req: any,
    allowCustomer = false,
  ) {
    const user = req?.['user'];
    const role: string | undefined = req?.['role'] ?? user?.role;
    if (role === 'SUPER') return;
    if (role === 'ADMIN') {
      if (user?.shop_id != null && order.shop_id === user.shop_id) return;
      throw new ForbiddenException(
        "Bu buyurtma sizning do'koningizga tegishli emas",
      );
    }
    if (role === 'USER' && allowCustomer) {
      if (user?.id != null && order.user_id === user.id) return;
      throw new ForbiddenException('Bu buyurtma sizga tegishli emas');
    }
    throw new ForbiddenException('Access denied');
  }

  /** Stock movements of an order: one entry per stock row, ascending ids. */
  private stockLines(
    products: { shop_product_id: number | null; count: number }[],
  ) {
    const merged = new Map<number, number>();
    for (const p of products) {
      if (p.shop_product_id == null || !(p.count > 0)) continue;
      merged.set(
        p.shop_product_id,
        (merged.get(p.shop_product_id) ?? 0) + p.count,
      );
    }
    return [...merged.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([shopProductId, count]) => ({ shopProductId, count }));
  }

  async finish(id: number, req?: any) {
    this.logger.log('finish');
    this.assertId(id);

    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });
    if (!order) {
      throw new NotFoundException('order not found');
    }
    this.assertCanAct(order, req);

    if (order.status == 'CANCELED') {
      throw new BadRequestException('order is canceled');
    } else if (order.status == 'FINISHED') {
      throw new BadRequestException('order is already finished');
    } else if (order.status == 'CONFIRMED') {
      throw new BadRequestException('order is already confirmed');
    }

    const lines = this.stockLines(order.products);

    const updated = await this.prisma.$transaction(async (tx) => {
      // Claim the transition first: a second finish (double click, another
      // tab, the other replica) waits on this row lock and then matches
      // nothing, so stock can never be taken twice for one order.
      const claimed = await tx.order.updateMany({
        where: { id: order.id, status: ORDER_STATUS.STARTED },
        data: { status: ORDER_STATUS.FINISHED },
      });
      if (claimed.count !== 1) {
        throw new BadRequestException(STATUS_CHANGED_MESSAGE);
      }

      for (const { shopProductId, count } of lines) {
        // Atomic conditional decrement: no lost updates, never below zero.
        const res = await tx.shopProduct.updateMany({
          where: {
            id: shopProductId,
            shop_id: order.shop_id,
            count: { gte: count },
          },
          data: { count: { decrement: count } },
        });
        if (res.count === 1) continue;

        const sp = await tx.shopProduct.findUnique({
          where: { id: shopProductId },
          include: { product_item: { include: { product: true } } },
        });
        if (!sp) {
          throw new NotFoundException(
            `shopProduct not found by id #${shopProductId}`,
          );
        }
        const name = orderLineName(sp);
        if (sp.shop_id !== order.shop_id) {
          throw new BadRequestException(
            `"${name}" bu buyurtma do'koniga tegishli emas`,
          );
        }
        if (
          sp.work_status !== 'WORKING' ||
          sp.product_item?.work_status !== 'WORKING' ||
          sp.product_item?.product?.work_status !== 'WORKING'
        ) {
          // Removed from the shop/catalogue after the order was placed: nobody
          // sees or can edit that stock any more, so it must not block the
          // order. Take what is left, never below zero.
          await tx.shopProduct.updateMany({
            where: { id: shopProductId, count: { lt: count } },
            data: { count: 0 },
          });
          continue;
        }
        throw new BadRequestException(
          `"${name}" omborda yetarli emas: buyurtmada ${count} ta, omborda ${sp.count} ta. Qoldiqni yangilang yoki buyurtmani bekor qiling`,
        );
      }

      return tx.order.findUnique({ where: { id: order.id } });
    });

    this.telegram.notifyOrderFinished(order.id).catch(() => {});
    this.storeTelegram.notifyUserOrderFinished(order).catch(() => {});
    return updated;
  }
  async confirm(id: number, req?: any) {
    this.logger.log('confirm');
    this.assertId(id);

    const order = await this.prisma.order.findUnique({
      where: { id },
    });
    if (!order) {
      throw new NotFoundException('order not found');
    }
    this.assertCanAct(order, req, true);

    if (order.status == 'CANCELED') {
      throw new BadRequestException('order is canceled');
    } else if (order.status == 'STARTED') {
      throw new BadRequestException('order is not finished');
    } else if (order.status == 'CONFIRMED') {
      throw new BadRequestException('order is already confirmed');
    }
    const claimed = await this.prisma.order.updateMany({
      where: { id: order.id, status: ORDER_STATUS.FINISHED },
      data: { status: ORDER_STATUS.CONFIRMED },
    });
    if (claimed.count !== 1) {
      throw new BadRequestException(STATUS_CHANGED_MESSAGE);
    }
    const updated = await this.prisma.order.findUnique({
      where: { id: order.id },
    });
    this.telegram.notifyOrderConfirmed(order.id).catch(() => {});
    this.storeTelegram.notifyUserOrderConfirmed(order).catch(() => {});
    return updated;
  }
  async cancel(id: number, req?: any) {
    this.logger.log('cancel');
    this.assertId(id);

    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { products: true },
    });
    if (!order) {
      throw new NotFoundException('order not found');
    }
    this.assertCanAct(order, req);

    if (order.status == 'CANCELED') {
      throw new BadRequestException('order is already canceled');
    }

    // finish() took the stock; CONFIRMED comes after FINISHED, so both give it back.
    const stockWasTaken =
      order.status === ORDER_STATUS.FINISHED ||
      order.status === ORDER_STATUS.CONFIRMED;
    const lines = stockWasTaken ? this.stockLines(order.products) : [];

    const updated = await this.prisma.$transaction(async (tx) => {
      // Only from the status we just read: a concurrent finish/cancel makes
      // this match nothing instead of restoring stock that was never taken
      // (or restoring it twice).
      const claimed = await tx.order.updateMany({
        where: { id: order.id, status: order.status },
        data: { status: ORDER_STATUS.CANCELED },
      });
      if (claimed.count !== 1) {
        throw new BadRequestException(STATUS_CHANGED_MESSAGE);
      }

      for (const { shopProductId, count } of lines) {
        await tx.shopProduct.updateMany({
          where: { id: shopProductId },
          data: { count: { increment: count } },
        });
      }

      return tx.order.findUnique({ where: { id: order.id } });
    });

    this.telegram.notifyOrderCanceled(order.id).catch(() => {});
    this.storeTelegram.notifyUserOrderCanceled(order).catch(() => {});
    return updated;
  }
}
