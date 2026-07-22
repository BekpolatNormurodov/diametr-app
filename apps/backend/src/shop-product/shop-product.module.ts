import { Module } from '@nestjs/common';
import { ShopProductController } from './shop-product.controller';
import { ShopProductService } from './shop-product.service';

@Module({
  controllers: [ShopProductController],
  providers: [ShopProductService]
})
export class ShopProductModule {}
