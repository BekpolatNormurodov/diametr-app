import { DELIVERY_TYPE } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ProductItemDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  shop_product_id: number;

  @IsNumber()
  @IsNotEmpty()
  count: number;

 
}
