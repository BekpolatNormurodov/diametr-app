import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';
import { CreateProductItemDto } from './dto/create-product-item.dto';
import { UpdateProductItemDto } from './dto/update-product-item.dto';
@Injectable()
export class ProductItemService {
  constructor(private readonly prisma: PrismaClientService) {}
  private logger = new Logger('ProductItem service');
  async create(data: CreateProductItemDto) {
    this.logger.log('create');

    const product = await this.prisma.product.findUnique({
      where: {
        id: data.product_id,
      },
    });

    if (!product) {
      throw new NotFoundException('product not found');
    }

    return await this.prisma.productItem.create({
      data: data,
    });
  }

  async findAll() {
    this.logger.log('findAll');
    const productItems = await this.prisma.productItem.findMany({
      where: { work_status: 'WORKING' },
      include: {
        unit_type: true,
        product: { include: { category: true, unit_type: true } },
        _count: {
          select: {
            shop_products: { where: { work_status: 'WORKING' } },
          },
        },
      },
    });
    return productItems;
  }
  async findOne(id: number) {
    this.logger.log('findOne');
    const productItem = await this.prisma.productItem.findUnique({
      where: { id },
      include: { unit_type: true, product: { include: { category: true } } },
    });
    if (!productItem) {
      throw new NotFoundException('productItem not found');
    }

    return productItem;
  }

  async update(id: number, data: UpdateProductItemDto) {
    this.logger.log('update');
    const productItem = await this.prisma.productItem.findUnique({
      where: { id },
    });
    if (!productItem) {
      throw new NotFoundException('productItem not found');
    }
    if (data.product_id) {
      const product = await this.prisma.product.findUnique({
        where: {
          id: data.product_id,
        },
      });
      if (!product) {
        throw new NotFoundException('product not found');
      }
    }

    return await this.prisma.productItem.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    this.logger.log('remove (archive)');
    const productItem = await this.prisma.productItem.findUnique({
      where: { id },
    });
    if (!productItem) {
      throw new NotFoundException('productItem not found');
    }

    return await this.prisma.productItem.update({
      where: { id },
      data: { work_status: 'DELETED' },
    });
  }
}
