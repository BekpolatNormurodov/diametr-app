import {
  Controller,
  Get,
  Body,
  Param,
  Delete,
  Put,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { editProfileUserDto } from './dto/edit-profile-user.dto';
import { UserService } from './user.service';
import { AuthGuard } from 'src/_guard/auth.guard';
import { RolesGuardFactory } from 'src/_guard/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(RolesGuardFactory([Role.USER, Role.SUPER]))
  @Put('/edit-profile')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Profilni tahrirlash' })
  @ApiResponse({ status: 200, description: 'Profil yangilandi' })
  editProfile(@Body() data: editProfileUserDto, @Req() req) {
    return this.userService.editProfile(req, data);
  }

  @Get('/all')
  @ApiOperation({ summary: 'Barcha foydalanuvchilar ro’yxati' })
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta foydalanuvchi' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Foydalanuvchini o’chirish' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
