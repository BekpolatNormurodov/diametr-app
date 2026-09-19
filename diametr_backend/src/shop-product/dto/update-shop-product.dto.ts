import { IsInt, IsOptional, Max, Min, ValidateIf } from 'class-validator';
import { MAX_INT_VALUE } from './create-shop-product.dto';

// Same rules as create, every field optional. Unlike PartialType, `price` and
// `count` may be omitted but never sent as null (a stock row always has them);
// `bonus_price: null` clears the discount.
export class UpdateShopProductDto {
  @ValidateIf((o) => o.product_item_id !== undefined)
  @Min(1)
  @IsInt()
  product_item_id?: number;

  @ValidateIf((o) => o.price !== undefined)
  @Min(1000)
  @Max(MAX_INT_VALUE)
  @IsInt()
  price?: number;

  @ValidateIf((o) => o.count !== undefined)
  @Min(0)
  @Max(MAX_INT_VALUE)
  @IsInt()
  count?: number;

  @IsOptional()
  @Max(MAX_INT_VALUE)
  @IsInt()
  bonus_price?: number | null;
}
