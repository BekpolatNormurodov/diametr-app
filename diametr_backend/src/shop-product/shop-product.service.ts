import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';
import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';
import { CreateShopProductDto } from './dto/create-shop-product.dto';
import { UpdateShopProductDto } from './dto/update-shop-product.dto';
import {
  CATALOG_LIVE_STOCK_WHERE,
  LIVE_STOCK_WHERE,
  SOLD_ORDER_PRODUCT_WHERE,
  effectivePrice,
} from './stock.utils';

const BONUS_PRICE_MESSAGE =
  "Chegirma narxi 0 dan katta va asosiy narxdan kichik bo'lishi kerak";

@Injectable()
export class ShopProductService {
  constructor(private readonly prisma: PrismaClientService) {}
  private logger = new Logger('ShopProduct service');

  /** 400 unless the variant and its product are still in the catalogue. */
  private assertStockable(
    productItem: {
      work_status: string;
      product: { work_status: string } | null;
    } | null,
  ) {
    if (!productItem) {
      throw new NotFoundException('productItem not found');
    }
    if (productItem.work_status !== 'WORKING') {
      throw new BadRequestException(
        "Bu variant katalogdan o'chirilgan, uni do'konga qo'shib bo'lmaydi",
      );
    }
    if (productItem.product?.work_status !== 'WORKING') {
      throw new BadRequestException(
        "Bu mahsulot katalogdan o'chirilgan, uni do'konga qo'shib bo'lmaydi",
      );
    }
  }

  /** A discount must be positive and below the list price it applies to. */
  private assertBonusPrice(
    price: number | null | undefined,
    bonusPrice: number | null | undefined,
  ) {
    if (bonusPrice == null) return;
    if (bonusPrice <= 0 || price == null || bonusPrice >= price) {
      throw new BadRequestException(BONUS_PRICE_MESSAGE);
    }
  }

