import { IsInt, IsNotEmpty, Max, Min } from 'class-validator';

export class ProductItemDto {
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  shop_product_id: number;

  // Whole units only; 0/negative lines used to inflate stock on finish.
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Max(2000000000)
  count: number;

 
}
