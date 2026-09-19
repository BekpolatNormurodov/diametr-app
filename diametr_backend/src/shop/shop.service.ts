import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';
import {
  CATALOG_LIVE_STOCK_WHERE,
  LIVE_STOCK_WHERE,
  SOLD_ORDER_PRODUCT_WHERE,
} from 'src/shop-product/stock.utils';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import {
  SHOP_PUBLIC_ADMIN_SELECT,
  SHOP_PUBLIC_SELECT,
  toPublicShop,
} from './shop-public.select';

@Injectable()
export class ShopService {
  constructor(private readonly prisma: PrismaClientService) {}
  private logger = new Logger('Shop service');

  async create(data: CreateShopDto) {
    this.logger.log('create');

    const region = await this.prisma.region.findUnique({
      where: { id: data.region_id },
    });

    if (!region) {
      throw new NotFoundException('Region not found');
    }

    // Apply free trial
    const settings = await this.prisma.settings.findUnique({
      where: { id: 1 },
    });
    const trialMonths =
      data.free_trial_months ?? settings?.free_trial_months ?? 2;

    let expired: Date | null = null;
    if (trialMonths > 0) {
      expired = new Date();
      expired.setMonth(expired.getMonth() + trialMonths);
    }

    const { free_trial_months: _, ...shopData } = data;
    const shop = await this.prisma.shop.create({
      data: { ...shopData, ...(expired ? { expired } : {}) },
    });

    // Log the free trial
    await this.prisma.shopBalanceLog.create({
      data: {
        shop_id: shop.id,
        amount: 0,
        type: 'FREE_TRIAL',
        note:
          trialMonths > 0
            ? `Bepul sinov: ${trialMonths} oy → ${expired!.toISOString().slice(0, 10)}`
            : 'Bepul sinov berilmadi',
        balance_after: 0,
      },
    });

    return shop;
  }

  /**
   * `full` = every column plus stock totals (SUPER only: /shop/all-admin, or
   * /shop/all with a SUPER token). Otherwise the PUBLIC shape: no billing or
   * internal fields (balance, expired, auto_payment, inn, stock value).
   */
  async findAll(regions?: string, allStatus = false, full = false) {
    this.logger.log('findAll');
    const regionIds = regions
      ? regions.split(',').map(Number).filter(Boolean)
      : null;
    const where: Prisma.ShopWhereInput = {
      ...(allStatus
        ? { work_status: { not: 'DELETED' } }
        : { work_status: 'WORKING' }),
      ...(regionIds && regionIds.length > 0
        ? { region_id: { in: regionIds } }
        : {}),
    };

    if (!full) {
      const publicShops = await this.prisma.shop.findMany({
        where,
        select: {
          ...SHOP_PUBLIC_SELECT,
          region: { select: { id: true, name: true } },
          _count: {
            select: { products: { where: CATALOG_LIVE_STOCK_WHERE } },
          },
        },
        orderBy: { id: 'desc' },
      });
      return publicShops.map(({ _count, ...shop }) => ({
        ...shop,
        product_count: _count.products,
      }));
    }

    const shops = await this.prisma.shop.findMany({
      where,
      include: {
        region: { select: { id: true, name: true } },
        products: {
          // Not filtered by shop status: /all-admin also lists blocked shops
          // and their stock counts.
          where: CATALOG_LIVE_STOCK_WHERE,
          select: { count: true, price: true },
        },
      },
      orderBy: { id: 'desc' },
    });

    return shops.map(({ products, ...shop }) => ({
      ...shop,
      product_count: products.length,
      total_stock: products.reduce((s, p) => s + (p.count ?? 0), 0),
      // eslint-disable-next-line
      total_value: products.reduce((s, p) => {
        return s + (p.count ?? 0) * (p.price ?? 0);
      }, 0),
    }));
  }

  /**
   * Find all shops carrying a given product (resolved via ShopProduct → ProductItem → product_id).
   * Optionally filter by region IDs (comma-separated string from the mobile app).
   * Returns a flat shop list with minimum fields needed for the mobile "shops by product" carousel.
   */
  async findByProduct(productId: number, regions?: string) {
    this.logger.log('findByProduct');
    if (!productId || isNaN(productId)) return [];

    const regionIds = regions
      ? regions
          .split(',')
          .map((s) => parseInt(s, 10))
          .filter((n) => !isNaN(n) && n > 0)
      : null;

    const shops = await this.prisma.shop.findMany({
      where: {
        work_status: 'WORKING',
        ...(regionIds && regionIds.length > 0
          ? { region_id: { in: regionIds } }
          : {}),
        products: {
          some: {
            AND: [LIVE_STOCK_WHERE, { product_item: { product_id: productId } }],
          },
        },
      },
      // PUBLIC: no billing/internal columns.
      select: {
        ...SHOP_PUBLIC_SELECT,
        region: { select: { id: true, name: true } },
      },
      orderBy: { id: 'desc' },
    });

    return shops;
  }

