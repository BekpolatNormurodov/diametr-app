import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ORDER_SOURCE, ORDER_STATUS } from '@prisma/client';
import { PromoCodeService } from 'src/promo-code/promo-code.service';
import { TelegramService } from 'src/telegram/telegram.service';
import { StoreTelegramService } from 'src/store-telegram/store-telegram.service';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaClientService,
    private readonly promoCodeService: PromoCodeService,
    private readonly telegram: TelegramService,
    private readonly storeTelegram: StoreTelegramService,
  ) {}
  private logger = new Logger('Order service');
  async create(data: CreateOrderDto, userId?: number) {
    this.logger.log('create');
    const shop = await this.prisma.shop.findUnique({
      where: { id: data.shop_id },
    });
    if (!shop) {
      throw new NotFoundException('shop not found');
    }

    // ── Promo code validation ──────────────────────────────────────
    let promoCodeId: number | null = null;
    let discountPercent: number | null = null;
    let discountAmount: number | null = null;

    if (data.promo_code && userId) {
      const promo = await this.promoCodeService.validate(
        data.promo_code.toUpperCase(),
        userId,
        data.shop_id,
      );
      promoCodeId = promo.id;
      if (promo.discount_type === 'PERCENT') {
        discountPercent = promo.discount_value;
        discountAmount = Math.round((data.amount * promo.discount_value) / 100);
      } else {
        discountPercent = null;
        discountAmount = Math.round(promo.discount_value);
      }
    }

    const finalAmount =
      discountAmount != null ? data.amount - discountAmount : data.amount;

    const order = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          shop_id: data.shop_id,
          amount: finalAmount,
          lat: data.lat,
          lon: data.lon,
          address: data.address,
          desc: data.desc,
          payment_type: data.payment_type,
          delivery_type: data.delivery_type,
          source: data.source ?? ORDER_SOURCE.SITE,
          user_id: userId ?? null,
          promo_code_id: promoCodeId,
          discount_percent: discountPercent,
          discount_amount: discountAmount,
        },
      });

      // Mark promo code as used
      if (promoCodeId && userId) {
        await tx.promoCodeUse.create({
          data: { promo_code_id: promoCodeId, user_id: userId },
        });
      }

      await Promise.all(
        data.products
          .map((item) => {
            return { ...item, order_id: order.id };
          })
          .map(async (e) => {
            const shopProduct = await tx.shopProduct.findUnique({
              where: {
                id: e.shop_product_id,
              },
              include: {
                product_item: {
                  include: {
                    product: {
                      include: {
                        category: true,
                        unit_type: true,
                      },
                    },
                    unit_type: true,
                  },
                },
              },
            });

            if (!shopProduct) {
              throw new NotFoundException(
                `shopProduct not found by id #${e.shop_product_id}`,
              );
            } else if (e.count > shopProduct.count) {
              throw new BadRequestException(
                `Product isnot enough not #${shopProduct.product_item.product.name} ,${shopProduct.product_item.name}  - ${e.count}x`,
              );
            }

            const pi = shopProduct.product_item;
            const prod = pi?.product;
            await tx.orderProduct.create({
              data: {
                ...e,
                amount: shopProduct.bonus_price ?? shopProduct.price,
                product_name: prod?.name ?? null,
                category_name: prod?.category?.name ?? null,
                variant_name: pi?.name ?? null,
                variant_color: pi?.color ?? null,
                variant_value: pi?.value != null ? String(pi.value) : null,
                variant_size: pi?.size ?? null,
                unit_symbol:
                  pi?.unit_type?.symbol ?? prod?.unit_type?.symbol ?? null,
              },
            });
          }),
      );

      return order;
    });

    const fullOrder = await this.prisma.order.findUnique({
      where: { id: order.id },
      include: {
        shop: true,
        promo_code: true,
        products: {
          include: {
            shop_product: {
              include: {
                product_item: {
                  include: {
                    product: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    this.telegram.notifyNewOrder(fullOrder).catch(() => {});
    this.storeTelegram.notifyUserNewOrder(fullOrder).catch(() => {});
    return fullOrder;
  }

  async findAll() {
    this.logger.log('findAll');
    const orders = await this.prisma.order.findMany({
      orderBy: { id: 'desc' },
      include: {
        shop: true,
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

  async findOne(id: number) {
    this.logger.log('findOne');
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        shop: true,
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

    return order;
  }

  async remove(id: number) {
    this.logger.log('remove');
    const order = await this.prisma.order.findUnique({
      where: { id },
    });
    if (!order) {
      throw new NotFoundException('order not found');
    }

    return await this.prisma.order.delete({
      where: { id },
    });
  }

  async finish(id: number) {
    this.logger.log('finish');

    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });
    if (!order) {
      throw new NotFoundException('order not found');
    }

    if (order.status == 'CANCELED') {
      throw new BadRequestException('order is canceled');
    } else if (order.status == 'FINISHED') {
      throw new BadRequestException('order is already finished');
    } else if (order.status == 'CONFIRMED') {
      throw new BadRequestException('order is already confirmed');
    }

    return await this.prisma.$transaction(async (tx) => {
      await Promise.all(
        order.products.map(async (e) => {
          const shopProduct = await tx.shopProduct.findUnique({
            where: {
              id: e.shop_product_id,
            },
            include: {
              product_item: {
                include: {
                  product: true,
                },
              },
            },
          });

          if (!shopProduct) {
            throw new NotFoundException(
              `shopProduct not found by id #${e.shop_product_id}`,
            );
          } else if (e.count > shopProduct.count) {
            throw new BadRequestException(
              `Product isnot enough not #${shopProduct.product_item.product.name} ,${shopProduct.product_item.name}  - ${e.count}x`,
            );
          }

          await tx.shopProduct.update({
            where: {
              id: e.shop_product_id,
            },
            data: {
              count: shopProduct.count - e.count,
            },
          });
        }),
      );

      const updated = await tx.order.update({
        where: {
          id: order.id,
        },
        data: {
          status: ORDER_STATUS.FINISHED,
        },
      });
      this.telegram.notifyOrderFinished(order.id).catch(() => {});
      this.storeTelegram.notifyUserOrderFinished(order).catch(() => {});
      return updated;
    });
  }
  async confirm(id: number) {
    this.logger.log('finish');

    const order = await this.prisma.order.findUnique({
      where: { id },
    });
    if (!order) {
      throw new NotFoundException('order not found');
    }

    if (order.status == 'CANCELED') {
      throw new BadRequestException('order is canceled');
    } else if (order.status == 'STARTED') {
      throw new BadRequestException('order is not finished');
    } else if (order.status == 'CONFIRMED') {
      throw new BadRequestException('order is already confirmed');
    }
    const updated = await this.prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        status: ORDER_STATUS.CONFIRMED,
      },
    });
    this.telegram.notifyOrderConfirmed(order.id).catch(() => {});
    this.storeTelegram.notifyUserOrderConfirmed(order).catch(() => {});
    return updated;
  }
  async cancel(id: number) {
    this.logger.log('confirm');

    const order = await this.prisma.order.findUnique({
      where: { id },
    });
    if (!order) {
      throw new NotFoundException('order not found');
    }

    if (order.status == 'CANCELED') {
      throw new BadRequestException('order is already canceled');
    }

    // If order was FINISHED, restore stock
    const wasFinished = order.status === 'FINISHED';

    const updated = await this.prisma.$transaction(async (tx) => {
      if (wasFinished) {
        const orderProducts = await tx.orderProduct.findMany({
          where: { order_id: id },
        });
        await Promise.all(
          orderProducts.map(async (op) => {
            await tx.shopProduct.update({
              where: { id: op.shop_product_id },
              data: { count: { increment: op.count } },
            });
          }),
        );
      }

      return tx.order.update({
        where: { id: order.id },
        data: { status: ORDER_STATUS.CANCELED },
      });
    });

    this.telegram.notifyOrderCanceled(order.id).catch(() => {});
    this.storeTelegram.notifyUserOrderCanceled(order).catch(() => {});
    return updated;
  }
}
