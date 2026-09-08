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

  @Get('/all')
  @ApiOperation({ summary: 'Barcha buyurtmalar ro’yxati' })
  findAll() {
    return this.orderService.findAll();
  }

  @Get('/my')
  @UseGuards(RolesGuardFactory([Role.USER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Mening buyurtmalarim (USER)' })
  findMyOrders(@Request() req: any) {
    return this.orderService.findByUser(req['user'].id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta buyurtma' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(+id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Buyurtmani o’chirish' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id') id: string) {
    return this.orderService.remove(+id);
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

  @Put('/finish/:id')
  @UseGuards(RolesGuardFactory([Role.ADMIN, Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Buyurtmani yakunlash (ADMIN/SUPER)' })
  @ApiParam({ name: 'id', type: Number })
  finish(@Param('id') id: string) {
    return this.orderService.finish(+id);
  }

  @Put('/confirm/:id')
  @UseGuards(RolesGuardFactory([Role.USER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Buyurtmani tasdiqlash (USER)' })
  @ApiParam({ name: 'id', type: Number })
  confirm(@Param('id') id: string) {
    return this.orderService.confirm(+id);
  }

  @Put('/cancel/:id')
  @UseGuards(RolesGuardFactory([Role.ADMIN, Role.SUPER]))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Buyurtmani bekor qilish (ADMIN/SUPER)' })
  @ApiParam({ name: 'id', type: Number })
  cancel(@Param('id') id: string) {
    return this.orderService.cancel(+id);
  }
}
