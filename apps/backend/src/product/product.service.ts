import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaClientService) {}
  private logger = new Logger('Product service');
  async create(data: CreateProductDto) {
    this.logger.log('create');

    const category = await this.prisma.category.findUnique({
      where: { id: data.category_id },
    });

    if (!category) {
      throw new NotFoundException('category not found');
    }
    return await this.prisma.product.create({
      data: data,
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
            _count: {
              select: { shop_products: { where: { work_status: 'WORKING' } } },
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

    const ids = rows.map((r) => r.product_id);
    if (ids.length === 0) {
      // Fallback: newest products
      return await this.prisma.product.findMany({
        where: { work_status: 'WORKING' },
        include: {
          category: {
            select: { id: true, name: true, name_uz: true, name_ru: true },
          },
          unit_type: true,
          _count: { select: { items: { where: { work_status: 'WORKING' } } } },
          items: {
            where: { work_status: 'WORKING' },
          },
        },
        orderBy: { id: 'desc' },
        take: limit,
      });
    }

    const products = await this.prisma.product.findMany({
      where: { id: { in: ids }, work_status: 'WORKING' },
      include: {
        category: {
          select: { id: true, name: true, name_uz: true, name_ru: true },
        },
        unit_type: true,
        _count: { select: { items: { where: { work_status: 'WORKING' } } } },
        items: {
          where: { work_status: 'WORKING' },
        },
      },
    });

    const soldMap = new Map<number, number>(
      rows.map((r) => [r.product_id, Number(r.sold)]),
    );

    return products
      .map((p) => ({ ...p, sold: soldMap.get(p.id) ?? 0 }))
      .sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0));
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
      },
      orderBy: { id: 'desc' },
    });
  }

  async findOne(id: number) {
    this.logger.log('findOne');

    const product = await this.prisma.product.findUnique({
      where: { id },
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
              where: { work_status: 'WORKING' },
              include: {
                shop: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
                    lat: true,
                    lon: true,
                    image: true,
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
    }

    return await this.prisma.product.update({
      where: { id },
      data,
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

    return await this.prisma.product.update({
      where: { id },
      data: { work_status: 'DELETED' },
    });
  }
}
