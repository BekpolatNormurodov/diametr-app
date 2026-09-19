import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
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
    // ADMIN is always scoped to their own shop: never another shop's code or a
    // platform-wide one (shop_id null), which only SUPER may create.
    if ((req['role'] ?? req['user']?.role) === Role.ADMIN) {
      if (req['user']?.shop_id == null) {
        throw new BadRequestException(
          "Sizning akkauntingizga do'kon biriktirilmagan",
        );
      }
      dto.shop_id = req['user'].shop_id;
    }
    return this.promoCodeService.create(dto);
  }

  /** Admin: list all promo codes */
  @Get('/all')
  @UseGuards(RolesGuardFactory([Role.ADMIN, Role.SUPER]))
  @ApiOperation({ summary: 'Barcha promo kodlar (ADMIN/SUPER)' })
  findAll(@Request() req: any) {
    if ((req['role'] ?? req['user']?.role) === Role.ADMIN) {
      // An owner without a shop owns no codes (never the full list).
      const shopId = req['user']?.shop_id;
      if (shopId == null) return [];
      return this.promoCodeService.findAll(shopId);
    }
    return this.promoCodeService.findAll(undefined);
  }

  /** User: validate a promo code before order */
  @Get('/validate/:code')
  @UseGuards(RolesGuardFactory([Role.USER]))
  @ApiOperation({ summary: 'Promo kodni tekshirish (USER)' })
  @ApiParam({ name: 'code', type: String, example: 'SALE20' })
  @ApiQuery({
    name: 'shop_id',
    required: false,
    type: Number,
    description: "Savatdagi do'kon: boshqa do'konning promokodi rad etiladi",
  })
  validate(
    @Param('code') code: string,
    @Request() req: any,
    @Query('shop_id') shopIdRaw?: string,
  ) {
    // Optional: the cart's shop. A code of another shop is rejected here (the
    // order itself re-validates against the order's shop anyway).
    const shopId = Number(shopIdRaw);
    return this.promoCodeService.validate(
      code.toUpperCase(),
      req['user'].id,
      Number.isInteger(shopId) && shopId > 0 ? shopId : undefined,
    );
  }

  /** Admin: update promo code fields */
  @Patch('/:id')
  @UseGuards(RolesGuardFactory([Role.ADMIN, Role.SUPER]))
  @ApiOperation({ summary: 'Promo kodni tahrirlash (ADMIN/SUPER)' })
  @ApiParam({ name: 'id', type: Number })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePromoCodeDto,
    @Request() req: any,
  ) {
    return this.promoCodeService.update(+id, dto, req);
  }

  /** Admin: toggle active/inactive */
  @Patch('/toggle/:id')
  @UseGuards(RolesGuardFactory([Role.ADMIN, Role.SUPER]))
  @ApiOperation({ summary: 'Promo kodni yoqish/o\'chirish (ADMIN/SUPER)' })
  @ApiParam({ name: 'id', type: Number })
  toggle(@Param('id') id: string, @Request() req: any) {
    return this.promoCodeService.toggle(+id, req);
  }

  /** Admin: delete */
  @Delete('/:id')
  @UseGuards(RolesGuardFactory([Role.ADMIN, Role.SUPER]))
  @ApiOperation({ summary: 'Promo kodni o\'chirish (ADMIN/SUPER)' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.promoCodeService.remove(+id, req);
  }
}

