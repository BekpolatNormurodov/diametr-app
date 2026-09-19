import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseInterceptors,
  UploadedFile,
  UseGuards,
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
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Role } from '@prisma/client';
import { RolesGuardFactory } from 'src/_guard/roles.guard';

@ApiTags('Category')
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Kategoriya yaratish (SUPER)' })
  create(@Body() data: CreateCategoryDto) {
    return this.categoryService.create(data);
  }

  @Post('/upload-image')
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Kategoriya rasmi yuklash (SUPER)' })
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
        destination: join(process.cwd(), 'public', 'categories'),
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
    summary: "URL dan rasm yuklab PNG saqlab qo'yish (SUPER)",
  })
  @ApiBody({
    schema: { type: 'object', properties: { url: { type: 'string' } } },
  })
  async uploadImageFromUrl(@Body() body: { url: string }) {
    return { image: await downloadImageFromUrl(body?.url, 'categories') };
  }

  @Get('/all')
  @ApiOperation({ summary: 'Barcha kategoriyalar ro’yxati' })
  findAll() {
    return this.categoryService.findAll();
  }
  @Get('/stats')
  @UseGuards(RolesGuardFactory([Role.ADMIN, Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Kategoriyalar statistikasi (ADMIN/SUPER)' })
  findAllWithStats() {
    return this.categoryService.findAllWithStats();
  }
  @Get(':id')
  @ApiOperation({ summary: 'Bitta kategoriya' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(+id);
  }

  @Put(':id')
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Kategoriyani tahrirlash (SUPER)' })
  @ApiParam({ name: 'id', type: Number })
  update(@Param('id') id: string, @Body() data: UpdateCategoryDto) {
    return this.categoryService.update(+id, data);
  }

  @Delete(':id')
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: "Kategoriyani o'chirish (SUPER)" })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id') id: string) {
    return this.categoryService.remove(+id);
  }
}