  /**
   * Idempotent per (shop, variant): when the shop already has a WORKING row for
   * this variant, that row is updated with the body and returned instead of a
   * duplicate being inserted. POST carries the full desired state, so a missing
   * bonus_price means "no discount".
   */
  async create(data: CreateShopProductDto, req: Request) {
    this.logger.log('create');

    const admin = req['user'];
    if (admin?.shop_id == null) {
      // Stock must belong to a shop; a row with shop_id NULL shows up as a
      // buyable offer on the site but can never be checked out.
      throw new BadRequestException("Do'kon aniqlanmadi");
    }
    const shopId: number = admin.shop_id;
    const bonusPrice = data.bonus_price ?? null;
    this.assertBonusPrice(data.price, bonusPrice);

    return await this.prisma.$transaction(
      async (tx) => {
        // Row lock on the variant serialises concurrent saves of the same
        // variant (double submit, two tabs, two replicas) so the lookup below
        // cannot miss a row another request is inserting, and makes this wait
        // for a concurrent archive of the variant to commit first.
        const locked = await tx.$queryRaw<{ id: number }[]>`
          SELECT id FROM productitem WHERE id = ${data.product_item_id} FOR UPDATE
        `;
        if (locked.length === 0) {
          throw new NotFoundException('productItem not found');
        }

        const productItem = await tx.productItem.findUnique({
          where: { id: data.product_item_id },
          select: {
            work_status: true,
            product: { select: { work_status: true } },
          },
        });
        this.assertStockable(productItem);

        const existing = await tx.shopProduct.findFirst({
          where: {
            shop_id: shopId,
            product_item_id: data.product_item_id,
            work_status: 'WORKING',
          },
          orderBy: { id: 'asc' },
        });

        if (existing) {
          return await tx.shopProduct.update({
            where: { id: existing.id },
            data: {
              price: data.price,
              count: data.count,
              bonus_price: bonusPrice,
            },
          });
        }

        return await tx.shopProduct.create({
          data: {
            product_item_id: data.product_item_id,
            price: data.price,
            count: data.count,
            bonus_price: bonusPrice,
            shop_id: shopId,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }

  async findAll() {
    this.logger.log('findAll');
    // Hides stock of archived variants/products and of deleted or blocked
    // shops.
    return this.listWithSales(LIVE_STOCK_WHERE);
  }

  /**
   * GET /shop-product/my (ADMIN): the caller's own shop stock, same item shape
   * as /all. Deliberately NOT filtered by the shop's work_status: the owner of
   * a BLOCKED shop (expired subscription, or blocked by SUPER) must still see
   * and manage their stock while renewing; customers never see it because
   * every public read uses LIVE_STOCK_WHERE.
   */
  async findMine(req: Request) {
    this.logger.log('findMine');
    const shopId = req['user']?.shop_id;
    if (!Number.isInteger(shopId)) return [];
    return this.listWithSales({
      AND: [CATALOG_LIVE_STOCK_WHERE, { shop_id: shopId }],
    });
  }

  /** Stock rows with catalogue data plus sold_count / last_sold. */
  private async listWithSales(where: Prisma.ShopProductWhereInput) {
    const shopProducts = await this.prisma.shopProduct.findMany({
      where,
      orderBy: { id: 'desc' },
      include: {
        product_item: {
          include: {
            unit_type: true,
            product: {
              include: {
                unit_type: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                    name_uz: true,
                    name_ru: true,
                  },
                },
              },
            },
          },
        },
        order_products: {
          // FINISHED and CONFIRMED orders both took the stock: both are sold.
          where: SOLD_ORDER_PRODUCT_WHERE,
          select: { count: true, order: { select: { createdt: true } } },
        },
      },
    });

    return shopProducts.map((sp) => {
      const sold_count = sp.order_products.reduce((s, op) => s + op.count, 0);
      const last_sold =
        sp.order_products.length > 0
          ? sp.order_products.reduce((latest, op) => {
              const d = op.order?.createdt;
              return d && d > latest ? d : latest;
            }, new Date(0))
          : null;
      const { order_products, ...rest } = sp;
      return {
        ...rest,
        sold_count,
        last_sold: last_sold && last_sold.getTime() > 0 ? last_sold : null,
      };
    });
  }

  async findAllInProduct(product_id: string, shop_id: string) {
    this.logger.log('findAllInProduct');
    const pId = parseInt(product_id);
    const sId = parseInt(shop_id);
    if (isNaN(pId) || isNaN(sId)) {
      return { items: [], tavsiyalar: [] };
    }

    const shopProducts = await this.prisma.shopProduct.findMany({
      where: {
        AND: [
          LIVE_STOCK_WHERE,
          { shop_id: sId, product_item: { product_id: pId } },
        ],
      },
      include: {
        product_item: {
          select: {
            id: true,
            name: true,
            image: true,
            desc: true,
            value: true,
            color: true,
            size: true,
            unit_type: { select: { id: true, name: true, symbol: true } },
          },
        },
      },
      orderBy: { price: 'asc' },
    });

    const items = shopProducts.map((sp) => ({
      id: sp.id,
      price: sp.price,
      bonus_price: sp.bonus_price ?? null,
      effective_price: effectivePrice(sp.price, sp.bonus_price),
      count: sp.count,
      name: sp.product_item?.name,
      image: sp.product_item?.image,
      desc: sp.product_item?.desc,
      value: sp.product_item?.value ? Number(sp.product_item.value) : null,
      color: sp.product_item?.color ?? null,
      size: sp.product_item?.size ?? null,
      unit_type: sp.product_item?.unit_type ?? null,
    }));

    // Recommendations: other products in the same shop
    const otherSPs = await this.prisma.shopProduct.findMany({
      where: {
        AND: [
          LIVE_STOCK_WHERE,
          { shop_id: sId, NOT: { product_item: { product_id: pId } } },
        ],
      },
      include: {
        product_item: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                name_uz: true,
                name_ru: true,
                image: true,
              },
            },
          },
        },
      },
      take: 20,
    });

    const seenIds = new Set<number>();
    const tavsiyalar = otherSPs
      .map((sp) => sp.product_item?.product)
      .filter(
        (p): p is {
          id: number;
          name: string | null;
          name_uz: string | null;
          name_ru: string | null;
          image: string | null;
        } => p != null && !seenIds.has(p.id) && !!seenIds.add(p.id),
      )
      .slice(0, 10)
      .map((p) => ({
        id: p.id,
        name: p.name,
        name_uz: p.name_uz,
        name_ru: p.name_ru,
        image: p.image,
        count: 0,
      }));

