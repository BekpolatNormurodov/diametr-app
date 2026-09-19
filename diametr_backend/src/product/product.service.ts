import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';
import { LIVE_STOCK_WHERE } from 'src/shop-product/stock.utils';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaClientService) {}
  private logger = new Logger('Product service');

  /** 404 instead of a foreign-key 500 for an unknown unit type. */
  private async assertUnitType(unitTypeId: number | null | undefined) {
    if (unitTypeId == null) return;
    const unitType = await this.prisma.unitType.findUnique({
      where: { id: unitTypeId },
      select: { id: true },
    });
    if (!unitType) {
      throw new NotFoundException('UnitType not found');
    }
  }

  async create(data: CreateProductDto) {
    this.logger.log('create');

    const hasName = [data.name, data.name_uz, data.name_ru].some(
      (n) => typeof n === 'string' && n.trim() !== '',
    );
    if (!hasName) {
      throw new BadRequestException('Mahsulot nomini kiriting');
    }

    const category = await this.prisma.category.findUnique({
      where: { id: data.category_id },
    });

    if (!category) {
      throw new NotFoundException('category not found');
    }
    if (category.work_status !== 'WORKING') {
      throw new BadRequestException(
        "Bu kategoriya o'chirilgan, unga mahsulot qo'shib bo'lmaydi",
      );
    }
    await this.assertUnitType(data.unit_type_id);

    return await this.prisma.product.create({
      data: { ...data, name: data.name ?? data.name_uz ?? data.name_ru },
    });
  }

  async findAll() {
    this.logger.log('findAll');
    return await this.prisma.product.findMany({
      where: { work_status: 'WORKING' },
      include: {
        category: {
          select: { id: true, name: true, name_uz: true, name_ru: true },
        },
        unit_type: true,
        items: {
          where: { work_status: 'WORKING' },
          include: {
            unit_type: true,
            // Only offers a customer can act on (same rule as the detail's
            // shop_products): stock of deleted (shop_id NULL) or blocked shops
            // is not counted, so "Hozircha do'konlarda yo'q" / "Do'konda yo'q"
            // and the per-variant "Do'konlar" numbers match /product/:id.
            _count: {
              select: { shop_products: { where: LIVE_STOCK_WHERE } },
            },
          },
          orderBy: { id: 'desc' },
        },
        _count: { select: { items: { where: { work_status: 'WORKING' } } } },
      },
      orderBy: { id: 'desc' },
    });
  }

  async findPopular(limit = 10) {
    this.logger.log('findPopular');

    // Aggregate sold count per product from all user-placed orders in the last 30 days.
    // Exclude only CANCELED orders; count every status the user has placed (STARTED, CONFIRMED, FINISHED).
    // Path: OrderProduct -> ShopProduct -> ProductItem -> Product
    const rows = await this.prisma.$queryRaw<
      { product_id: number; sold: bigint }[]
    >`
      SELECT pi.product_id AS product_id, COALESCE(SUM(op.count), 0) AS sold
      FROM orderproduct op
      INNER JOIN shopproduct sp ON sp.id = op.shop_product_id
      INNER JOIN productitem pi ON pi.id = sp.product_item_id
      INNER JOIN \`order\` o ON o.id = op.order_id
      WHERE o.status <> 'CANCELED'
        AND o.work_status = 'WORKING'
        AND o.createdt >= (NOW() - INTERVAL 30 DAY)
        AND pi.product_id IS NOT NULL
      GROUP BY pi.product_id
      ORDER BY sold DESC
      LIMIT ${limit}
    `;

    // Only products a customer can actually buy: at least one working variant
    // with live stock (existing WORKING shop, same rule as /shop/by-product).
    // Keeps empty catalogue placeholders and variantful products no shop
    // sells out of the mobile home "popular/cheap" carousels.
    const buyableWhere: Prisma.ProductWhereInput = {
      work_status: 'WORKING',
      items: {
        some: {
          work_status: 'WORKING',
          shop_products: { some: LIVE_STOCK_WHERE },
        },
      },
    };

    const include = {
      category: {
        select: { id: true, name: true, name_uz: true, name_ru: true },
      },
      unit_type: true,
      _count: { select: { items: { where: { work_status: 'WORKING' } } } },
      items: {
        where: { work_status: 'WORKING' },
      },
    } satisfies Prisma.ProductInclude;

    const ids = rows.map((r) => r.product_id);
    if (ids.length > 0) {
      const products = await this.prisma.product.findMany({
        where: { AND: [buyableWhere, { id: { in: ids } }] },
        include,
      });
      if (products.length > 0) {
        const soldMap = new Map<number, number>(
          rows.map((r) => [r.product_id, Number(r.sold)]),
        );
        return products
          .map((p) => ({ ...p, sold: soldMap.get(p.id) ?? 0 }))
          .sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0));
      }
      // Everything sold lately is out of every shop now: use the fallback
      // instead of an empty carousel.
    }

    // Fallback: newest buyable products.
    return await this.prisma.product.findMany({
      where: buyableWhere,
      include,
      orderBy: { id: 'desc' },
      take: limit,
    });
  }

  async findByCategory(category_id: string | undefined) {
    this.logger.log('findByCategory');
    const cid = category_id ? parseInt(category_id, 10) : undefined;
    return await this.prisma.product.findMany({
      where: {
        work_status: 'WORKING',
        ...(cid !== undefined && !isNaN(cid) ? { category_id: cid } : {}),
      },
      include: {
        category: {
          select: { id: true, name: true, name_uz: true, name_ru: true },
        },
        unit_type: true,
        // Include working variants so clients can hide empty catalogue
        // placeholders (no variant → nothing to buy). Without this the mobile
        // category screen's `items.isNotEmpty` filter dropped every product.
        items: {
          where: { work_status: 'WORKING' },
        },
        _count: { select: { items: { where: { work_status: 'WORKING' } } } },
      },
      orderBy: { id: 'desc' },
    });
  }

  async findOne(id: number) {
    this.logger.log('findOne');
    if (!Number.isInteger(id) || id <= 0) {
      throw new NotFoundException('product not found');
    }

    // An archived product is gone for customers (404), like in /product/all.
    const product = await this.prisma.product.findFirst({
      where: { id, work_status: 'WORKING' },
      include: {
        category: {
          select: { id: true, name: true, name_uz: true, name_ru: true },
        },
        unit_type: true,
        items: {
          where: { work_status: 'WORKING' },
          include: {
            unit_type: true,
            shop_products: {
              // Only offers a customer can act on: live row/variant/product,
              // existing WORKING shop.
              where: LIVE_STOCK_WHERE,
              include: {
                shop: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
                    lat: true,
                    lon: true,
                    image: true,
                    delivery_amount: true,
                  },
                },
              },
              orderBy: { price: 'asc' },
            },
          },
        },
      },
    });
    if (!product) {
      throw new NotFoundException('product not found');
    }

    return product;
  }

  async update(id: number, data: UpdateProductDto) {
    this.logger.log('update');
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    if (!product) {
      throw new NotFoundException('product not found');
    }

    if (data.category_id) {
      const category = await this.prisma.category.findUnique({
        where: { id: data.category_id },
      });

      if (!category) {
        throw new NotFoundException('category not found');
      }
      // Only a MOVE into an archived category is refused: many live products
      // already sit under archived categories and must stay editable.
      if (
        data.category_id !== product.category_id &&
        category.work_status !== 'WORKING'
      ) {
        throw new BadRequestException(
          "Bu kategoriya o'chirilgan, mahsulotni unga o'tkazib bo'lmaydi",
        );
      }
    }
    await this.assertUnitType(data.unit_type_id);

    return await this.prisma.product.update({
      where: { id },
      data: {
        ...data,
        name: data.name ?? data.name_uz ?? data.name_ru ?? product.name,
      },
    });
  }

  async remove(id: number) {
    this.logger.log('remove (archive)');
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    if (!product) {
      throw new NotFoundException('product not found');
    }

    // Archive the whole chain atomically: the product, its variants and every
    // shop's stock of them, so nothing stays listed or orderable. READ
    // COMMITTED lets the stock step see rows a concurrent "add to shop" (which
    // locks the variant row) committed while this waited for that lock.
    return await this.prisma.$transaction(
      async (tx) => {
        const archived = await tx.product.update({
          where: { id },
          data: { work_status: 'DELETED' },
        });
        await tx.productItem.updateMany({
          where: { product_id: id, work_status: { not: 'DELETED' } },
          data: { work_status: 'DELETED' },
        });
        await tx.shopProduct.updateMany({
          where: {
            work_status: { not: 'DELETED' },
            product_item: { product_id: id },
          },
          data: { work_status: 'DELETED' },
        });
        return archived;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }
}
