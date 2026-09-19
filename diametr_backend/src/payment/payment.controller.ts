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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { RolesGuardFactory } from 'src/_guard/roles.guard';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

// Panels only. SUPER: every payment record. A shop owner (ADMIN): only the
// records of their own shop (list filtered, others 403, create/update forced
// to their own shop and type SHOP).
@ApiTags('Payment')
@ApiBearerAuth('JWT')
@UseGuards(RolesGuardFactory([Role.ADMIN, Role.SUPER]))
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @ApiOperation({ summary: 'To’lov yaratish (ADMIN: o‘z do‘koni, SUPER)' })
  create(@Body() createAdminDto: CreatePaymentDto, @Request() req: any) {
    return this.paymentService.create(createAdminDto, req);
  }

  @Get('/all')
  @ApiOperation({ summary: 'Barcha to’lovlar ro’yxati (ADMIN: o‘z do‘koni, SUPER)' })
  findAll(@Request() req: any) {
    return this.paymentService.findAll(req);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta to’lov (ADMIN: o‘z do‘koni, SUPER)' })
  @ApiParam({ name: 'id', type: String })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.paymentService.findOne(id, req);
  }

  @Put(':id')
  @ApiOperation({ summary: 'To’lovni tahrirlash (ADMIN: o‘z do‘koni, SUPER)' })
  @ApiParam({ name: 'id', type: String })
  update(
    @Param('id') id: string,
    @Body() data: UpdatePaymentDto,
    @Request() req: any,
  ) {
    return this.paymentService.update(id, data, req);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'To’lovni o’chirish (ADMIN: o‘z do‘koni, SUPER)' })
  @ApiParam({ name: 'id', type: String })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.paymentService.remove(id, req);
  }
}
