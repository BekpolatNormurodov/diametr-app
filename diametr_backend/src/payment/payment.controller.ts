import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @ApiOperation({ summary: 'To’lov yaratish' })
  create(@Body() createAdminDto: CreatePaymentDto) {
    return this.paymentService.create(createAdminDto);
  }

  @Get('/all')
  @ApiOperation({ summary: 'Barcha to’lovlar ro’yxati' })
  findAll() {
    return this.paymentService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta to’lov' })
  @ApiParam({ name: 'id', type: String })
  findOne(@Param('id') id: string) {
    return this.paymentService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'To’lovni tahrirlash' })
  @ApiParam({ name: 'id', type: String })
  update(@Param('id') id: string, @Body() data: UpdatePaymentDto) {
    return this.paymentService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'To’lovni o’chirish' })
  @ApiParam({ name: 'id', type: String })
  remove(@Param('id') id: string) {
    return this.paymentService.remove(id);
  }
}
