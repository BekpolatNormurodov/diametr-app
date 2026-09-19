import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ORDER_SOURCE, Prisma } from '@prisma/client';
import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';
import { PromoCodeService } from 'src/promo-code/promo-code.service';
import { effectivePrice } from 'src/shop-product/stock.utils';
import { CreateOrderDto } from './dto/create-order.dto';

/** Largest value the Int columns order.amount / orderproduct.amount can hold. */
const INT_MAX = 2147483647;

type LineInput = { shop_product_id: number; count: number };

/** "Product (variant)" for customer/shop facing messages. */
export function orderLineName(sp: {
  id: number;
  product_item?: {
    name?: string | null;
    product?: {
      name?: string | null;
      name_uz?: string | null;
      name_ru?: string | null;
    } | null;
  } | null;
}): string {
  const pi = sp.product_item;
  const prod = pi?.product;
  const productName = prod?.name ?? prod?.name_uz ?? prod?.name_ru ?? null;
  const variant = pi?.name ?? null;
  if (productName && variant && variant !== productName) {
    return `${productName} (${variant})`;
  }
  return productName ?? variant ?? `#${sp.id}`;
}

/**
 * The one place an order is priced and written. Used by POST /order (site,
 * mobile, Telegram web app) and by the Telegram store bot checkout, so every
 * channel gets the same checks and the same total.
 *
 * Total = Σ effective price × count (from the DB, never from the client)
 *       − promo discount (on the items only, applied once)
 *       + shop.delivery_amount when delivery_type is FIXED.
 * This is exactly what the site cart and the mobile cart show.
 */
@Injectable()
export class OrderCheckoutService {
  constructor(
    private readonly prisma: PrismaClientService,
    private readonly promoCodeService: PromoCodeService,
  ) {}
  private logger = new Logger('Order checkout');

  /** Validates the lines and merges repeated shop_product_id lines. */
  private mergeLines(products: LineInput[] | undefined | null) {
    if (!Array.isArray(products) || products.length === 0) {
      throw new BadRequestException("Buyurtmada mahsulot yo'q");
    }
    const merged = new Map<number, number>();
    for (const line of products) {
      const id = Number(line?.shop_product_id);
      const count = Number(line?.count);
      if (!Number.isInteger(id) || id <= 0) {
        throw new BadRequestException("Buyurtmadagi mahsulot noto'g'ri ko'rsatilgan");
      }
      if (!Number.isInteger(count) || count < 1) {
        throw new BadRequestException(
          "Mahsulot soni 1 dan kam bo'lmagan butun son bo'lishi kerak",
        );
      }
      merged.set(id, (merged.get(id) ?? 0) + count);
    }
    // Ascending ids: every order/stock transaction touches stock rows in the
    // same order, so they cannot deadlock each other.
    return [...merged.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([shop_product_id, count]) => ({ shop_product_id, count }));
  }

