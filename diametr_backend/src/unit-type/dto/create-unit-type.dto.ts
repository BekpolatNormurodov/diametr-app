import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUnitTypeDto {
  @ApiProperty({ example: 'Kilogramm', description: "O'lchov birligi nomi (legacy)" })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({ example: 'Kilogramm', description: "O'zbekcha nomi" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name_uz?: string;

  @ApiPropertyOptional({ example: 'Килограмм', description: 'Ruscha nomi' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name_ru?: string;

  @ApiProperty({ example: 'kg', description: 'Qisqa belgi' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  symbol: string;
}