  /**
   * `full` (valid SUPER token) keeps every shop column and the owners' chat_id.
   * The PUBLIC answer (site, mobile) drops balance, expired, auto_payment, inn
   * and gives only the owner's id/fullname/phone/image (mobile shop, cart and
   * order-status screens call the owner's phone).
   */
  async findOne(id: number, full = false) {
    this.logger.log('findOne');
    if (!Number.isInteger(id) || id <= 0) {
      throw new NotFoundException('shop not found');
    }
    const shop = await this.prisma.shop.findUnique({
      where: { id },
      include: {
        // Never return the owner's password (the public answer is narrowed
        // further below).
        admins: {
          select: {
            ...SHOP_PUBLIC_ADMIN_SELECT,
            chat_id: true,
            shop_id: true,
            role: true,
            createdt: true,
            updatedAt: true,
          },
        },
        products: {
          // Empty for a blocked shop; never lists stock of archived catalogue
          // products/variants.
          where: LIVE_STOCK_WHERE,
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
                    desc: true,
                    category_id: true,
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
        },
      },
    });
    if (!shop) throw new NotFoundException('shop not found');

    const products = shop.products
      .map((sp) => {
        const sold_count = sp.order_products.reduce((s, op) => s + op.count, 0);
        const last_sold_date =
          sp.order_products.length > 0
            ? sp.order_products.reduce((latest, op) => {
                const d = op.order?.createdt;
                return d && d > latest ? d : latest;
              }, new Date(0))
            : null;
        return {
          id: sp.product_item?.product?.id ?? sp.id,
          shop_product_id: sp.id,
          name: sp.product_item?.product?.name,
          name_uz: sp.product_item?.product?.name_uz,
          name_ru: sp.product_item?.product?.name_ru,
          image: sp.product_item?.product?.image,
          desc: sp.product_item?.product?.desc,
          price: sp.price,
          bonus_price: sp.bonus_price ?? null,
          count: sp.count,
          sold_count,
          last_sold:
            last_sold_date && last_sold_date.getTime() > 0
              ? last_sold_date
              : null,
          category_id: sp.product_item?.product?.category_id,
          category: sp.product_item?.product?.category,
          product_item_id: sp.product_item_id,
          variant_name: sp.product_item?.name,
          variant_image: sp.product_item?.image,
          color: sp.product_item?.color ?? null,
          size: sp.product_item?.size ?? null,
          value: sp.product_item?.value ? Number(sp.product_item.value) : null,
          unit_type: sp.product_item?.unit_type ?? null,
        };
      })
      .filter((p) => p.name != null || p.name_uz != null || p.name_ru != null);

    if (full) return { ...shop, products };

    const { admins, products: _stock, ...row } = shop;
    return {
      ...toPublicShop(row),
      admins: admins.map(({ id, fullname, phone, image }) => ({
        id,
        fullname,
        phone,
        image,
      })),
      products,
    };
  }

  async update(id: number, data: UpdateShopDto) {
    this.logger.log('update');
    if (!Number.isInteger(id) || id <= 0) {
      throw new NotFoundException('shop not found');
    }
    const shop = await this.prisma.shop.findUnique({
      where: { id },
    });
    if (!shop) {
      throw new NotFoundException('shop not found');
    }

    if (data.region_id) {
      const region = await this.prisma.region.findUnique({
        where: { id: data.region_id },
      });
      if (!region) {
        throw new NotFoundException('Region not found');
      }
    }

    // free_trial_months only applies on create (not a column); `expired` is
    // the dashboard's subscription bonus / cancel. work_status is left as is:
    // unblocking stays an explicit admin action (the dashboard warns).
    const { free_trial_months: _trial, expired, ...fields } = data;
    let expiredDate: Date | undefined;
    if (expired !== undefined) {
      expiredDate = new Date(expired);
      const year = expiredDate.getUTCFullYear();
      if (isNaN(expiredDate.getTime()) || year < 2020 || year > 2100) {
        throw new BadRequestException("Obuna tugash sanasi noto'g'ri");
      }
    }

    return await this.prisma.shop.update({
      where: { id },
      data: {
        ...fields,
        ...(expiredDate ? { expired: expiredDate } : {}),
      },
    });
  }

  async remove(id: number) {
    this.logger.log('remove');
    if (!Number.isInteger(id) || id <= 0) {
      throw new NotFoundException('shop not found');
    }
    const shop = await this.prisma.shop.findUnique({
      where: { id },
    });
    if (!shop) {
      throw new NotFoundException('shop not found');
    }

    // Deleting the shop would leave its stock WORKING with shop_id NULL
    // (a buyable offer that can never be checked out). Archive it in the same
    // transaction, so a failed delete leaves everything as it was.
    try {
      const [, deleted] = await this.prisma.$transaction([
        this.prisma.shopProduct.updateMany({
          where: { shop_id: id, work_status: { not: 'DELETED' } },
          data: { work_status: 'DELETED' },
        }),
        this.prisma.shop.delete({
          where: { id },
        }),
      ]);
      return deleted;
    } catch (e) {
      // shop_balance_log keeps the shop's payment history and may not lose
      // its shop (FK RESTRICT). Say so instead of a 500.
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2003'
      ) {
        throw new BadRequestException(
          "Do'konni o'chirib bo'lmaydi: unda to'lov tarixi bor. Uning o'rniga do'konni bloklang",
        );
      }
      throw e;
    }
  }

  async toggleBlock(id: number) {
    const shop = await this.prisma.shop.findUnique({ where: { id } });
    if (!shop) throw new NotFoundException('shop not found');
    const newStatus = shop.work_status === 'BLOCKED' ? 'WORKING' : 'BLOCKED';
    return this.prisma.shop.update({
      where: { id },
      data: { work_status: newStatus },
      select: { id: true, work_status: true },
    });
  }
}
