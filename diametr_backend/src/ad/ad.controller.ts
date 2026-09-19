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
import { AdService } from './ad.service';
import { UpdateAdDto } from './dto/update-ad-dto';
import { CreateAdDto } from './dto/create-ad-dto';

@ApiTags('Ad')
@Controller('ad')
export class AdController {
  constructor(private readonly adService: AdService) {}

  // Writes and uploads are for the platform admin (dashboard) only; the
  // GET /all and GET :id reads stay public (site and mobile).
  @Post()
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Reklama yaratish (SUPER)' })
  create(@Body() data: CreateAdDto) {
    return this.adService.create(data);
  }

  @Post('/upload-image')
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Reklama (banner) rasmini yuklash (SUPER)' })
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
        destination: join(process.cwd(), 'public', 'ads'),
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
  @ApiOperation({ summary: 'Barcha reklamalar ro’yxati' })
  findAll() {
    return this.adService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta reklama' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id') id: string) {
    return this.adService.findOne(+id);
  }

  @Put(':id')
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Reklamani tahrirlash (SUPER)' })
  @ApiParam({ name: 'id', type: Number })
  update(@Param('id') id: string, @Body() data: UpdateAdDto) {
    return this.adService.update(+id, data);
  }

  @Delete(':id')
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Reklamani o’chirish (SUPER)' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id') id: string) {
    return this.adService.remove(+id);
  }
}
