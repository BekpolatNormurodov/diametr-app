import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { DISCOUNT_TYPE } from '@prisma/client';

export class CreatePromoCodeDto {
  @ApiProperty({ example: 'SUMMER25', description: 'Promo kod (katta harf, raqam, _ yoki -)' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  @Matches(/^[A-Z0-9_-]+$/, {
    message: 'code must contain only uppercase letters, digits, _ or -',
  })
  code: string;

  @ApiProperty({
    example: 'PERCENT',
    description: 'Chegirma turi: PERCENT yoki FIXED',
    enum: DISCOUNT_TYPE,
  })
  @IsEnum(DISCOUNT_TYPE)
  discount_type: DISCOUNT_TYPE;

  @ApiProperty({ example: 20, description: 'PERCENT: 0–100, FIXED: ixtiyoriy summa' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discount_value: number;

  @ApiPropertyOptional({ example: 50000, description: 'Minimal buyurtma summasi' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  min_order_amount?: number;

  @ApiPropertyOptional({ example: 100, description: 'Maksimal foydalanish soni (bo\'sh = cheksiz)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  max_uses?: number;

  @ApiPropertyOptional({
    example: '2026-12-31T23:59:59Z',
    description: 'Tugash sanasi (ISO 8601). Qoldirsa — muddatsiz.',
  })
  @IsOptional()
  @IsISO8601()
  expires_at?: string;

  @ApiPropertyOptional({ example: 3, description: 'Dokon ID (faqat shu dokon uchun)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  shop_id?: number;
}

export class UpdatePromoCodeDto {
  @IsOptional()
  @IsString()
  @Length(3, 50)
  @Matches(/^[A-Z0-9_-]+$/, { message: 'code must contain only uppercase letters, digits, _ or -' })
  code?: string;

  @IsOptional()
  @IsEnum(DISCOUNT_TYPE)
  discount_type?: DISCOUNT_TYPE;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discount_value?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  min_order_amount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  max_uses?: number;

  @IsOptional()
  @IsISO8601()
  expires_at?: string;

  @IsOptional()
  is_active?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  shop_id?: number;
}
