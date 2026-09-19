import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Patch,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Headers,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ApiBody,
  ApiConsumes,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { diskStorage } from 'multer';
import { join } from 'path';
import {
  IMAGE_MAX_BYTES,
  downloadImageFromUrl,
  imageFileFilter,
  imageFileName,
  uploadedImageName,
} from 'src/_utils/image-upload';
import { ShopService } from './shop.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { Role } from '@prisma/client';
import { RolesGuardFactory } from 'src/_guard/roles.guard';
import { isSuperRequest } from 'src/_guard/optional-auth';
import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';

@ApiTags('Shop')
@Controller('shop')
export class ShopController {
  constructor(
    private readonly shopService: ShopService,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaClientService,
  ) {}

  /** A valid SUPER token (dashboard) gets the full rows; everyone else the public shape. */
  private isSuper(authorization?: string) {
    return isSuperRequest(this.jwt, this.prisma, authorization);
  }

  // Shop create/edit/delete is platform-admin only (the dashboard). A shop
  // owner (ADMIN) could otherwise rename, re-price delivery or delete any shop.
  @Post()
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: "Do'kon yaratish (SUPER)" })
  create(@Body() data: CreateShopDto) {
    return this.shopService.create(data);
  }

  @Post('/upload-image')
  @UseGuards(RolesGuardFactory([Role.ADMIN, Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: "Do'kon rasmi yuklash (ADMIN/SUPER)" })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { image: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: join(process.cwd(), 'public', 'shops'),
        filename: imageFileName,
      }),
      fileFilter: imageFileFilter,
      limits: { fileSize: IMAGE_MAX_BYTES, files: 1 },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return { image: uploadedImageName(file) };
  }

  @Post('/upload-image-url')
  @UseGuards(RolesGuardFactory([Role.ADMIN, Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: "URL dan rasm yuklab saqlab qo'yish (ADMIN/SUPER)" })
  @ApiBody({
    schema: { type: 'object', properties: { url: { type: 'string' } } },
  })
  async uploadImageFromUrl(@Body() body: { url: string }) {
    return { image: await downloadImageFromUrl(body?.url, 'shops') };
  }

  // PUBLIC: no billing/internal fields (balance, expired, auto_payment, inn)
  // unless the caller carries a valid SUPER token.
  @Get('/all')
  @ApiOperation({ summary: "Barcha do'konlar ro'yxati" })
  @ApiQuery({ name: 'regions', required: false, type: String })
  async findAll(
    @Query('regions') regions?: string,
    @Headers('authorization') authorization?: string,
  ) {
    const full = await this.isSuper(authorization);
    return this.shopService.findAll(regions, false, full);
  }

  @Get('/all-admin')
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: "Barcha do'konlar (SUPER, bloklangan ham)" })
  @ApiQuery({ name: 'regions', required: false, type: String })
  findAllAdmin(@Query('regions') regions?: string) {
    return this.shopService.findAll(regions, true, true);
  }

  @Get('/by-product')
  @ApiOperation({ summary: "Mahsulot bo'yicha do'konlar ro'yxati" })
  @ApiQuery({ name: 'product_id', required: true, type: Number })
  @ApiQuery({ name: 'regions', required: false, type: String })
  findByProduct(
    @Query('product_id') productId: string,
    @Query('regions') regions?: string,
  ) {
    return this.shopService.findByProduct(+productId, regions);
  }

  // PUBLIC: see findAll — full row only for a valid SUPER token.
  @Get(':id')
  @ApiOperation({ summary: 'Bitta do’kon' })
  @ApiParam({ name: 'id', type: Number })
  async findOne(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const full = await this.isSuper(authorization);
    return this.shopService.findOne(+id, full);
  }

  @Put(':id')
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: "Do'konni tahrirlash (SUPER)" })
  @ApiParam({ name: 'id', type: Number })
  update(@Param('id') id: string, @Body() data: UpdateShopDto) {
    return this.shopService.update(+id, data);
  }

  @Delete(':id')
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: "Do'konni o'chirish (SUPER)" })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id') id: string) {
    return this.shopService.remove(+id);
  }

  @Patch(':id/block')
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: "Do'konni bloklash/ochish (SUPER)" })
  @ApiParam({ name: 'id', type: Number })
  toggleBlock(@Param('id') id: string) {
    return this.shopService.toggleBlock(+id);
  }
}
