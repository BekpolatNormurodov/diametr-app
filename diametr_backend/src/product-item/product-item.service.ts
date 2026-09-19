import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';
import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';
import { LIVE_STOCK_WHERE } from 'src/shop-product/stock.utils';
import { CreateProductItemDto } from './dto/create-product-item.dto';
import { UpdateProductItemDto } from './dto/update-product-item.dto';

type TxClient = Prisma.TransactionClient;

@Injectable()
export class ProductItemService {
  constructor(private readonly prisma: PrismaClientService) {}
  private logger = new Logger('ProductItem service');

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

  /**
   * Locks the product row and requires it to be WORKING. The lock makes a
   * concurrent product archive (which cascades to its variants) wait, so a
   * variant can never be attached to a product archived in the meantime.
   */
  private async lockWorkingProduct(
    tx: TxClient,
    productId: number,
    archivedMessage: string,
  ) {
    const rows = await tx.$queryRaw<{ work_status: string }[]>`
      SELECT work_status FROM product WHERE id = ${productId} FOR UPDATE
    `;
    if (rows.length === 0) {
      throw new NotFoundException('product not found');
    }
    if (rows[0].work_status !== 'WORKING') {
      throw new BadRequestException(archivedMessage);
    }
  }

  async create(data: CreateProductItemDto) {
    this.logger.log('create');
    await this.assertUnitType(data.unit_type_id);

    return await this.prisma.$transaction(
      async (tx) => {
        await this.lockWorkingProduct(
          tx,
          data.product_id,
          "Bu mahsulot o'chirilgan, unga variant qo'shib bo'lmaydi",
        );
        return await tx.productItem.create({
          data: data,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }

  async findAll() {
    this.logger.log('findAll');
    const productItems = await this.prisma.productItem.findMany({
      // Variants of an archived product are archived with it; older ones that
      // predate that cascade must not be offered for stocking either.
      where: { work_status: 'WORKING', product: { work_status: 'WORKING' } },
      include: {
        unit_type: true,
        product: { include: { category: true, unit_type: true } },
        // Live offers only (same rule as /product/all): stock of deleted or
        // blocked shops is not counted.
        _count: {
          select: {
            shop_products: { where: LIVE_STOCK_WHERE },
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
    await this.assertUnitType(data.unit_type_id);

    const targetProductId = data.product_id || productItem.product_id;
    return await this.prisma.$transaction(
      async (tx) => {
        if (targetProductId) {
          await this.lockWorkingProduct(
            tx,
            targetProductId,
            "Bu mahsulot o'chirilgan, uning variantini o'zgartirib bo'lmaydi",
          );
        }
        return await tx.productItem.update({
          where: { id },
          data,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }

  async remove(id: number) {
    this.logger.log('remove (archive)');
    const productItem = await this.prisma.productItem.findUnique({
      where: { id },
    });
    if (!productItem) {
      throw new NotFoundException('productItem not found');
    }

    // Archive the variant and every shop's stock of it atomically, so it is no
    // longer listed or orderable anywhere. READ COMMITTED lets the stock step
    // see a row a concurrent "add to shop" committed while this waited for the
    // variant row lock.
    return await this.prisma.$transaction(
      async (tx) => {
        const archived = await tx.productItem.update({
          where: { id },
          data: { work_status: 'DELETED' },
        });
        await tx.shopProduct.updateMany({
          where: { product_item_id: id, work_status: { not: 'DELETED' } },
          data: { work_status: 'DELETED' },
        });
        return archived;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }
}
