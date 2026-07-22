import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { Role } from '@prisma/client';
import { RolesGuardFactory } from 'src/_guard/roles.guard';

@ApiTags('Admin')
@ApiBearerAuth('JWT')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiOperation({ summary: 'Admin yaratish (SUPER)' })
  create(@Body() createAdminDto: CreateAdminDto) {
    return this.adminService.create(createAdminDto);
  }

  @Get('/all')
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiOperation({ summary: "Barcha adminlar ro'yxati (SUPER)" })
  findAll() {
    return this.adminService.findAll();
  }

  @Get(':id')
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiOperation({ summary: 'Bitta admin (SUPER)' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id') id: string) {
    return this.adminService.findOne(+id);
  }

  @Patch('/me')
  @UseGuards(RolesGuardFactory([Role.ADMIN]))
  @ApiOperation({ summary: "O'z chat_id'ini yangilash (ADMIN)" })
  updateMe(@Req() req: any, @Body('chat_id') chat_id: string) {
    return this.adminService.updateMe(req['user'].id, chat_id);
  }

  @Put(':id')
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiOperation({ summary: 'Adminni tahrirlash (SUPER)' })
  @ApiParam({ name: 'id', type: Number })
  update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
    return this.adminService.update(+id, updateAdminDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiOperation({ summary: "Adminni o'chirish (SUPER)" })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id') id: string) {
    return this.adminService.remove(+id);
  }
}
