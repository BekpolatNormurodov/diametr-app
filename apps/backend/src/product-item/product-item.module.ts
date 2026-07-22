import { Module } from '@nestjs/common';
import { ProductItemService } from './product-item.service';
import { ProductItemController } from './product-item.controller';

@Module({
  providers: [ProductItemService],
  controllers: [ProductItemController]
})
export class ProductItemModule {}
