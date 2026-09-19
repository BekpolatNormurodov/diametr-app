import { DELIVERY_TYPE, ORDER_SOURCE } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ProductItemDto } from './product-item-dto';

export class CreateOrderDto {
  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lon?: number;

  @IsInt()
  @IsNotEmpty()
  @Min(1)
  shop_id: number;

  /**
   * The total the client showed (undiscounted items + delivery). Kept for
   * compatibility only: the stored order amount is always computed on the
   * server from current prices, delivery and the promo code.
   */
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;

  /** Text delivery address */
  @IsOptional()
  @IsString()
  address?: string;

  /** Text description / notes */
  @IsOptional()
  @IsString()
  desc?: string;

  /** Payment method: payme | click | uzum | cash */
  @IsOptional()
  @IsString()
  payment_type?: string;

  /** Promo code (UPPERCASE) */
  @IsOptional()
  @IsString()
  promo_code?: string;

  @IsNotEmpty()
  @IsEnum(DELIVERY_TYPE, {
    message: 'delivery_type can be YANDEX, MARKET, FIXED',
  })
  delivery_type: DELIVERY_TYPE;

  /** Order source: MOBILE | SITE | STORE_BOT */
  @IsOptional()
  @IsEnum(ORDER_SOURCE)
  source?: ORDER_SOURCE;

  @ValidateNested({ each: true })
  @Type(() => ProductItemDto)
  @IsArray()
  @ArrayNotEmpty({ message: 'products cannot be empty' })
  @IsNotEmpty({ each: true })
  products: ProductItemDto[];
}
