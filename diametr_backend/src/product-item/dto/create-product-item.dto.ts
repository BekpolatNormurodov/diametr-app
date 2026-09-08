import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductItemDto {
  @ApiProperty({ example: 'Qizil rang, 250g', description: 'Variant nomi' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Maxsus qadoqlash', description: 'Tavsif' })
  @IsOptional()
  @IsString()
  desc: string;

  @ApiProperty({ example: 1, description: 'Mahsulot ID', minimum: 1 })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  product_id: number;

  @ApiPropertyOptional({
    example: 2,
    description: "O'lchov birligi ID (UnitType)",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  unit_type_id?: number;

  @ApiPropertyOptional({
    example: 1.5,
    description: "O'lcham qiymati, masalan 1.5 (litr)",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  value?: number;

  @ApiPropertyOptional({
    example: 'Qizil',
    description: 'Rang nomi yoki HEX kodi',
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({
    example: '120x80',
    description: "O'lcham (masalan XL, 50x50 sm)",
  })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({
    example: '1710234123-456789.jpg',
    description: 'Rasm fayl nomi',
  })
  @IsOptional()
  @IsString()
  image?: string;
}
