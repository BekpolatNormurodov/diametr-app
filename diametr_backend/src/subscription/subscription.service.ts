import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import axios from 'axios';
import { createHash, timingSafeEqual } from 'crypto';
import { BALANCE_TYPE } from '@prisma/client';
import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';

/** Constant-time string compare (webhook signatures / credentials). */
function safeEqual(expected: string, received: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}

@Injectable()
export class SubscriptionService implements OnModuleInit {
  private readonly logger = new Logger(SubscriptionService.name);
  private readonly tgToken = process.env.TELEGRAM_BOT_TOKEN ?? '';

  private warnedToday = new Set<number>();
  private lastWarnDate = '';
  /** An hourly run still in progress (slow Telegram) must not overlap the next. */
  private checkRunning = false;

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
        // A shop can be BLOCKED by SUPER with a future expiry: the owner's
        // panel must not show "Faol" then.
        work_status: true,
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
    const newExpired = new Date(base);
    newExpired.setMonth(newExpired.getMonth() + months);

    // Conditional + relative write: applies only if the expiry is still the
    // one the new date was computed from and the balance still covers the
    // price, so a concurrent top-up / auto-renewal (other replica) is never
    // overwritten and nothing is charged twice.
    const newBalance = await this.prisma.$transaction(async (tx) => {
      const res = await tx.shop.updateMany({
        where: {
          id: shopId,
          expired: shop.expired,
          balance: { gte: price },
        },
        data: {
          balance: { decrement: price },
          expired: newExpired,
          work_status: 'WORKING',
        },
      });
      if (res.count !== 1) return null;
      const fresh = await tx.shop.findUniqueOrThrow({
        where: { id: shopId },
        select: { balance: true },
      });
      await tx.shopBalanceLog.create({
        data: {
          shop_id: shopId,
          amount: -price,
          type: BALANCE_TYPE.SUBSCRIPTION_DEDUCT,
          note: `Balansdan obuna +${months} oy`,
          balance_after: fresh.balance,
        },
      });
      return fresh.balance;
    });
    if (newBalance == null) {
      throw new BadRequestException(
        "Hisob holati hozirgina o'zgardi. Sahifani yangilab, qayta urinib ko'ring",
      );
    }

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
    opts: { idempotent?: boolean } = {},
  ) {
    await this.prisma.shop.findUniqueOrThrow({
      where: { id: shopId },
      select: { id: true },
    });

    // Relative increment (never an absolute value computed from an older
    // read), logged with the balance it produced.
    const shop = await this.prisma.$transaction(async (tx) => {
      if (opts.idempotent && note) {
        // Payment-provider credits are keyed by their transaction id (kept
        // in the log note; no schema change). The shop row lock serialises
        // concurrent retries of the same transaction on both replicas, so
        // the check below sees a credit committed by the other one.
        await tx.$queryRaw`SELECT id FROM shop WHERE id = ${shopId} FOR UPDATE`;
        const done = await tx.shopBalanceLog.findFirst({
          where: { shop_id: shopId, type, note },
          select: { id: true },
        });
        if (done) {
          const current = await tx.shop.findUnique({
            where: { id: shopId },
            select: { balance: true, expired: true, auto_payment: true },
          });
          return { ...current, duplicate: true };
        }
      }
      const updated = await tx.shop.update({
        where: { id: shopId },
        data: { balance: { increment: amount } },
        select: { balance: true, expired: true, auto_payment: true },
      });
      await tx.shopBalanceLog.create({
        data: {
          shop_id: shopId,
          amount,
          type,
          note,
          balance_after: updated.balance,
        },
      });
      return { ...updated, duplicate: false };
    });

    // Already credited for this transaction id: nothing changed.
    if (shop.duplicate) {
      return { balance: shop.balance, extended: false, duplicate: true };
    }

    const settings = await this.ensureSettings();
    const price = settings.subscription_price;
    if (shop.auto_payment !== false && shop.balance >= price) {
      const now = new Date();
      const expired = shop.expired;
      if (!expired || expired <= now) {
        const renewed = await this.deductAndExtend(shopId, price, now);
        if (renewed) {
          return { balance: renewed.balance, extended: true };
        }
      }
    }

    return { balance: shop.balance, extended: false };
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
    const serviceId = (process.env.CLICK_SERVICE_ID ?? '').trim();
    const secretKey = (process.env.CLICK_SECRET_KEY ?? '').trim();
    const signFailed = { error: -1, error_note: 'SIGN CHECK FAILED' };

    // Fail closed: without both secrets no request can be authenticated, so
    // nothing is credited (until the env is configured, Click is off).
    if (!serviceId || !secretKey) return signFailed;

    // Click form-posts strings ("0"/"1"), never numbers.
    const action = Number(body?.action);
    const raw = (v: unknown) => (v === undefined || v === null ? '' : String(v));
    // Prepare: md5(click_trans_id service_id SECRET merchant_trans_id amount
    // action sign_time); Complete also has merchant_prepare_id after
    // merchant_trans_id.
    const signSource =
      raw(body?.click_trans_id) +
      serviceId +
      secretKey +
      raw(body?.merchant_trans_id) +
      (action === 1 ? raw(body?.merchant_prepare_id) : '') +
      raw(body?.amount) +
      raw(body?.action) +
      raw(body?.sign_time);
    const expectedSign = createHash('md5').update(signSource).digest('hex');
    if (!safeEqual(expectedSign, raw(body?.sign_string).toLowerCase())) {
      return signFailed;
    }

    const shopId = Number(raw(body?.merchant_trans_id).split('_')[0]);
    const amount = Number(body?.amount);
    const transId = raw(body?.click_trans_id).trim();

    if (!Number.isInteger(shopId) || shopId <= 0 || !transId) {
      return { error: -8, error_note: 'Invalid params' };
    }
    // Whole so'm, positive: the balance is an Int and a negative "top-up"
    // would drain it.
    if (!Number.isInteger(amount) || amount <= 0) {
      return { error: -2, error_note: 'Incorrect parameter amount' };
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
      // Click reports a failed/cancelled payment with a negative `error`.
      if (Number(body?.error) < 0) {
        return {
          click_trans_id: transId,
          merchant_trans_id: body.merchant_trans_id,
          merchant_confirm_id: shopId,
          error: -9,
          error_note: 'Transaction cancelled',
        };
      }
      // Idempotent per click_trans_id: a retried Complete credits once.
      await this.topUp(
        shopId,
        amount,
        BALANCE_TYPE.TOP_UP_CLICK,
        `Click | ${transId}`,
        { idempotent: true },
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

  async handlePaymeWebhook(body: any, authorization?: string) {
    const method = body?.method;
    const params = body?.params ?? {};

    const respond = (result: any) => ({ id: body?.id ?? 1, result });
    const errResp = (code: number, msg: string) => ({
      id: body?.id ?? 1,
      error: { code, message: { uz: msg, ru: msg, en: msg } },
    });

    // Fail closed: Payme authenticates with Basic "Paycom:<merchant key>".
    // Without PAYME_KEY configured nothing is accepted.
    const key = (process.env.PAYME_KEY ?? '').trim();
    const expectedAuth =
      'Basic ' + Buffer.from(`Paycom:${key}`).toString('base64');
    if (!key || !safeEqual(expectedAuth, String(authorization ?? '').trim())) {
      return errResp(-32504, 'Insufficient privilege');
    }

    const shopId = Number(params?.account?.shop_id);
    const amountTiyin = Number(params?.amount ?? 0);
    const amountSom = Math.floor(amountTiyin / 100);
    // A positive whole number of tiyin worth at least 1 so'm.
    const amountValid =
      Number.isInteger(amountTiyin) && amountTiyin > 0 && amountSom > 0;

    const findShop = async () =>
      Number.isInteger(shopId) && shopId > 0
        ? this.prisma.shop.findUnique({
            where: { id: shopId },
            select: { id: true },
          })
        : null;

    if (method === 'CheckPerformTransaction') {
      if (!shopId) return errResp(-31050, 'Shop ID kiritilmagan');
      const shop = await findShop();
      if (!shop) return errResp(-31050, 'Shop topilmadi');
      if (!amountValid) return errResp(-31001, "Noto'g'ri summa");
      const settings = await this.ensureSettings();
      const price = settings.subscription_price;
      if (amountSom < price)
        return errResp(-31001, `Minimal tolov ${price} som`);
      return respond({ allow: true });
    }

    if (method === 'CreateTransaction') {
      const shop = await findShop();
      if (!shop) return errResp(-31050, 'Shop topilmadi');
      if (!amountValid) return errResp(-31001, "Noto'g'ri summa");
      return respond({
        create_time: Date.now(),
        transaction: `sub_${shopId}_${Date.now()}`,
        state: 1,
      });
    }

    if (method === 'PerformTransaction') {
      const txId =
        typeof params?.id === 'string' || typeof params?.id === 'number'
          ? String(params.id).trim()
          : '';
      if (!txId) return errResp(-31003, 'Tranzaksiya topilmadi');
      const shop = await findShop();
      if (!shop) return errResp(-31050, 'Shop topilmadi');
      if (!amountValid) return errResp(-31001, "Noto'g'ri summa");
      // Idempotent per Payme transaction id: a retried Perform credits once.
      await this.topUp(
        shopId,
        amountSom,
        BALANCE_TYPE.TOP_UP_PAYME,
        `Payme | ${txId}`,
        { idempotent: true },
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
  /**
   * Runs on every replica (2 in production). Safe because nothing here writes
   * from a snapshot: each shop is re-read right before it is handled, and the
   * renew/block writes are conditional on that shop still needing them, so
   * when both replicas (or a payment/top-up) race, exactly one write applies
   * and only that one logs and notifies.
   */
  async runHourlyCheck() {
    if (this.checkRunning) return;
    this.checkRunning = true;
    try {
      const todayStr = new Date().toISOString().slice(0, 10);

      if (this.lastWarnDate !== todayStr) {
        this.warnedToday.clear();
        this.lastWarnDate = todayStr;
      }

      const settings = await this.ensureSettings();
      const price = settings.subscription_price;

      const candidates = await this.prisma.shop.findMany({
        where: { work_status: 'WORKING', expired: { not: null } },
        select: { id: true },
        orderBy: { id: 'asc' },
      });

      for (const { id } of candidates) {
        // Fresh row: earlier iterations await Telegram (up to 8s per chat).
        const shop = await this.prisma.shop.findUnique({
          where: { id },
          select: {
            id: true,
            expired: true,
            balance: true,
            auto_payment: true,
            work_status: true,
          },
        });
        if (!shop || shop.work_status !== 'WORKING' || !shop.expired) continue;
        const now = new Date();
        const expired = new Date(shop.expired);
        const daysLeft = Math.ceil(
          (expired.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        const balance = shop.balance ?? 0;

        if (daysLeft <= 0) {
          if (balance >= price && shop.auto_payment !== false) {
            const renewed = await this.deductAndExtend(shop.id, price, now, true);
            if (!renewed) continue; // handled elsewhere meanwhile
            await this.notifyShopAdmin(
              shop.id,
              `Obuna avtomatik yangilandi! Hisobdan ${price.toLocaleString()} so'm yechildi. Yangi muddat: ${renewed.expired.toLocaleDateString('ru-RU')} gacha`,
            );
          } else {
            const blocked = await this.prisma.shop.updateMany({
              where: {
                id: shop.id,
                work_status: 'WORKING',
                expired: { lte: now },
                OR: [{ auto_payment: false }, { balance: { lt: price } }],
              },
              data: { work_status: 'BLOCKED' },
            });
            if (blocked.count !== 1) continue; // paid / renewed / blocked meanwhile
            await this.notifyShopAdmin(
              shop.id,
              `Obunangiz tugadi! Hisobda mablag' yetarli emas (${balance.toLocaleString()} so'm). Hisobni to'ldiring: shop.diametr.uz → Obuna holati`,
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
            `Diqqat! Obuna ${daysLeft} kunda tugaydi. Hisob balansi: ${balance.toLocaleString()} so'm. Obuna narxi: ${price.toLocaleString()} so'm/oy. Hisobni to'ldiring: shop.diametr.uz → Obuna holati`,
          );
        }
      }
    } catch (e: any) {
      this.logger.error(`runHourlyCheck error: ${e?.message}`);
    } finally {
      this.checkRunning = false;
    }
  }

  // тФАтФА Internal helpers тФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФА
  /**
   * Charges one month and extends from `from`, only while the shop still needs
   * it (auto payment on, expired or no expiry, balance covers the price; with
   * onlyWorking also still WORKING). Returns null when another writer got
   * there first, so callers log/notify nothing.
   */
  private async deductAndExtend(
    shopId: number,
    price: number,
    from: Date,
    onlyWorking = false,
  ): Promise<{ balance: number; expired: Date } | null> {
    const newExpired = new Date(from);
    newExpired.setMonth(newExpired.getMonth() + 1);

    return this.prisma.$transaction(async (tx) => {
      const res = await tx.shop.updateMany({
        where: {
          id: shopId,
          ...(onlyWorking ? { work_status: 'WORKING' as const } : {}),
          auto_payment: true,
          balance: { gte: price },
          OR: [{ expired: null }, { expired: { lte: from } }],
        },
        data: {
          balance: { decrement: price },
          expired: newExpired,
          work_status: 'WORKING',
        },
      });
      if (res.count !== 1) return null;

      const fresh = await tx.shop.findUniqueOrThrow({
        where: { id: shopId },
        select: { balance: true },
      });
      await tx.shopBalanceLog.create({
        data: {
          shop_id: shopId,
          amount: -price,
          type: BALANCE_TYPE.SUBSCRIPTION_DEDUCT,
          note: `Oylik obuna +1 oy`,
          balance_after: fresh.balance,
        },
      });
      return { balance: fresh.balance, expired: newExpired };
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
