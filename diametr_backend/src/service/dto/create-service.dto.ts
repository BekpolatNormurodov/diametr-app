import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ example: 'Santexnik', description: 'Xizmat nomi', minLength: 4 })
  @IsNotEmpty()
  @IsString()
  @MinLength(4)
  name: string;

  @ApiPropertyOptional({ example: 'Suv va quvur ta‘mirlash xizmati', description: 'Tavsif' })
  @IsOptional()
  @IsString()
  desc: string;
}
