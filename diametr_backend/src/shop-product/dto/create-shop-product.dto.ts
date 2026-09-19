import { IsInt, IsNotEmpty, IsOptional, Max, Min } from 'class-validator';

// Prices and counts are INT columns: fractions would fail inside Prisma (500),
// so they are rejected here with a 400.
export const MAX_INT_VALUE = 2000000000;

// Decorators run bottom-up and the API reports the first failure, so the
// presence/type check sits last to be the message a client sees first.
export class CreateShopProductDto {
  @Min(1)
  @IsInt()
  @IsNotEmpty()
  product_item_id: number;

  @Min(1000)
  @Max(MAX_INT_VALUE)
  @IsInt()
  price: number;

  @Min(0)
  @Max(MAX_INT_VALUE)
  @IsInt()
  count: number;

  // null clears the discount. Whether it is > 0 and below the price is checked
  // in the service, which also knows the stored price on updates.
  @IsOptional()
  @Max(MAX_INT_VALUE)
  @IsInt()
  bonus_price?: number | null;
}
