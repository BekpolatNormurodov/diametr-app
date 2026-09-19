import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Role } from '@prisma/client';
import { RolesGuardFactory } from 'src/_guard/roles.guard';

@ApiTags('Order')
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // Panels only: SUPER sees every order, a shop owner (ADMIN) only their own
  // shop's orders. Each row carries the customer's name/phone for the panel.
  @Get('/all')
  @UseGuards(RolesGuardFactory([Role.ADMIN, Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Barcha buyurtmalar ro’yxati (ADMIN: o‘z do‘koni, SUPER)' })
  findAll(@Request() req: any) {
    return this.orderService.findAll(req);
  }

  @Get('/my')
  @UseGuards(RolesGuardFactory([Role.USER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Mening buyurtmalarim (USER)' })
  findMyOrders(@Request() req: any) {
    return this.orderService.findByUser(req['user'].id);
  }

  // USER: own order (mobile order-status screen); ADMIN: order of own shop;
  // SUPER: any.
  @Get(':id')
  @UseGuards(RolesGuardFactory([Role.USER, Role.ADMIN, Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Bitta buyurtma (USER: o‘ziniki, ADMIN: o‘z do‘koni, SUPER)' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.orderService.findOne(+id, req);
  }

  // ADMIN may only delete orders of their own shop (403 otherwise).
  @Delete(':id')
  @UseGuards(RolesGuardFactory([Role.ADMIN, Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Buyurtmani o’chirish (ADMIN/SUPER)' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.orderService.remove(+id, req);
  }

  @Post()
  @UseGuards(RolesGuardFactory([Role.USER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Yangi buyurtma yaratish (USER)' })
  create(@Body() data: CreateOrderDto, @Request() req: any) {
    // Derive ORDER_SOURCE from verified JWT claim — cannot be spoofed via DTO
    const tokenSource: string | undefined = req['tokenSource'];
    if (tokenSource === 'STORE_BOT') data.source = 'STORE_BOT' as any;
    return this.orderService.create(data, req['user']?.id);
  }

  // ADMIN may only act on orders of their own shop (403 otherwise).
  @Put('/finish/:id')
  @UseGuards(RolesGuardFactory([Role.ADMIN, Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Buyurtmani yakunlash (ADMIN/SUPER)' })
  @ApiParam({ name: 'id', type: Number })
  finish(@Param('id') id: string, @Request() req: any) {
    return this.orderService.finish(+id, req);
  }

  // USER: own order; ADMIN: order of own shop; SUPER: any.
  @Put('/confirm/:id')
  @UseGuards(RolesGuardFactory([Role.USER, Role.ADMIN, Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Buyurtmani tasdiqlash (USER/ADMIN/SUPER)' })
  @ApiParam({ name: 'id', type: Number })
  confirm(@Param('id') id: string, @Request() req: any) {
    return this.orderService.confirm(+id, req);
  }

  @Put('/cancel/:id')
  @UseGuards(RolesGuardFactory([Role.ADMIN, Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Buyurtmani bekor qilish (ADMIN/SUPER)' })
  @ApiParam({ name: 'id', type: Number })
  cancel(@Param('id') id: string, @Request() req: any) {
    return this.orderService.cancel(+id, req);
  }
}
