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
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';
import { AuthGuard } from 'src/_guard/auth.guard';
import { RolesGuardFactory } from 'src/_guard/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // A customer's own profile only: for any other role req.user is a row of
  // another table and its id would rename an unrelated customer.
  // Must stay declared before PUT ':id'.
  @UseGuards(RolesGuardFactory([Role.USER]))
  @Put('/edit-profile')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Profilni tahrirlash' })
  @ApiResponse({ status: 200, description: 'Profil yangilandi' })
  editProfile(@Body() data: editProfileUserDto, @Req() req) {
    return this.userService.editProfile(req, data);
  }

  // Customer data (phones, Telegram chat ids) and account changes are for the
  // platform admin (dashboard) only. Changing a customer's phone hands their
  // account to whoever owns the new number at the next SMS login.
  @Get('/all')
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Barcha foydalanuvchilar ro’yxati (SUPER)' })
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Bitta foydalanuvchi (SUPER)' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Put(':id')
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Foydalanuvchini tahrirlash (SUPER)' })
  @ApiParam({ name: 'id', type: Number })
  update(@Param('id') id: string, @Body() data: UpdateUserDto) {
    return this.userService.update(+id, data);
  }

  @Delete(':id')
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Foydalanuvchini o’chirish (SUPER)' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
