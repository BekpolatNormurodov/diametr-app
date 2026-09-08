import { DATE_TYPE } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  isNumber,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
  Matches,
  Min,
  MinLength,
} from 'class-validator';
import { addHours, parse } from 'date-fns';

export class CreateShopProductDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  product_item_id: number;

  @IsNumber()
  @Min(1000)
  price: number;

  @IsNumber()
  @Min(0)
  count: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bonus_price?: number;
}
