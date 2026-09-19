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
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { RolesGuardFactory } from 'src/_guard/roles.guard';
import { diskStorage } from 'multer';
import { join } from 'path';
import {
  IMAGE_MAX_BYTES,
  imageFileFilter,
  imageFileName,
  uploadedImageName,
} from 'src/_utils/image-upload';
import { NewService } from './new.service';
import { CreateNewDto } from './dto/create-new.dto';
import { UpdateNewDto } from './dto/update-new.dto';

@ApiTags('New')
@Controller('new')
export class NewController {
  constructor(private readonly newService: NewService) {}

  // Writes and uploads are for the platform admin (dashboard) only; the
  // GET /all and GET :id reads stay public (site and mobile).
  @Post()
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Yangilik yaratish (SUPER)' })
  create(@Body() data: CreateNewDto) {
    return this.newService.create(data);
  }

  @Post('/upload-image')
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Yangilik rasmini yuklash (SUPER)' })
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
        destination: join(process.cwd(), 'public', 'news'),
        filename: imageFileName,
      }),
      fileFilter: imageFileFilter,
      limits: { fileSize: IMAGE_MAX_BYTES, files: 1 },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return { image: uploadedImageName(file) };
  }

  @Get('/all')
  @ApiOperation({ summary: 'Barcha yangiliklar ro’yxati' })
  findAll() {
    return this.newService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta yangilik' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id') id: string) {
    return this.newService.findOne(+id);
  }

  @Put(':id')
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Yangilikni tahrirlash (SUPER)' })
  @ApiParam({ name: 'id', type: Number })
  update(@Param('id') id: string, @Body() data: UpdateNewDto) {
    return this.newService.update(+id, data);
  }

  @Delete(':id')
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Yangilikni o’chirish (SUPER)' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id') id: string) {
    return this.newService.remove(+id);
  }
}
