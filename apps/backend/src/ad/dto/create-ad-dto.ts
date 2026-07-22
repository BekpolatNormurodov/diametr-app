import { AD_TYPE, DATE_TYPE, PAYMENT_TYPE } from '@prisma/client';
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
  Validate,
  ValidateIf,
} from 'class-validator';
import { addHours, parse } from 'date-fns';

export class CreateAdDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(4)
  title: string;

  @IsOptional()
  @IsString()
  @MinLength(4)
  subtitle: string;

  @Transform(({ value }) => addHours(parse(value, 'yyyy-MM-dd', new Date()), 5))
  @IsDate({
    message: 'expired has wrong format. format: yyyy-MM-dd (2025-08-01)',
  })
  @IsNotEmpty()
  expired: string;

  @IsNotEmpty()
  @IsEnum(AD_TYPE, {
    message: 'type can be SHOP,WORKER,REGION,PRODUCT',
  })
  @IsNotEmpty()
  @IsString()
  type: AD_TYPE;

  @ValidateIf((o) => o.type === AD_TYPE.SHOP)
  @IsNotEmpty({ message: 'shop_id is required when type is SHOP' })
  @IsNumber()
  @Min(1)
  shop_id?: number;

  @ValidateIf((o) => o.type === AD_TYPE.REGION)
  @IsNotEmpty({ message: 'region_id is required when type is REGION' })
  @IsNumber()
  @Min(1)
  region_id?: number;

  @ValidateIf((o) => o.type === AD_TYPE.WORKER)
  @IsNotEmpty({ message: 'worker_id is required when type is WORKER' })
  @IsNumber()
  @Min(1)
  worker_id?: number;

  @ValidateIf((o) => o.type === AD_TYPE.PRODUCT)
  @IsNotEmpty({ message: 'product_id is required when type is PRODUCT' })
  @IsNumber()
  @Min(1)
  product_id?: number;
}
