import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DATE_TYPE } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
  Min,
  MinLength,
} from 'class-validator';
import { addHours, parse } from 'date-fns';

export class CreateWorkerDto {
  @ApiProperty({ example: 'Jasur Toshmatov', description: 'ToвЂliq ism', minLength: 4 })
  @IsNotEmpty()
  @IsString()
  @MinLength(4)
  fullname: string;

  @ApiProperty({ example: '+998901234567', description: 'Telefon raqam (UZ format)' })
  @IsNotEmpty()
  @IsString()
  @IsPhoneNumber('UZ')
  @Length(13)
  phone: string;

  @ApiPropertyOptional({ example: 'secret123', description: 'Parol (ixtiyoriy)' })
  @IsOptional()
  password: string;

  @ApiProperty({ example: 1, description: 'Xizmat ID', minimum: 1 })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  service_id: number;

  @ApiProperty({ example: '2026-12-31', description: 'Muddati tugash sanasi (yyyy-MM-dd)' })
  @Transform(({ value }) => addHours(parse(value, 'yyyy-MM-dd', new Date()), 5))
  @IsDate({ message: 'expired has wrong format. format: yyyy-MM-dd (2025-08-01)' })
  @IsNotEmpty()
  expired: string;

  @ApiPropertyOptional({ example: 50000, description: 'Ish haqi miqdori', minimum: 1000 })
  @IsNumber()
  @Min(1000)
  @IsOptional()
  amount: number;

  @ApiPropertyOptional({ enum: DATE_TYPE, example: DATE_TYPE.MONTH, description: 'ToвЂlov turi: ONCE, HOUR, DAY, MONTH' })
  @IsNotEmpty()
  @IsEnum(DATE_TYPE, { message: 'date_type can be ONCE,HOUR,DAY,MONTH' })
  @IsOptional()
  @IsString()
  date_type: DATE_TYPE;
}