  async placeOrder(data: CreateOrderDto, userId?: number) {
    this.logger.log('placeOrder');
    const shopId = Number(data?.shop_id);
    if (!Number.isInteger(shopId) || shopId <= 0) {
      throw new NotFoundException('shop not found');
    }
    const lines = this.mergeLines(data.products);

    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: { id: true, work_status: true, delivery_amount: true },
    });
    if (!shop) {
      throw new NotFoundException('shop not found');
    }
    if (shop.work_status !== 'WORKING') {
      throw new BadRequestException(
        "Bu do'kon hozircha buyurtma qabul qilmayapti",
      );
    }

    const rows = await this.prisma.shopProduct.findMany({
      where: { id: { in: lines.map((l) => l.shop_product_id) } },
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
    const byId = new Map(rows.map((r) => [r.id, r]));

    let subtotal = 0;
    const priced = lines.map((line) => {
      const sp = byId.get(line.shop_product_id);
      if (!sp) {
        throw new NotFoundException(
          `Savatchadagi mahsulot topilmadi (#${line.shop_product_id}). Savatchani yangilang`,
        );
      }
      const name = orderLineName(sp);
      if (sp.shop_id !== shopId) {
        throw new BadRequestException(`"${name}" bu do'konga tegishli emas`);
      }
      const unit = effectivePrice(sp.price, sp.bonus_price);
      if (
        sp.work_status !== 'WORKING' ||
        sp.product_item?.work_status !== 'WORKING' ||
        sp.product_item?.product?.work_status !== 'WORKING' ||
        unit == null ||
        unit <= 0
      ) {
        throw new BadRequestException(
          `"${name}" hozir sotuvda yo'q. Uni savatchadan olib tashlang`,
        );
      }
      if (line.count > sp.count) {
        throw new BadRequestException(
          sp.count > 0
            ? `"${name}" omborda yetarli emas: ${line.count} ta so'raldi, ${sp.count} ta bor`
            : `"${name}" omborda qolmadi`,
        );
      }
      subtotal += unit * line.count;
      return { line, sp, unit };
    });

    const delivery =
      data.delivery_type === 'FIXED' ? Math.max(0, shop.delivery_amount ?? 0) : 0;
    if (!Number.isSafeInteger(subtotal) || subtotal + delivery > INT_MAX) {
      throw new BadRequestException('Buyurtma summasi juda katta');
    }

    // ── Promo code: validated here, applied once, to the items only ─────
    let promoCodeId: number | null = null;
    let discountPercent: number | null = null;
    let discountAmount: number | null = null;

    if (data.promo_code && userId) {
      const promo = await this.promoCodeService.validate(
        String(data.promo_code).trim().toUpperCase(),
        userId,
        shopId,
      );
      if (promo.min_order_amount != null && subtotal < promo.min_order_amount) {
        throw new BadRequestException(
          `Promokod ${promo.min_order_amount.toLocaleString('ru-RU')} so'mlik xariddan boshlab amal qiladi`,
        );
      }
      const raw =
        promo.discount_type === 'PERCENT'
          ? Math.round((subtotal * promo.discount_value) / 100)
          : Math.round(promo.discount_value);
      promoCodeId = promo.id;
      discountAmount = Math.max(0, Math.min(raw, subtotal));
      discountPercent =
        promo.discount_type === 'PERCENT'
          ? Math.round(promo.discount_value)
          : null;
    }

    const amount = subtotal - (discountAmount ?? 0) + delivery;

    // Clients send the undiscounted items + delivery they showed. The stored
    // total is always the server's; a difference only means a stale cart.
    if (typeof data.amount === 'number' && data.amount !== subtotal + delivery) {
      this.logger.warn(
        `client amount ${data.amount} != server ${subtotal + delivery} (shop ${shopId}, user ${userId ?? '-'})`,
      );
    }

    let order: { id: number };
    try {
      order = await this.prisma.$transaction(async (tx) => {
        const created = await tx.order.create({
          data: {
            shop_id: shopId,
            amount,
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

        for (const { line, sp, unit } of priced) {
          const pi = sp.product_item;
          const prod = pi?.product;
          await tx.orderProduct.create({
            data: {
              order_id: created.id,
              shop_product_id: sp.id,
              count: line.count,
              amount: unit,
              // Snapshot the display name, not the legacy `name` column —
              // products/categories created from the dashboard only ever get
              // name_uz/name_ru, so `name` alone stored NULL on most orders
              // and every order-history view (and the Telegram notification)
              // rendered a blank product/category.
              product_name: prod?.name ?? prod?.name_uz ?? prod?.name_ru ?? null,
              category_name:
                prod?.category?.name ??
                prod?.category?.name_uz ??
                prod?.category?.name_ru ??
                null,
              variant_name: pi?.name ?? null,
              variant_color: pi?.color ?? null,
              variant_value: pi?.value != null ? String(pi.value) : null,
              variant_size: pi?.size ?? null,
              unit_symbol:
                pi?.unit_type?.symbol ?? prod?.unit_type?.symbol ?? null,
            },
          });
        }

        return created;
      });
    } catch (e) {
      if (
        promoCodeId &&
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        // Two orders with the same code at the same moment.
        throw new BadRequestException(
          'Bu promokod siz tomonidan allaqachon ishlatilgan',
        );
      }
      throw e;
    }

    return await this.prisma.order.findUnique({
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
  }
}
