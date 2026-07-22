import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaClientService) {}
  private logger = new Logger('Category service');
  async create(data: CreateCategoryDto) {
    this.logger.log('create');

    return await this.prisma.category.create({
      data: data,
    });
  }

  async findAll() {
    this.logger.log('findAll');
    const categories = await this.prisma.category.findMany({
      where: { work_status: 'WORKING' },
      include: {
        _count: {
          select: {
            products: { where: { work_status: 'WORKING' } },
          },
        },
      },
      orderBy: { id: 'desc' },
    });
    return categories;
  }

  async findAllWithStats() {
    this.logger.log('findAllWithStats');
    const categories = await this.prisma.category.findMany({
      where: { work_status: 'WORKING' },
      include: {
        products: {
          where: { work_status: 'WORKING' },
          include: {
            items: {
              include: {
                shop_products: {
                  where: { work_status: 'WORKING' },
                  select: { count: true, price: true },
                },
              },
            },
          },
        },
      },
    });

    return categories.map(({ products, ...cat }) => {
      let product_count = 0;
      let total_stock = 0;
      let total_value = 0;
      let shop_product_count = 0;

      for (const product of products) {
        for (const item of product.items) {
          for (const sp of item.shop_products) {
            product_count++;
            shop_product_count++;
            total_stock += sp.count ?? 0;
            total_value += (sp.count ?? 0) * (sp.price ?? 0);
          }
        }
      }

      return {
        ...cat,
        product_count: products.length,
        shop_product_count,
        total_stock,
        total_value,
      };
    });
  }
  async findOne(id: number) {
    this.logger.log('findOne');
    let category = await this.prisma.category.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException('category not found');
    }

    return category;
  }

  async update(id: number, data: UpdateCategoryDto) {
    this.logger.log('update');
    let category = await this.prisma.category.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException('category not found');
    }

    return await this.prisma.category.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    this.logger.log('remove (archive)');
    let category = await this.prisma.category.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException('category not found');
    }

    return await this.prisma.category.update({
      where: { id },
      data: { work_status: 'DELETED' },
    });
  }
}
