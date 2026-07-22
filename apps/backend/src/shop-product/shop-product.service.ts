import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';
import { CreateShopProductDto } from './dto/create-shop-product.dto';
import { UpdateShopProductDto } from './dto/update-shop-product.dto';

@Injectable()
export class ShopProductService {
  constructor(private readonly prisma: PrismaClientService) {}
  private logger = new Logger('ShopProduct service');
  async create(data: CreateShopProductDto, req: Request) {
    this.logger.log('create');

    const productItem = await this.prisma.productItem.findUnique({
      where: { id: data.product_item_id },
    });
    if (!productItem) {
      throw new NotFoundException('productItem not found');
    }

    const admin = req['user'];

    return await this.prisma.shopProduct.create({
      data: {
        ...data,
        shop_id: admin.shop_id,
      },
    });
  }

  async findAll() {
    this.logger.log('findAll');
    const shopProducts = await this.prisma.shopProduct.findMany({
      where: {
        work_status: 'WORKING',
        shop: { work_status: 'WORKING' },
      },
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
          where: { order: { status: 'FINISHED' } },
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

    const shopProducts = await this.prisma.shopProduct.findMany({
      where: {
        shop_id: sId,
        work_status: 'WORKING',
        product_item: { product_id: pId },
        shop: { work_status: 'WORKING' },
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
        shop_id: sId,
        work_status: 'WORKING',
        NOT: { product_item: { product_id: pId } },
        shop: { work_status: 'WORKING' },
      },
      include: {
        product_item: {
          include: {
            product: { select: { id: true, name: true, image: true } },
          },
        },
      },
      take: 20,
    });

    const seenIds = new Set<number>();
    const tavsiyalar = otherSPs
      .map((sp) => sp.product_item?.product)
      .filter(
        (p): p is { id: number; name: string | null; image: string | null } =>
          p != null && !seenIds.has(p.id) && !!seenIds.add(p.id),
      )
      .slice(0, 10)
      .map((p) => ({ id: p.id, name: p.name, image: p.image, count: 0 }));

    return { items, tavsiyalar };
  }
  async findOne(id: number) {
    this.logger.log('findOne');
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
              },
            },
          },
        },
      },
    });
    if (!shopProduct) {
      throw new NotFoundException('shopProduct not found');
    }

    return shopProduct;
  }

  async update(id: number, data: UpdateShopProductDto) {
    this.logger.log('update');
    if (data.product_item_id) {
      const productItem = await this.prisma.productItem.findUnique({
        where: { id: data.product_item_id },
      });
      if (!productItem) {
        throw new NotFoundException('productItem not found');
      }
    }

    return await this.prisma.shopProduct.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    this.logger.log('remove (archive)');
    const shopProduct = await this.prisma.shopProduct.findUnique({
      where: { id },
    });
    if (!shopProduct) {
      throw new NotFoundException('shopProduct not found');
    }

    return await this.prisma.shopProduct.update({
      where: { id },
      data: { work_status: 'DELETED' },
    });
  }
}
