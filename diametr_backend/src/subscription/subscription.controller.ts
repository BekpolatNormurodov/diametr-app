import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { RolesGuardFactory } from 'src/_guard/roles.guard';
import { SubscriptionService } from './subscription.service';
import {
  GiveFreeTrialDto,
  PayFromBalanceDto,
  SetExpiryDto,
  ToggleAutoPaymentDto,
  TopUpDto,
  UpdateSettingsDto,
} from './dto/subscription.dto';

@ApiTags('Subscription')
@ApiBearerAuth('JWT')
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly service: SubscriptionService) {}

  // ── SUPER admin ────────────────────────────────────────────────────────────

  @Get('settings')
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiOperation({ summary: 'Sozlamalarni olish (SUPER)' })
  getSettings() {
    return this.service.getSettings();
  }

  @Patch('settings')
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiOperation({ summary: "Sozlamalarni o'zgartirish (SUPER)" })
  updateSettings(@Body() dto: UpdateSettingsDto) {
    return this.service.updateSettings(dto);
  }

  @Get('shops')
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiOperation({ summary: "Barcha do'konlar balansi (SUPER)" })
  getAllShopBalances() {
    return this.service.getAllShopBalances();
  }

  @Post('top-up/:shopId')
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiOperation({ summary: "Do'kon hisobini to'ldirish (SUPER)" })
  @ApiParam({ name: 'shopId', type: Number })
  manualTopUp(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Body() dto: TopUpDto,
  ) {
    return this.service.manualTopUp(shopId, dto.amount, dto.note);
  }

  @Post('free-trial/:shopId')
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiOperation({ summary: "Do'konga bepul sinov berish (SUPER)" })
  @ApiParam({ name: 'shopId', type: Number })
  giveFfreeTrial(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Body() dto: GiveFreeTrialDto,
  ) {
    return this.service.giveFffreeTrial(shopId, dto.months);
  }

  @Patch('set-expiry/:shopId')
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiOperation({ summary: "Do'kon obuna muddatini belgilash (SUPER)" })
  @ApiParam({ name: 'shopId', type: Number })
  setExpiry(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Body() dto: SetExpiryDto,
  ) {
    return this.service.setExpiry(shopId, dto.expired, dto.note);
  }

  @Patch('auto-payment/:shopId')
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiOperation({ summary: "Do'kon avto to'lovini yoqish/o'chirish (SUPER)" })
  @ApiParam({ name: 'shopId', type: Number })
  toggleAutoPaymentSuper(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Body() dto: ToggleAutoPaymentDto,
  ) {
    return this.service.toggleAutoPayment(shopId, dto.auto_payment);
  }

  @Get('logs/:shopId')
  @UseGuards(RolesGuardFactory([Role.SUPER]))
  @ApiOperation({ summary: "Do'kon hisobi jurnali (SUPER)" })
  @ApiParam({ name: 'shopId', type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  getShopLogs(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Query('take') take?: string,
  ) {
    return this.service.getBalanceLogs(shopId, take ? +take : 50);
  }

  // ── ADMIN (shop admin logged-in user) ─────────────────────────────────────

  @Get('balance')
  @UseGuards(RolesGuardFactory([Role.ADMIN]))
  @ApiOperation({ summary: "O'z do'konimi balansi (ADMIN)" })
  getMyBalance(@Req() req: any) {
    const shopId = req['user']?.shop?.id ?? req['user']?.shop_id;
    return this.service.getShopBalance(shopId);
  }

  @Get('my-logs')
  @UseGuards(RolesGuardFactory([Role.ADMIN]))
  @ApiOperation({ summary: "O'z hisobi jurnali (ADMIN)" })
  @ApiQuery({ name: 'take', required: false, type: Number })
  getMyLogs(@Req() req: any, @Query('take') take?: string) {
    const shopId = req['user']?.shop?.id ?? req['user']?.shop_id;
    return this.service.getBalanceLogs(shopId, take ? +take : 20);
  }

  @Post('pay-from-balance')
  @UseGuards(RolesGuardFactory([Role.ADMIN]))
  @ApiOperation({ summary: "Balansdan obuna to'lash (ADMIN)" })
  payFromBalance(@Req() req: any, @Body() dto: PayFromBalanceDto) {
    const shopId = req['user']?.shop?.id ?? req['user']?.shop_id;
    return this.service.payFromBalance(shopId, dto.months);
  }

  @Patch('auto-payment')
  @UseGuards(RolesGuardFactory([Role.ADMIN]))
  @ApiOperation({ summary: "Avto to'lov yoqish/o'chirish (ADMIN)" })
  toggleAutoPayment(@Req() req: any, @Body() dto: ToggleAutoPaymentDto) {
    const shopId = req['user']?.shop?.id ?? req['user']?.shop_id;
    return this.service.toggleAutoPayment(shopId, dto.auto_payment);
  }

  // ── Payment webhooks (PUBLIC) ─────────────────────────────────────────────

  @Post('webhook/click')
  @ApiOperation({ summary: 'Click webhook' })
  handleClick(@Body() body: any) {
    return this.service.handleClickWebhook(body);
  }

  @Post('webhook/payme')
  @ApiOperation({ summary: 'Payme webhook (JSON-RPC)' })
  handlePayme(@Body() body: any) {
    return this.service.handlePaymeWebhook(body);
  }
}
