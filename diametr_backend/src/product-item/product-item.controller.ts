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
import { join } from 'path';
import {
  IMAGE_MAX_BYTES,
  downloadImageFromUrl,
  imageFileFilter,
  imageFileName,
  uploadedImageName,
} from 'src/_utils/image-upload';
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
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Variant rasmi yuklash (SUPER)' })
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
  @ApiOperation({
    summary: 'URL dan variant rasmi yuklab saqlash (SUPER)',
  })
  @ApiBody({
    schema: { type: 'object', properties: { url: { type: 'string' } } },
  })
  async uploadImageFromUrl(@Body() body: { url: string }) {
    return { image: await downloadImageFromUrl(body?.url, 'product-items') };
  }

  @Post()
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Mahsulot varianti yaratish (SUPER)' })
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
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Mahsulot variantini tahrirlash (SUPER)' })
  @ApiParam({ name: 'id', type: Number })
  update(@Param('id') id: string, @Body() data: UpdateProductItemDto) {
    return this.productItemService.update(+id, data);
  }

  @Delete(':id')
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Mahsulot variantini o’chirish (SUPER)' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id') id: string) {
    return this.productItemService.remove(+id);
  }
}
