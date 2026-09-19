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
import { join } from 'path';
import {
  IMAGE_MAX_BYTES,
  downloadImageFromUrl,
  imageFileFilter,
  imageFileName,
  uploadedImageName,
} from 'src/_utils/image-upload';
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
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Mahsulot yaratish (SUPER)' })
  create(@Body() data: CreateProductDto) {
    return this.productService.create(data);
  }

  @Post('/upload-image')
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Mahsulot rasmi yuklash (SUPER)' })
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
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: "URL dan rasm yuklab saqlab qo'yish (SUPER)" })
  @ApiBody({
    schema: { type: 'object', properties: { url: { type: 'string' } } },
  })
  async uploadImageFromUrl(@Body() body: { url: string }) {
    return { image: await downloadImageFromUrl(body?.url, 'products') };
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
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Mahsulotni tahrirlash (SUPER)' })
  @ApiParam({ name: 'id', type: Number })
  update(@Param('id') id: string, @Body() data: UpdateProductDto) {
    return this.productService.update(+id, data);
  }

  @Delete(':id')
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: "Mahsulotni o'chirish (SUPER)" })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id') id: string) {
    return this.productService.remove(+id);
  }
}
