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

  // Banner image filename returned by POST /ad/upload-image. Optional so an ad
  // can be created without a banner, but the dashboard sends it.
  @IsOptional()
  @IsString()
  image?: string;

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

  // Link targets are OPTIONAL: a banner may be static (no target) or link to a
  // shop / region / worker / product. When provided, the id must be valid.
  @IsOptional()
  @IsNumber()
  @Min(1)
  shop_id?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  region_id?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  worker_id?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  product_id?: number;
}