    return { items, tavsiyalar };
  }
  /**
   * Public; clients use it to revalidate carts. Archived rows are still
   * returned (only a missing id is 404) with `available: false`.
   */
  async findOne(id: number) {
    this.logger.log('findOne');
    if (!Number.isInteger(id) || id <= 0) {
      throw new NotFoundException('shopProduct not found');
    }
    const shopProduct = await this.prisma.shopProduct.findUnique({
      where: { id },
      include: {
        product_item: {
          include: {
            unit_type: true,
            product: {
              select: {
                id: true,
                name: true,
                name_uz: true,
                name_ru: true,
                image: true,
                work_status: true,
              },
            },
          },
        },
        shop: {
          select: {
            id: true,
            name: true,
            image: true,
            delivery_amount: true,
            work_status: true,
          },
        },
      },
    });
    if (!shopProduct) {
      throw new NotFoundException('shopProduct not found');
    }

    const available =
      shopProduct.work_status === 'WORKING' &&
      shopProduct.shop_id != null &&
      shopProduct.shop?.work_status === 'WORKING' &&
      shopProduct.product_item?.work_status === 'WORKING' &&
      shopProduct.product_item?.product?.work_status === 'WORKING' &&
      shopProduct.price != null &&
      shopProduct.count > 0;

    return {
      ...shopProduct,
      effective_price: effectivePrice(
        shopProduct.price,
        shopProduct.bonus_price,
      ),
      available,
    };
  }

  /**
   * Loads a stock row and enforces ownership: a shop owner (ADMIN) may only touch
   * rows of their own shop; the platform SUPER may touch any.
   */
  private async findOwned(id: number, req: Request) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new NotFoundException('shopProduct not found');
    }
    const shopProduct = await this.prisma.shopProduct.findUnique({
      where: { id },
    });
    if (!shopProduct) {
      throw new NotFoundException('shopProduct not found');
    }
    const user = req['user'];
    if (
      user?.role === 'ADMIN' &&
      (user.shop_id == null || shopProduct.shop_id !== user.shop_id)
    ) {
      throw new ForbiddenException("Bu mahsulot sizning do'koningizga tegishli emas");
    }
    return shopProduct;
  }

  async update(id: number, data: UpdateShopProductDto, req: Request) {
    this.logger.log('update');
    const existing = await this.findOwned(id, req);
    if (existing.work_status !== 'WORKING') {
      // Already removed from the shop (e.g. in another tab, or archived with
      // its catalogue product); updating it would silently change nothing.
      throw new NotFoundException('shopProduct not found');
    }
    if (
      data.product_item_id !== undefined &&
      data.product_item_id !== existing.product_item_id
    ) {
      // Moving a stock row to another variant would rewrite what past orders
      // point at and could duplicate the shop's row for that variant.
      throw new BadRequestException(
        "Do'kon mahsulotining variantini o'zgartirib bo'lmaydi",
      );
    }

    const productItem =
      existing.product_item_id == null
        ? null
        : await this.prisma.productItem.findUnique({
            where: { id: existing.product_item_id },
            select: {
              work_status: true,
              product: { select: { work_status: true } },
            },
          });
    this.assertStockable(productItem);

    const priceGiven = data.price !== undefined;
    const bonusGiven = data.bonus_price !== undefined;
    const finalPrice = priceGiven ? data.price : existing.price;
    if (bonusGiven) {
      this.assertBonusPrice(finalPrice, data.bonus_price);
    } else if (
      priceGiven &&
      existing.bonus_price != null &&
      existing.bonus_price > 0
    ) {
      // The stored discount must stay below a newly lowered price.
      this.assertBonusPrice(finalPrice, existing.bonus_price);
    }

    return await this.prisma.shopProduct.update({
      where: { id },
      data: {
        ...(priceGiven ? { price: data.price } : {}),
        ...(data.count !== undefined ? { count: data.count } : {}),
        ...(bonusGiven ? { bonus_price: data.bonus_price } : {}),
      },
    });
  }

  async remove(id: number, req: Request) {
    this.logger.log('remove (archive)');
    await this.findOwned(id, req);

    return await this.prisma.shopProduct.update({
      where: { id },
      data: { work_status: 'DELETED' },
    });
  }
}
