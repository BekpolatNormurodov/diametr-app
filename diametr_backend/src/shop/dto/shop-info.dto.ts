import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { SHOP_DESCRIPTION_MAX, type WorkDay } from '../shop-info';

/** Shop page info: about text and weekly hours (owner in the shop panel, or SUPER). */
export class ShopInfoDto {
  @ApiPropertyOptional({ example: "Qurilish mollari, yetkazib berish bor", description: "Do'kon haqida (uz)" })
  @IsOptional()
  @IsString()
  @MaxLength(SHOP_DESCRIPTION_MAX)
  description?: string | null;

  @ApiPropertyOptional({ example: 'Стройматериалы, есть доставка', description: "Do'kon haqida (ru)" })
  @IsOptional()
  @IsString()
  @MaxLength(SHOP_DESCRIPTION_MAX)
  description_ru?: string | null;

  @ApiPropertyOptional({
    description: "Ish vaqti: dushanbadan boshlab 7 kun, {open:'09:00', close:'18:00'} yoki null (dam olish)",
    example: [{ open: '09:00', close: '18:00' }, null, null, null, null, null, null],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(7)
  @ArrayMaxSize(7)
  work_hours?: WorkDay[] | null;
}
