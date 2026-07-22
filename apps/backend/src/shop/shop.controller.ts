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
} from '@nestjs/common';
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
import { extname, join } from 'path';
import { writeFileSync } from 'fs';
import axios from 'axios';
import { ShopService } from './shop.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { Role } from '@prisma/client';
import { RolesGuardFactory } from 'src/_guard/roles.guard';

@ApiTags('Shop')
@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Post()
  @UseGuards(RolesGuardFactory([Role.ADMIN, Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: "Do'kon yaratish (ADMIN/SUPER)" })
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
        filename: (_req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, unique + extname(file.originalname));
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowed = /\.(jpg|jpeg|png|webp|gif|svg|bmp)$/i;
        cb(null, allowed.test(file.originalname));
      },
      limits: { fileSize: 15 * 1024 * 1024, files: 1 },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return { image: file.filename };
  }

  @Post('/upload-image-url')
  @UseGuards(RolesGuardFactory([Role.ADMIN, Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: "URL dan rasm yuklab saqlab qo'yish (ADMIN/SUPER)" })
  @ApiBody({
    schema: { type: 'object', properties: { url: { type: 'string' } } },
  })
  async uploadImageFromUrl(@Body() body: { url: string }) {
    const response = await axios.get(body.url, {
      responseType: 'arraybuffer',
      maxContentLength: 15 * 1024 * 1024,
      maxBodyLength: 15 * 1024 * 1024,
      timeout: 15000,
    });
    const filename =
      Date.now() + '-' + Math.round(Math.random() * 1e9) + '.jpg';
    writeFileSync(
      join(process.cwd(), 'public', 'shops', filename),
      Buffer.from(response.data),
    );
    return { image: filename };
  }

  @Get('/all')
  @ApiOperation({ summary: "Barcha do'konlar ro'yxati" })
  @ApiQuery({ name: 'regions', required: false, type: String })
  findAll(@Query('regions') regions?: string) {
    return this.shopService.findAll(regions);
  }

  @Get('/all-admin')
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: "Barcha do'konlar (SUPER, bloklangan ham)" })
  @ApiQuery({ name: 'regions', required: false, type: String })
  findAllAdmin(@Query('regions') regions?: string) {
    return this.shopService.findAll(regions, true);
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

  @Get(':id')
  @ApiOperation({ summary: 'Bitta do’kon' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id') id: string) {
    return this.shopService.findOne(+id);
  }

  @Put(':id')
  @UseGuards(RolesGuardFactory([Role.ADMIN, Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: "Do'konni tahrirlash (ADMIN/SUPER)" })
  @ApiParam({ name: 'id', type: Number })
  update(@Param('id') id: string, @Body() data: UpdateShopDto) {
    return this.shopService.update(+id, data);
  }

  @Delete(':id')
  @UseGuards(RolesGuardFactory([Role.ADMIN, Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: "Do'konni o'chirish (ADMIN/SUPER)" })
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
