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
import { NewService } from './new.service';
import { CreateNewDto } from './dto/create-new.dto';
import { UpdateNewDto } from './dto/update-new.dto';

@ApiTags('New')
@Controller('new')
export class NewController {
  constructor(private readonly newService: NewService) {}

  @Post()
  @ApiOperation({ summary: 'Yangilik yaratish' })
  create(@Body() data: CreateNewDto) {
    return this.newService.create(data);
  }

  @Post('/upload-image')
  @ApiOperation({ summary: 'Yangilik rasmini yuklash' })
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
  @ApiOperation({ summary: 'Yangilikni tahrirlash' })
  @ApiParam({ name: 'id', type: Number })
  update(@Param('id') id: string, @Body() data: UpdateNewDto) {
    return this.newService.update(+id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Yangilikni o’chirish' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id') id: string) {
    return this.newService.remove(+id);
  }
}
