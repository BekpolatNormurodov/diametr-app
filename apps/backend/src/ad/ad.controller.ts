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
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { AdService } from './ad.service';
import { UpdateAdDto } from './dto/update-ad-dto';
import { CreateAdDto } from './dto/create-ad-dto';

@ApiTags('Ad')
@Controller('ad')
export class AdController {
  constructor(private readonly adService: AdService) {}

  @Post()
  @ApiOperation({ summary: 'Reklama yaratish' })
  create(@Body() data: CreateAdDto) {
    return this.adService.create(data);
  }

  @Post('/upload-image')
  @ApiOperation({ summary: 'Reklama (banner) rasmini yuklash' })
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
  @ApiOperation({ summary: 'Reklamani tahrirlash' })
  @ApiParam({ name: 'id', type: Number })
  update(@Param('id') id: string, @Body() data: UpdateAdDto) {
    return this.adService.update(+id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Reklamani o’chirish' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id') id: string) {
    return this.adService.remove(+id);
  }
}
