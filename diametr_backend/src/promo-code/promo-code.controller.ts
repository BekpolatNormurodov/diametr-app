import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { PromoCodeService } from './promo-code.service';
import { CreatePromoCodeDto, UpdatePromoCodeDto } from './dto/create-promo-code.dto';
import { Role } from '@prisma/client';
import { RolesGuardFactory } from 'src/_guard/roles.guard';

@ApiTags('Promo-Code')
@ApiBearerAuth('JWT')
@Controller('promo-code')
export class PromoCodeController {
  constructor(private readonly promoCodeService: PromoCodeService) {}

  /** Admin: create a new promo code */
  @Post()
  @UseGuards(RolesGuardFactory([Role.ADMIN, Role.SUPER]))
  @ApiOperation({ summary: 'Promo kod yaratish (ADMIN/SUPER)' })
  create(@Body() dto: CreatePromoCodeDto, @Request() req: any) {
    // ADMIN automatically scoped to their shop
    if (req['user']?.role === Role.ADMIN && req['user']?.shop_id) {
      dto.shop_id = req['user'].shop_id;
    }
    return this.promoCodeService.create(dto);
  }

  /** Admin: list all promo codes */
  @Get('/all')
  @UseGuards(RolesGuardFactory([Role.ADMIN, Role.SUPER]))
  @ApiOperation({ summary: 'Barcha promo kodlar (ADMIN/SUPER)' })
  findAll(@Request() req: any) {
    const shopId = req['user']?.role === Role.ADMIN ? req['user']?.shop_id : undefined;
    return this.promoCodeService.findAll(shopId);
  }

  /** User: validate a promo code before order */
  @Get('/validate/:code')
  @UseGuards(RolesGuardFactory([Role.USER]))
  @ApiOperation({ summary: 'Promo kodni tekshirish (USER)' })
  @ApiParam({ name: 'code', type: String, example: 'SALE20' })
  validate(@Param('code') code: string, @Request() req: any) {
    return this.promoCodeService.validate(code.toUpperCase(), req['user'].id);
  }

  /** Admin: update promo code fields */
  @Patch('/:id')
  @UseGuards(RolesGuardFactory([Role.ADMIN, Role.SUPER]))
  @ApiOperation({ summary: 'Promo kodni tahrirlash (ADMIN/SUPER)' })
  @ApiParam({ name: 'id', type: Number })
  update(@Param('id') id: string, @Body() dto: UpdatePromoCodeDto) {
    return this.promoCodeService.update(+id, dto);
  }

  /** Admin: toggle active/inactive */
  @Patch('/toggle/:id')
  @UseGuards(RolesGuardFactory([Role.ADMIN, Role.SUPER]))
  @ApiOperation({ summary: 'Promo kodni yoqish/o\'chirish (ADMIN/SUPER)' })
  @ApiParam({ name: 'id', type: Number })
  toggle(@Param('id') id: string) {
    return this.promoCodeService.toggle(+id);
  }

  /** Admin: delete */
  @Delete('/:id')
  @UseGuards(RolesGuardFactory([Role.ADMIN, Role.SUPER]))
  @ApiOperation({ summary: 'Promo kodni o\'chirish (ADMIN/SUPER)' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id') id: string) {
    return this.promoCodeService.remove(+id);
  }
}

