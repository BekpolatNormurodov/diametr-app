import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateRegionDto {
  @ApiProperty({ example: 'Toshkent', description: 'Hudud nomi (uz)', minLength: 4 })
  @IsNotEmpty()
  @IsString()
  @MinLength(4)
  name: string;

  @ApiProperty({ example: 'Ташкент', description: 'Hudud nomi (ru)', required: false })
  @IsOptional()
  @IsString()
  name_ru?: string;
}
