import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';

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

  async findAll(regions?: string, allStatus = false) {
    this.logger.log('findAll');
    const regionIds = regions
      ? regions.split(',').map(Number).filter(Boolean)
      : null;
    const shops = await this.prisma.shop.findMany({
      where: {
        ...(allStatus
          ? { work_status: { not: 'DELETED' } }
          : { work_status: 'WORKING' }),
        ...(regionIds && regionIds.length > 0
          ? { region_id: { in: regionIds } }
          : {}),
      },
      include: {
        region: { select: { id: true, name: true } },
        products: {
          where: { work_status: 'WORKING' },
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
            work_status: 'WORKING',
            product_item: { product_id: productId },
          },
        },
      },
      include: {
        region: { select: { id: true, name: true } },
      },
      orderBy: { id: 'desc' },
    });

    return shops;
  }

  async findOne(id: number) {
    this.logger.log('findOne');
    const shop = await this.prisma.shop.findUnique({
      where: { id },
      include: {
        admins: true,
        products: {
          where: { work_status: 'WORKING' },
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
              where: { order: { status: 'FINISHED' } },
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
      .filter((p) => p.name != null);

    return { ...shop, products };
  }

  async update(id: number, data: UpdateShopDto) {
    this.logger.log('update');
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

    return await this.prisma.shop.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    this.logger.log('remove');
    const shop = await this.prisma.shop.findUnique({
      where: { id },
    });
    if (!shop) {
      throw new NotFoundException('shop not found');
    }

    return await this.prisma.shop.delete({
      where: { id },
    });
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
