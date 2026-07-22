import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
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
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { writeFileSync } from 'fs';
import axios from 'axios';
import { ProductItemService } from './product-item.service';
import { CreateProductItemDto } from './dto/create-product-item.dto';
import { UpdateProductItemDto } from './dto/update-product-item.dto';
import { Role } from '@prisma/client';
import { RolesGuardFactory } from 'src/_guard/roles.guard';

@ApiTags('Product-Item')
@Controller('product-item')
export class ProductItemController {
  constructor(private readonly productItemService: ProductItemService) {}

  @Post('/upload-image')
  @UseGuards(RolesGuardFactory([Role.ADMIN, Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Variant rasmi yuklash (ADMIN/SUPER)' })
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
        destination: join(process.cwd(), 'public', 'product-items'),
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
  @ApiOperation({
    summary: 'URL dan variant rasmi yuklab saqlash (ADMIN/SUPER)',
  })
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
      join(process.cwd(), 'public', 'product-items', filename),
      Buffer.from(response.data),
    );
    return { image: filename };
  }

  @Post()
  @ApiOperation({ summary: 'Mahsulot varianti yaratish' })
  create(@Body() data: CreateProductItemDto) {
    return this.productItemService.create(data);
  }

  @Get('/all')
  @ApiOperation({ summary: 'Barcha mahsulot variantlari' })
  findAll() {
    return this.productItemService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta mahsulot varianti' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id') id: string) {
    return this.productItemService.findOne(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mahsulot variantini tahrirlash' })
  @ApiParam({ name: 'id', type: Number })
  update(@Param('id') id: string, @Body() data: UpdateProductItemDto) {
    return this.productItemService.update(+id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Mahsulot variantini o’chirish' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id') id: string) {
    return this.productItemService.remove(+id);
  }
}
