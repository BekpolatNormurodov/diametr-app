import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ShopProductService } from './shop-product.service';
import { CreateShopProductDto } from './dto/create-shop-product.dto';
import { UpdateShopProductDto } from './dto/update-shop-product.dto';
import { Role } from '@prisma/client';
import { RolesGuardFactory } from 'src/_guard/roles.guard';

@ApiTags('Shop-Product')
@Controller('shop-product')
export class ShopProductController {
  constructor(private readonly shopProductService: ShopProductService) {}

  @Post()
  @UseGuards(RolesGuardFactory([Role.ADMIN, Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Do\'konga mahsulot qo\'shish (ADMIN/SUPER)' })
  create(@Body() data: CreateShopProductDto, @Req() req) {
    return this.shopProductService.create(data, req);
  }

  @Get('/all')
  @ApiOperation({ summary: 'Barcha do\'kon mahsulotlari ro\'yxati' })
  findAll() {
    return this.shopProductService.findAll();
  }

  @Get('/all-in-product')
  @ApiOperation({ summary: 'Mahsulot variantlari va tavsiyalar (product_id + shop_id)' })
  @ApiQuery({ name: 'product_id', required: true, type: Number })
  @ApiQuery({ name: 'shop_id', required: true, type: Number })
  findAllInProduct(
    @Query('product_id') product_id: string,
    @Query('shop_id') shop_id: string,
  ) {
    return this.shopProductService.findAllInProduct(product_id, shop_id);
  }

  // Must stay above @Get(':id'), which would otherwise capture "my".
  @Get('/my')
  @UseGuards(RolesGuardFactory([Role.ADMIN]))
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary:
      "O'z do'konimning mahsulotlari (ADMIN) — do'kon bloklangan bo'lsa ham",
  })
  findMine(@Req() req) {
    return this.shopProductService.findMine(req);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta do’kon mahsuloti' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id') id: string) {
    return this.shopProductService.findOne(+id);
  }

  @Put(':id')
  @UseGuards(RolesGuardFactory([Role.ADMIN, Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Do’kon mahsulotini tahrirlash (o‘z do‘koni ADMIN / SUPER)' })
  @ApiParam({ name: 'id', type: Number })
  update(@Param('id') id: string, @Body() data: UpdateShopProductDto, @Req() req) {
    return this.shopProductService.update(+id, data, req);
  }

  @Delete(':id')
  @UseGuards(RolesGuardFactory([Role.ADMIN, Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Do’kon mahsulotini o’chirish (o‘z do‘koni ADMIN / SUPER)' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id') id: string, @Req() req) {
    return this.shopProductService.remove(+id, req);
  }
}
