import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PRODUCT_TYPE } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiPropertyOptional({ example: 'Gisht', description: 'Mahsulot nomi' })
  @IsOptional()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Gisht',
    description: 'Nomi (uzbekcha)',
    minLength: 2,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name_uz: string;

  @ApiPropertyOptional({
    example: 'Kirpich',
    description: 'Nomi (ruscha)',
  })
  @IsOptional()
  @IsString()
  name_ru: string;

  @ApiPropertyOptional({ example: 'Qurilish gishti', description: 'Tavsif' })
  @IsOptional()
  @IsString()
  desc: string;

  @ApiPropertyOptional({ example: 'image.jpg', description: 'Rasm fayl nomi' })
  @IsOptional()
  @IsString()
  image: string;

  @ApiProperty({ example: 1, description: 'Kategoriya ID', minimum: 1 })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  category_id: number;

  @ApiPropertyOptional({
    enum: PRODUCT_TYPE,
    example: PRODUCT_TYPE.COLOR,
    description: 'Tur: COLOR, WEIGHT, LENGTH, SIZE, COUNTRY, LITR',
  })
  @IsNotEmpty()
  @IsEnum(PRODUCT_TYPE, {
    message: 'type can be COLOR,WEIGHT,LENGTH,SIZE,COUNTRY,LITR',
  })
  @IsOptional()
  @IsString()
  type: PRODUCT_TYPE;

  @ApiPropertyOptional({
    example: 1,
    description: "O'lchov birligi ID (UnitType)",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  unit_type_id?: number;
}
