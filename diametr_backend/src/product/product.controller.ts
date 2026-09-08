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
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Role } from '@prisma/client';
import { RolesGuardFactory } from 'src/_guard/roles.guard';

@ApiTags('Product')
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(RolesGuardFactory([Role.ADMIN, Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Mahsulot yaratish (ADMIN/SUPER)' })
  create(@Body() data: CreateProductDto) {
    return this.productService.create(data);
  }

  @Post('/upload-image')
  @UseGuards(RolesGuardFactory([Role.ADMIN, Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Mahsulot rasmi yuklash (ADMIN/SUPER)' })
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
        destination: join(process.cwd(), 'public', 'products'),
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
      join(process.cwd(), 'public', 'products', filename),
      Buffer.from(response.data),
    );
    return { image: filename };
  }

  @Get('/all')
  @ApiOperation({ summary: "Barcha mahsulotlar ro'yxati" })
  findAll() {
    return this.productService.findAll();
  }

  @Get('/popular')
  @ApiOperation({ summary: "Eng ko'p sotilgan mahsulotlar" })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findPopular(@Query('limit') limit?: string) {
    const n = limit ? Math.min(parseInt(limit, 10) || 10, 50) : 10;
    return this.productService.findPopular(n);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta mahsulot' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id') id: string) {
    return this.productService.findOne(+id);
  }

  @Get('')
  @ApiOperation({ summary: "Kategoriya bo'yicha mahsulotlar" })
  @ApiQuery({ name: 'category_id', required: false, type: Number })
  findByCategory(@Query('category_id') category_id: string | undefined) {
    return this.productService.findByCategory(category_id);
  }

  @Put(':id')
  @UseGuards(RolesGuardFactory([Role.ADMIN, Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Mahsulotni tahrirlash (ADMIN/SUPER)' })
  @ApiParam({ name: 'id', type: Number })
  update(@Param('id') id: string, @Body() data: UpdateProductDto) {
    return this.productService.update(+id, data);
  }

  @Delete(':id')
  @UseGuards(RolesGuardFactory([Role.ADMIN, Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: "Mahsulotni o'chirish (ADMIN/SUPER)" })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id') id: string) {
    return this.productService.remove(+id);
  }
}
