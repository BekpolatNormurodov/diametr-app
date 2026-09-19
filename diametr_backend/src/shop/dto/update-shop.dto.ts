import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, ValidateIf } from 'class-validator';
import { CreateShopDto } from './create-shop.dto';


export class UpdateShopDto extends PartialType(CreateShopDto) {
  /**
   * Subscription end date. The dashboard's shop edit sends it for "+N kun
   * bonus" and "obunani bekor qilish" (today). null is rejected: a shop
   * without an expiry date is never billed.
   */
  @ApiPropertyOptional({
    example: '2026-10-17',
    description: 'Obuna tugash sanasi (YYYY-MM-DD yoki ISO 8601)',
  })
  @ValidateIf((o) => o.expired !== undefined)
  @IsDateString({ strict: true })
  expired?: string;
}
