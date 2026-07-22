import { DATE_TYPE, PAYMENT_TYPE } from '@prisma/client';
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
// import { PaymentTypeConstraint } from './validations/payment-type-validation';

export class CreatePaymentDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1000)
  amount: number;

  @Transform(({ value }) => addHours(parse(value, 'yyyy-MM-dd', new Date()), 5))
  @IsDate({
    message: 'start_date has wrong format. format: yyyy-MM-dd (2025-08-01)',
  })
  @IsNotEmpty()
  start_date: string;

  @Transform(({ value }) => addHours(parse(value, 'yyyy-MM-dd', new Date()), 5))
  @IsDate({
    message: 'end_date has wrong format. format: yyyy-MM-dd (2025-08-01)',
  })
  @IsNotEmpty()
  end_date: string;

  @IsNotEmpty()
  @IsEnum(PAYMENT_TYPE, {
    message: 'type can be SHOP,WORKER,AD',
  })
  @IsNotEmpty()
  @IsString()
  type: PAYMENT_TYPE;

  @ValidateIf((o) => o.type === 'SHOP')
  @IsNotEmpty({ message: 'shop_id is required when type is SHOP' })
  @IsNumber()
  @Min(1)
  shop_id?: number;

  @ValidateIf((o) => o.type === 'AD')
  @IsNotEmpty({ message: 'ad_id is required when type is AD' })
  @IsNumber()
  @Min(1)
  ad_id?: number;

  @ValidateIf((o) => o.type === 'WORKER')
  @IsNotEmpty({ message: 'worker_id is required when type is WORKER' })
  @IsNumber()
  @Min(1)
  worker_id?: number;
}
