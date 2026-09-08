import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import axios from 'axios';
import { BALANCE_TYPE } from '@prisma/client';
import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';

@Injectable()
export class SubscriptionService implements OnModuleInit {
  private readonly logger = new Logger(SubscriptionService.name);
  private readonly tgToken = process.env.TELEGRAM_BOT_TOKEN ?? '';

  private warnedToday = new Set<number>();
  private lastWarnDate = '';

  constructor(private readonly prisma: PrismaClientService) {}

  async onModuleInit() {
    await this.ensureSettings();
    setInterval(() => this.runHourlyCheck(), 60 * 60 * 1000);
    setTimeout(() => this.runHourlyCheck(), 30_000);
  }

  // тФАтФА Settings тФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФА
  async ensureSettings() {
    const s = await this.prisma.settings.findUnique({ where: { id: 1 } });
    if (!s) {
      return this.prisma.settings.create({
        data: { id: 1, free_trial_months: 2, subscription_price: 50000 },
      });
    }
    return s;
  }

  async getSettings() {
    return this.ensureSettings();
  }

  async updateSettings(data: {
    free_trial_months?: number;
    subscription_price?: number;
  }) {
    await this.ensureSettings();
    return this.prisma.settings.update({ where: { id: 1 }, data });
  }

  // тФАтФА Balance тФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФА
  async getShopBalance(shopId: number) {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        id: true,
        name: true,
        balance: true,
        expired: true,
        auto_payment: true,
      },
    });
    if (!shop) throw new NotFoundException('Shop not found');
    const settings = await this.ensureSettings();
    return { ...shop, subscription_price: settings.subscription_price };
  }

  private static readonly DISCOUNT_MAP: Record<number, number> = {
    1: 0,
    3: 10,
    6: 20,
    12: 30,
  };

  calcPlanPrice(monthlyPrice: number, months: number) {
    const discount = SubscriptionService.DISCOUNT_MAP[months] ?? 0;
    const total = monthlyPrice * months;
    return Math.round(total * (1 - discount / 100));
  }

  async payFromBalance(shopId: number, months = 1) {
    const settings = await this.ensureSettings();
    const price = this.calcPlanPrice(settings.subscription_price, months);
    const shop = await this.prisma.shop.findUniqueOrThrow({
      where: { id: shopId },
    });
    if ((shop.balance ?? 0) < price) {
      throw new BadRequestException(
        `Balansda yetarli mablag' yo'q. Kerak: ${price} so'm, balans: ${shop.balance ?? 0} so'm`,
      );
    }
    const now = new Date();
    const base = shop.expired && shop.expired > now ? shop.expired : now;
    const newBalance = (shop.balance ?? 0) - price;
    const newExpired = new Date(base);
    newExpired.setMonth(newExpired.getMonth() + months);

    await this.prisma.shop.update({
      where: { id: shopId },
      data: {
        balance: newBalance,
        expired: newExpired,
        work_status: 'WORKING',
      },
    });

    await this.prisma.shopBalanceLog.create({
      data: {
        shop_id: shopId,
        amount: -price,
        type: BALANCE_TYPE.SUBSCRIPTION_DEDUCT,
        note: `Balansdan obuna +${months} oy`,
        balance_after: newBalance,
      },
    });

    return {
      message: `Obuna ${months} oyga muvaffaqiyatli uzaytirildi`,
      balance: newBalance,
      expired: newExpired,
    };
  }

  async toggleAutoPayment(shopId: number, value: boolean) {
    await this.prisma.shop.findUniqueOrThrow({ where: { id: shopId } });
    return this.prisma.shop.update({
      where: { id: shopId },
      data: { auto_payment: value },
      select: { id: true, auto_payment: true },
    });
  }

  async getBalanceLogs(shopId: number, take = 20) {
    return this.prisma.shopBalanceLog.findMany({
      where: { shop_id: shopId },
      orderBy: { createdt: 'desc' },
      take,
    });
  }

  async getAllShopBalances() {
    return this.prisma.shop.findMany({
      select: {
        id: true,
        name: true,
        balance: true,
        expired: true,
        work_status: true,
        auto_payment: true,
        admins: { select: { fullname: true, phone: true, chat_id: true } },
      },
      orderBy: { balance: 'asc' },
    });
  }

  // тФАтФА Top-up тФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФА
  async topUp(
    shopId: number,
    amount: number,
    type: BALANCE_TYPE,
    note?: string,
  ) {
    const shop = await this.prisma.shop.findUniqueOrThrow({
      where: { id: shopId },
    });
    const newBalance = (shop.balance ?? 0) + amount;

    await this.prisma.shop.update({
      where: { id: shopId },
      data: { balance: newBalance },
    });

    await this.prisma.shopBalanceLog.create({
      data: { shop_id: shopId, amount, type, note, balance_after: newBalance },
    });

    const settings = await this.ensureSettings();
    const price = settings.subscription_price;
    if (shop.auto_payment !== false && newBalance >= price) {
      const now = new Date();
      const expired = shop.expired;
      if (!expired || expired <= now) {
        await this.deductAndExtend(shopId, newBalance, price, now);
        return { balance: newBalance - price, extended: true };
      }
    }

    return { balance: newBalance, extended: false };
  }

  async manualTopUp(shopId: number, amount: number, note?: string) {
    return this.topUp(
      shopId,
      amount,
      BALANCE_TYPE.TOP_UP_MANUAL,
      note ?? 'Super admin tomonidan',
    );
  }

  // тФАтФА Free trial тФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФА
  async giveFffreeTrial(shopId: number, months?: number) {
    const settings = await this.ensureSettings();
    const m = months ?? settings.free_trial_months;
    const shop = await this.prisma.shop.findUniqueOrThrow({
      where: { id: shopId },
    });
    const base =
      shop.expired && shop.expired > new Date() ? shop.expired : new Date();
    const newExpired = new Date(base);
    newExpired.setMonth(newExpired.getMonth() + m);

    await this.prisma.shop.update({
      where: { id: shopId },
      data: { expired: newExpired, work_status: 'WORKING' },
    });

    await this.prisma.shopBalanceLog.create({
      data: {
        shop_id: shopId,
        amount: 0,
        type: BALANCE_TYPE.FREE_TRIAL,
        note: `Bepul sinov: +${m} oy`,
        balance_after: shop.balance ?? 0,
      },
    });

    const dateStr = newExpired.toLocaleDateString('ru-RU');
    await this.notifyShopAdmin(
      shopId,
      `Sizning do'koningizga ${m} oylik bepul sinov berildi!\nObuna: ${dateStr} gacha`,
    );

    return { expired: newExpired };
  }

  // ── Set expiry ──────────────────────────────────────────────────────────────
  async setExpiry(shopId: number, expiredStr: string, note?: string) {
    const shop = await this.prisma.shop.findUniqueOrThrow({
      where: { id: shopId },
    });
    const newExpired = new Date(expiredStr);

    await this.prisma.shop.update({
      where: { id: shopId },
      data: { expired: newExpired, work_status: 'WORKING' },
    });

    await this.prisma.shopBalanceLog.create({
      data: {
        shop_id: shopId,
        amount: 0,
        type: BALANCE_TYPE.FREE_TRIAL,
        note:
          note ||
          `Muddati belgilandi: ${newExpired.toLocaleDateString('ru-RU')} gacha`,
        balance_after: shop.balance ?? 0,
      },
    });

    const formatted = newExpired.toLocaleDateString('ru-RU');
    await this.notifyShopAdmin(
      shopId,
      `Do'koningiz obuna muddati ${formatted} gacha belgilandi.`,
    );

    return { expired: newExpired };
  }

  // тФАтФА Click webhook тФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФА
  async handleClickWebhook(body: any) {
    const serviceId = process.env.CLICK_SERVICE_ID;
    const secretKey = process.env.CLICK_SECRET_KEY;
    const action = body?.action;
    const shopId = Number(String(body?.merchant_trans_id ?? '').split('_')[0]);
    const amount = Number(body?.amount);
    const transId = String(body?.click_trans_id ?? '');

    if (!shopId || !amount) {
      return { error: -8, error_note: 'Invalid params' };
    }

    if (secretKey) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const crypto = require('crypto');
      const sign = crypto
        .createHash('md5')
        .update(
          `${body.click_trans_id}${serviceId}${secretKey}${body.merchant_trans_id}${body.amount}${action}${body.sign_time}`,
        )
        .digest('hex');
      if (sign !== body.sign_string) {
        return { error: -1, error_note: 'SIGN CHECK FAILED' };
      }
    }

    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) return { error: -5, error_note: 'Shop not found' };

    if (action === 0) {
      return {
        click_trans_id: transId,
        merchant_trans_id: body.merchant_trans_id,
        merchant_prepare_id: shopId,
        error: 0,
        error_note: 'Success',
      };
    }

    if (action === 1) {
      await this.topUp(
        shopId,
        amount,
        BALANCE_TYPE.TOP_UP_CLICK,
        `Click | ${transId}`,
      );
      return {
        click_trans_id: transId,
        merchant_trans_id: body.merchant_trans_id,
        merchant_confirm_id: shopId,
        error: 0,
        error_note: 'Success',
      };
    }
    return { error: -3, error_note: 'Action not found' };
  }

  async handlePaymeWebhook(body: any) {
    const method = body?.method;
    const params = body?.params ?? {};
    const shopId = Number(params?.account?.shop_id);
    const amountTiyin = Number(params?.amount ?? 0);
    const amountSom = Math.floor(amountTiyin / 100);

    const settings = await this.ensureSettings();
    const price = settings.subscription_price;

    const respond = (result: any) => ({ id: body?.id ?? 1, result });
    const errResp = (code: number, msg: string) => ({
      id: body?.id ?? 1,
      error: { code, message: { uz: msg, ru: msg, en: msg } },
    });

    if (method === 'CheckPerformTransaction') {
      if (!shopId) return errResp(-31050, 'Shop ID kiritilmagan');
      const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
      if (!shop) return errResp(-31050, 'Shop topilmadi');
      if (amountSom < price)
        return errResp(-31001, `Minimal tolov ${price} som`);
      return respond({ allow: true });
    }

    if (method === 'CreateTransaction') {
      return respond({
        create_time: Date.now(),
        transaction: `sub_${shopId}_${Date.now()}`,
        state: 1,
      });
    }

    if (method === 'PerformTransaction') {
      await this.topUp(
        shopId,
        amountSom,
        BALANCE_TYPE.TOP_UP_PAYME,
        `Payme | ${params?.id ?? ''}`,
      );
      return respond({
        transaction: params?.id,
        perform_time: Date.now(),
        state: 2,
      });
    }

    if (method === 'CancelTransaction') {
      return respond({
        transaction: params?.id,
        cancel_time: Date.now(),
        state: -1,
      });
    }

    if (method === 'CheckTransaction') {
      return respond({
        create_time: Date.now(),
        perform_time: 0,
        cancel_time: 0,
        transaction: params?.id,
        state: 2,
        reason: null,
      });
    }

    return errResp(-32601, 'Method not found');
  }

  // тФАтФА Scheduler тФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФА
  async runHourlyCheck() {
    try {
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);

      if (this.lastWarnDate !== todayStr) {
        this.warnedToday.clear();
        this.lastWarnDate = todayStr;
      }

      const settings = await this.ensureSettings();
      const price = settings.subscription_price;

      const shops = await this.prisma.shop.findMany({
        where: { work_status: 'WORKING' },
      });

      for (const shop of shops) {
        if (!shop.expired) continue;
        const expired = new Date(shop.expired);
        const daysLeft = Math.ceil(
          (expired.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        const balance = shop.balance ?? 0;

        if (daysLeft <= 0) {
          if (balance >= price && shop.auto_payment !== false) {
            await this.deductAndExtend(shop.id, balance, price, now);
            const next = new Date(now);
            next.setMonth(next.getMonth() + 1);
            await this.notifyShopAdmin(
              shop.id,
              `Obuna avtomatik yangilandi! Hisobdan ${price.toLocaleString()} so'm yechildi. Yangi muddat: ${next.toLocaleDateString('ru-RU')} gacha`,
            );
          } else {
            await this.prisma.shop.update({
              where: { id: shop.id },
              data: { work_status: 'BLOCKED' },
            });
            await this.notifyShopAdmin(
              shop.id,
              `Obunangiz tugadi! Hisobda mablag yetarli emas (${balance.toLocaleString()} so'm). Hisobni toldiring: shop.diametr.uz тЖТ Profil`,
            );
          }
        } else if (
          daysLeft <= 3 &&
          balance < price &&
          !this.warnedToday.has(shop.id)
        ) {
          this.warnedToday.add(shop.id);
          await this.notifyShopAdmin(
            shop.id,
            `Diqqat! Obuna ${daysLeft} kunda tugaydi. Hisob balansi: ${balance.toLocaleString()} so'm. Obuna narxi: ${price.toLocaleString()} so'm/oy. Hisobni toldiring: shop.diametr.uz тЖТ Profil`,
          );
        }
      }
    } catch (e: any) {
      this.logger.error(`runHourlyCheck error: ${e?.message}`);
    }
  }

  // тФАтФА Internal helpers тФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФА
  private async deductAndExtend(
    shopId: number,
    currentBalance: number,
    price: number,
    from: Date,
  ) {
    const newBalance = currentBalance - price;
    const newExpired = new Date(from);
    newExpired.setMonth(newExpired.getMonth() + 1);

    await this.prisma.shop.update({
      where: { id: shopId },
      data: {
        balance: newBalance,
        expired: newExpired,
        work_status: 'WORKING',
      },
    });

    await this.prisma.shopBalanceLog.create({
      data: {
        shop_id: shopId,
        amount: -price,
        type: BALANCE_TYPE.SUBSCRIPTION_DEDUCT,
        note: `Oylik obuna +1 oy`,
        balance_after: newBalance,
      },
    });
  }

  async notifyShopAdmin(shopId: number, text: string) {
    if (!this.tgToken) return;
    try {
      const admins = await this.prisma.admin.findMany({
        where: { shop_id: shopId },
        select: { chat_id: true },
      });
      const chatIds = admins.map((a) => a.chat_id).filter(Boolean) as string[];
      await Promise.allSettled(
        chatIds.map((id) =>
          axios
            .post(
              `https://api.telegram.org/bot${this.tgToken}/sendMessage`,
              { chat_id: id, text, parse_mode: 'HTML' },
              { timeout: 8000 },
            )
            .catch((e: any) =>
              this.logger.error(`notifyShopAdmin error: ${e?.message}`),
            ),
        ),
      );
    } catch (e: any) {
      this.logger.error(`notifyShopAdmin error: ${e?.message}`);
    }
  }
}
