import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';

// ─── UZT helpers (+5) ─────────────────────────────────────────────────────────
function uztNow(): Date {
  return new Date(Date.now() + 5 * 60 * 60 * 1000);
}
function uztDayRange(d: Date): { start: Date; end: Date } {
  const y = d.getUTCFullYear(),
    mo = d.getUTCMonth(),
    day = d.getUTCDate();
  const start = new Date(Date.UTC(y, mo, day) - 5 * 60 * 60 * 1000);
  return { start, end: new Date(start.getTime() + 86_400_000) };
}
function uztMonthRange(): { start: Date; end: Date } {
  const u = uztNow();
  const start = new Date(
    Date.UTC(u.getUTCFullYear(), u.getUTCMonth(), 1) - 5 * 60 * 60 * 1000,
  );
  const end = new Date(
    Date.UTC(u.getUTCFullYear(), u.getUTCMonth() + 1, 1) - 5 * 60 * 60 * 1000,
  );
  return { start, end };
}
function uztYearRange(): { start: Date; end: Date } {
  const u = uztNow();
  const start = new Date(
    Date.UTC(u.getUTCFullYear(), 0, 1) - 5 * 60 * 60 * 1000,
  );
  const end = new Date(
    Date.UTC(u.getUTCFullYear() + 1, 0, 1) - 5 * 60 * 60 * 1000,
  );
  return { start, end };
}
function uztLabel(d: Date): string {
  return new Date(d.getTime() + 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

const BOT_COMMANDS = [
  { command: 'start', description: '🚀 Botni ishga tushirish' },
  { command: 'help', description: '📖 Yordam va buyruqlar' },
  { command: 'stats', description: '📊 Bugungi statistika' },
  { command: 'orders', description: "📦 So'nggi 10 ta buyurtma" },
  { command: 'status', description: '🔍 Buyurtma holati: /status 123' },
  { command: 'hisobot_bugun', description: '📋 Bugungi hisobot' },
  { command: 'hisobot_kecha', description: '📋 Kechagi hisobot' },
  { command: 'hisobot_oylik', description: '📋 Oylik hisobot' },
  { command: 'hisobot_yillik', description: '📋 Yillik hisobot' },
  { command: 'excel_bugun', description: '📥 Bugun Excel' },
  { command: 'excel_kecha', description: '📥 Kecha Excel' },
  { command: 'excel_oylik', description: '📥 Oy Excel' },
  { command: 'excel_yillik', description: '📥 Yil Excel' },
];

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private readonly token = process.env.TELEGRAM_BOT_TOKEN ?? '';
  /** barcha admin chat IDlari (vergul bilan: 123,456,-100789) */
  private readonly chatIds: number[] = (process.env.TELEGRAM_CHAT_IDS ?? '')
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));
  private lastDailySummaryDate = '';

  constructor(private readonly prisma: PrismaClientService) {}

  // ─── Init ─────────────────────────────────────────────────────────
  async onModuleInit() {
    if (!this.token || this.chatIds.length === 0) {
      this.logger.warn(
        "TELEGRAM_BOT_TOKEN yoki TELEGRAM_CHAT_IDS topilmadi — bot o'chirilgan",
      );
      return;
    }
    this.logger.log(
      `Telegram bot ishga tushdi ✅ | Adminlar: ${this.chatIds.join(', ')}`,
    );
    await this.registerCommands();
    // Webhook — faqat bitta endpoint, replika soni muhim emas
    const backendUrl = process.env.BACKEND_URL?.replace(/\/$/, '');
    if (backendUrl) {
      await this.setWebhook(`${backendUrl}/telegram/webhook`);
    } else {
      this.logger.warn("BACKEND_URL topilmadi — webhook o'rnatilmadi");
    }
    setInterval(() => this.checkDailySummary(), 60_000);
  }

  private async setWebhook(url: string) {
    try {
      await axios.post(
        `https://api.telegram.org/bot${this.token}/setWebhook`,
        { url, drop_pending_updates: true },
        { timeout: 8000 },
      );
      this.logger.log(`Webhook set: ${url} ✅`);
    } catch (e: any) {
      this.logger.error(`setWebhook error: ${e?.message}`);
    }
  }

  private async registerCommands() {
    try {
      await axios.post(
        `https://api.telegram.org/bot${this.token}/setMyCommands`,
        { commands: BOT_COMMANDS },
        { timeout: 8000 },
      );
      this.logger.log('Bot commands registered ✅');
    } catch (e: any) {
      this.logger.error(`registerCommands error: ${e?.message}`);
    }
  }

  // ─── handleUpdate ─────────────────────────────────────────────────
  async handleUpdate(update: any) {
    try {
      const message = update?.message ?? update?.edited_message;
      if (!message) return;
      const chatId = message.chat?.id;
      const text: string = message.text ?? '';

      // ── Messages from non-super-admins (shop admins / unknown users) ──
      if (!this.chatIds.includes(chatId)) {
        if (text.trim().toLowerCase() === '/start') {
          await this.reply(
            chatId,
            `👋 Salom! \n\n` +
              `Sizning <b>Chat ID</b>ingiz:\n` +
              `<code>${chatId}</code>\n\n` +
              `Bu raqamni <b>shop.diametr.uz</b> → Profil → Telegram bo'limiga kiriting.`,
          );
          return;
        }
        // Check if this is a known shop admin by chat_id
        const admin = await this.prisma.admin.findFirst({
          where: { chat_id: String(chatId) },
          include: { shop: { select: { id: true, name: true } } },
        });
        if (admin && text.trim()) {
          // Forward message to super admins
          const shopName = admin.shop?.name ?? "Do'kon noma'lum";
          const adminName = admin.fullname ?? admin.phone ?? 'Admin';
          await this.reply(
            chatId,
            `✅ Xabaringiz qabul qilindi.\nTez orada javob beramiz.`,
          );
          await this.send(
            `📩 <b>Do'kon admin xabari</b>\n` +
              `━━━━━━━━━━━━━━━━━\n` +
              `🏪 Do'kon: <b>${shopName}</b>\n` +
              `👤 Admin: <b>${adminName}</b> | <code>${admin.phone}</code>\n` +
              `💬 Xabar:\n${text}`,
          );
        }
        return;
      }

      if (!text.startsWith('/')) return;
      const [rawCmd, arg] = text.split(' ');
      await this.handleCommand(rawCmd.split('@')[0].toLowerCase(), chatId, arg);
    } catch (e: any) {
      this.logger.error(`handleUpdate error: ${e?.message}`);
    }
  }

  /** Send a message to a specific chat (used by subscription service etc.) */
  async sendToChat(chatId: string | number, text: string) {
    await this.reply(Number(chatId), text);
  }

  // ─── Command router ────────────────────────────────────────────────
  private async handleCommand(cmd: string, chatId: number, arg?: string) {
    switch (cmd) {
      case '/start':
        return this.cmdStart(chatId);
      case '/help':
        return this.cmdHelp(chatId);
      case '/stats':
        return this.cmdStats(chatId);
      case '/orders':
        return this.cmdOrders(chatId);
      case '/status':
        return this.cmdStatus(chatId, arg ?? '');
      case '/hisobot_bugun': {
        const r = uztDayRange(uztNow());
        return this.sendStatReport(
          chatId,
          r.start,
          r.end,
          `Bugun (${uztLabel(uztNow())})`,
        );
      }
      case '/hisobot_kecha': {
        const y = new Date(uztNow().getTime() - 86_400_000);
        const r = uztDayRange(y);
        return this.sendStatReport(
          chatId,
          r.start,
          r.end,
          `Kecha (${uztLabel(y)})`,
        );
      }
      case '/hisobot_oylik': {
        const r = uztMonthRange();
        const u = uztNow();
        return this.sendStatReport(
          chatId,
          r.start,
          r.end,
          `${u.getUTCFullYear()}-${String(u.getUTCMonth() + 1).padStart(2, '0')} oy`,
        );
      }
      case '/hisobot_yillik': {
        const r = uztYearRange();
        return this.sendStatReport(
          chatId,
          r.start,
          r.end,
          `${uztNow().getUTCFullYear()} yil`,
        );
      }
      case '/excel_bugun': {
        const r = uztDayRange(uztNow());
        return this.sendExcel(
          chatId,
          r.start,
          r.end,
          `bugun_${uztLabel(uztNow())}`,
        );
      }
      case '/excel_kecha': {
        const y = new Date(uztNow().getTime() - 86_400_000);
        const r = uztDayRange(y);
        return this.sendExcel(chatId, r.start, r.end, `kecha_${uztLabel(y)}`);
      }
      case '/excel_oylik': {
        const r = uztMonthRange();
        const u = uztNow();
        return this.sendExcel(
          chatId,
          r.start,
          r.end,
          `${u.getUTCFullYear()}_${String(u.getUTCMonth() + 1).padStart(2, '0')}_oy`,
        );
      }
      case '/excel_yillik': {
        const r = uztYearRange();
        return this.sendExcel(
          chatId,
          r.start,
          r.end,
          `${uztNow().getUTCFullYear()}_yil`,
        );
      }
    }
  }

  // ─── Commands ─────────────────────────────────────────────────────

  private async cmdStart(chatId: number) {
    const text =
      `👋 <b>Diametr.uz botiga xush kelibsiz!</b>\n\n` +
      `🏗 Qurilish materiallari platformasining rasmiy yordamchisi.\n\n` +
      `<b>Nima qila olaman?</b>\n` +
      `📦 Buyurtmalar haqida bildirishnoma berish\n` +
      `📊 Kunlik statistika yuborish\n` +
      `🔍 Buyurtma holati tekshirish\n\n` +
      `Buyruqlar ro'yxati uchun /help yozing ⬇️`;
    await this.reply(chatId, text);
  }

  private async cmdHelp(chatId: number) {
    const lines = BOT_COMMANDS.map(
      (c) => `/${c.command} — ${c.description}`,
    ).join('\n');
    const text = `📖 <b>Buyruqlar ro'yxati:</b>\n\n${lines}`;
    await this.reply(chatId, text);
  }

  private async cmdStats(chatId: number) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const uztMidnight = new Date(todayStart.getTime() - 5 * 60 * 60 * 1000);

    const [orders, users, shops] = await Promise.all([
      this.prisma.order.findMany({
        where: { createdt: { gte: uztMidnight } },
        select: { status: true, amount: true },
      }),
      this.prisma.user.count(),
      this.prisma.shop.count({ where: { work_status: 'WORKING' } }),
    ]);

    const total = orders.reduce((s, o) => s + (o.amount ?? 0), 0);
    const statusMap: Record<string, string> = {
      STARTED: '🟡 Yangi',
      FINISHED: '🔵 Tasdiqlandi',
      CONFIRMED: '✅ Yetkazildi',
      CANCELED: '❌ Bekor',
    };
    const byStatus = orders.reduce<Record<string, number>>((acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    }, {});

    const statusLines =
      Object.entries(byStatus)
        .map(([s, c]) => `  ${statusMap[s] ?? s}: ${c} ta`)
        .join('\n') || "  — buyurtma yo'q";

    const today = new Date().toLocaleDateString('uz-UZ', {
      timeZone: 'Asia/Tashkent',
    });
    const text =
      `📊 <b>Bugungi statistika</b> (${today})\n` +
      `━━━━━━━━━━━━━━━━━\n` +
      `📦 Buyurtmalar: <b>${orders.length} ta</b>\n` +
      `💰 Jami summa: <b>${total.toLocaleString()} so'm</b>\n\n` +
      `📋 Holat bo'yicha:\n${statusLines}\n\n` +
      `👥 Jami foydalanuvchilar: <b>${users}</b>\n` +
      `🏪 Faol do'konlar: <b>${shops}</b>`;

    await this.reply(chatId, text);
  }

  private async cmdOrders(chatId: number) {
    const orders = await this.prisma.order.findMany({
      take: 10,
      orderBy: { createdt: 'desc' },
      include: { shop: { select: { name: true } } },
    });

    if (!orders.length) {
      return this.reply(chatId, "📭 Hali buyurtmalar yo'q.");
    }

    const statusEmoji: Record<string, string> = {
      STARTED: '🟡',
      FINISHED: '🔵',
      CONFIRMED: '✅',
      CANCELED: '❌',
    };

    const lines = orders
      .map((o) => {
        const emoji = statusEmoji[o.status] ?? '⚪';
        const amount = (o.amount ?? 0).toLocaleString();
        const shop = o.shop?.name ?? '—';
        return `${emoji} #${o.id} | ${shop} | ${amount} so'm`;
      })
      .join('\n');

    await this.reply(chatId, `📦 <b>So'nggi 10 ta buyurtma:</b>\n\n${lines}`);
  }

  private async cmdStatus(chatId: number, idArg?: string) {
    const orderId = Number(idArg);
    if (!orderId || isNaN(orderId)) {
      return this.reply(
        chatId,
        '❗ Buyurtma ID kiriting:\n<code>/status 123</code>',
      );
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { shop: { select: { name: true } } },
    });

    if (!order) {
      return this.reply(chatId, `❌ #${orderId} raqamli buyurtma topilmadi.`);
    }

    const statusMap: Record<string, string> = {
      STARTED: "🟡 Yangi — ko'rib chiqilmoqda",
      FINISHED: '🔵 Tasdiqlandi — yetkazishga tayyor',
      CONFIRMED: '✅ Yetkazildi — yakunlangan',
      CANCELED: '❌ Bekor qilindi',
    };

    const created = order.createdt
      ? new Date(order.createdt).toLocaleString('uz-UZ', {
          timeZone: 'Asia/Tashkent',
        })
      : '—';

    const text =
      `🔍 <b>Buyurtma #${order.id}</b>\n` +
      `━━━━━━━━━━━━━━━━━\n` +
      `🏪 Do'kon: ${order.shop?.name ?? '—'}\n` +
      `📍 Manzil: ${order.address ?? '—'}\n` +
      `💰 Summa: <b>${(order.amount ?? 0).toLocaleString()} so'm</b>\n` +
      `📅 Sana: ${created}\n\n` +
      `📌 Holat: ${statusMap[order.status] ?? order.status}`;

    await this.reply(chatId, text);
  }

  // ─── Daily cron: 20:00 UZT ───────────────────────────────────────

  private async checkDailySummary() {
    try {
      // UZT = UTC+5
      const now = new Date();
      const uztHour = (now.getUTCHours() + 5) % 24;
      const uztMin = now.getUTCMinutes();
      const today = now.toISOString().slice(0, 10);

      if (uztHour === 20 && uztMin < 5 && this.lastDailySummaryDate !== today) {
        this.lastDailySummaryDate = today;
        await this.sendDailySummary();
      }
    } catch (e) {
      this.logger.error('checkDailySummary error', e);
    }
  }

  private async sendDailySummary() {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    // UZT midnight = UTC 19:00 prev day
    const uztMidnight = new Date(todayStart.getTime() - 5 * 60 * 60 * 1000);

    const orders = await this.prisma.order.findMany({
      where: {
        createdt: { gte: uztMidnight },
        work_status: 'WORKING',
      },
      include: { shop: { select: { name: true } } },
    });

    if (orders.length === 0) return;

    const total = orders.reduce((s, o) => s + (o.amount ?? 0), 0);
    const statusMap: Record<string, string> = {
      STARTED: '🟡 Yangi',
      FINISHED: '🔵 Tasdiqlandi',
      CONFIRMED: '✅ Yetkazildi',
      CANCELED: '❌ Bekor',
    };

    const byStatus: Record<string, number> = {};
    for (const o of orders) {
      byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
    }

    const statusLines = Object.entries(byStatus)
      .map(([s, c]) => `${statusMap[s] ?? s}: ${c} ta`)
      .join('\n');

    const msg =
      `📊 <b>Kunlik hisobot</b>\n` +
      `📅 ${new Date().toLocaleDateString('uz-UZ', { timeZone: 'Asia/Tashkent' })}\n\n` +
      `📦 Jami buyurtmalar: <b>${orders.length} ta</b>\n` +
      `💰 Jami summa: <b>${total.toLocaleString()} so'm</b>\n\n` +
      `${statusLines}`;

    await this.send(msg);
  }

  // ─── Public methods ───────────────────────────────────────────────

  async notifyNewOrder(order: any) {
    if (!this.isEnabled()) return;

    const products =
      order.products
        ?.map((p: any) => {
          const name =
            p.product_name ??
            p.shop_product?.product_item?.product?.name ??
            '—';
          const item =
            p.variant_name ?? p.shop_product?.product_item?.name ?? '';
          return `  • ${name} (${item}) x${p.count} — ${(p.amount ?? 0).toLocaleString()} so'm`;
        })
        .join('\n') ?? '';

    const discount = order.discount_amount
      ? `\n🏷 Chegirma: -${order.discount_amount.toLocaleString()} so'm (${order.discount_percent}%)`
      : '';

    const sourceLabel: Record<string, string> = {
      MOBILE: '📱 Mobil ilova',
      SITE: '🌐 Sayt',
      STORE_BOT: '🤖 Telegram bot',
    };
    const source = sourceLabel[order.source ?? ''] ?? order.source ?? '—';

    const msg =
      `🛍 <b>Yangi buyurtma #${order.id}</b>\n\n` +
      `🏪 Do'kon: ${order.shop?.name ?? '—'}\n` +
      `📡 Manba: ${source}\n` +
      `📍 Manzil: ${order.address ?? '—'}\n` +
      `💳 To'lov: ${this.payLabel(order.payment_type)}\n` +
      `🚚 Yetkazish: ${this.deliveryLabel(order.delivery_type)}\n\n` +
      `📦 Mahsulotlar:\n${products}` +
      `${discount}\n\n` +
      `💰 <b>Jami: ${(order.amount ?? 0).toLocaleString()} so'm</b>`;

    await this.send(msg);
    const lat = order.shop?.lat;
    const lon = order.shop?.lon;
    if (lat && lon) {
      await Promise.allSettled(
        this.chatIds.map((id) =>
          axios
            .post(
              `https://api.telegram.org/bot${this.token}/sendLocation`,
              { chat_id: id, latitude: lat, longitude: lon },
              { timeout: 8000 },
            )
            .catch((e: any) =>
              this.logger.error(
                `Location send error (chat ${id}): ${e?.message}`,
              ),
            ),
        ),
      );
    }
  }

  async notifyOrderFinished(orderId: number) {
    if (!this.isEnabled()) return;
    await this.send(
      `🔵 <b>Buyurtma #${orderId} tasdiqlandi</b>\n` +
        `Do'kon tasdiqladi — yetkazishga tayyor ✅`,
    );
  }

  async notifyOrderConfirmed(orderId: number) {
    if (!this.isEnabled()) return;
    await this.send(
      `✅ <b>Buyurtma #${orderId} yetkazildi!</b>\n` +
        `Mijoz mahsulotlarni qabul qildi 🎉`,
    );
  }

  async notifyOrderCanceled(orderId: number, reason?: string) {
    if (!this.isEnabled()) return;
    await this.send(
      `❌ <b>Buyurtma #${orderId} bekor qilindi</b>` +
        (reason ? `\nSabab: ${reason}` : ''),
    );
  }

  // ─── Helpers ──────────────────────────────────────────────────────

  private isEnabled() {
    return !!(this.token && this.chatIds.length > 0);
  }

  /** Reply to a specific chat (used by command handlers) */
  private async reply(chatId: number, text: string) {
    try {
      await axios.post(
        `https://api.telegram.org/bot${this.token}/sendMessage`,
        { chat_id: chatId, text, parse_mode: 'HTML' },
        { timeout: 8000 },
      );
    } catch (e: any) {
      this.logger.error(`Telegram reply error: ${e?.message}`);
    }
  }

  private payLabel(type?: string | null) {
    const map: Record<string, string> = {
      cash: '💵 Naqd',
      payme: '💙 Payme',
      click: '🟠 Click',
      uzum: '🟣 Uzum',
    };
    return map[type ?? ''] ?? type ?? '—';
  }

  private deliveryLabel(type?: string | null) {
    const map: Record<string, string> = {
      MARKET: '🛒 Market yetkazma',
      YANDEX: '🚕 Yandex Deliver',
      FIXED: '📦 Belgilangan narx',
    };
    return map[type ?? ''] ?? type ?? '—';
  }

  private async send(text: string) {
    // Send to all registered admin chat IDs in parallel
    await Promise.allSettled(
      this.chatIds.map((id) =>
        axios
          .post(
            `https://api.telegram.org/bot${this.token}/sendMessage`,
            { chat_id: id, text, parse_mode: 'HTML' },
            { timeout: 8000 },
          )
          .catch((e: any) =>
            this.logger.error(
              `Telegram send error (chat ${id}): ${e?.message}`,
            ),
          ),
      ),
    );
  }

  // ─── Report helpers ───────────────────────────────────────────────

  private async fetchOrders(from: Date, to: Date) {
    return this.prisma.order.findMany({
      where: { createdt: { gte: from, lt: to } },
      include: { shop: { select: { name: true } } },
      orderBy: { createdt: 'asc' },
    });
  }

  private async sendStatReport(
    chatId: number,
    from: Date,
    to: Date,
    label: string,
  ) {
    const orders = await this.fetchOrders(from, to);
    if (orders.length === 0) {
      return this.reply(chatId, `📊 <b>${label}</b>\n\nBuyurtma topilmadi.`);
    }
    const total = orders.reduce((s, o) => s + (o.amount ?? 0), 0);
    const byStatus: Record<string, number> = {};
    const byShop: Record<string, { count: number; sum: number }> = {};
    for (const o of orders) {
      byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
      const sn = (o as any).shop?.name ?? "Noma'lum";
      if (!byShop[sn]) byShop[sn] = { count: 0, sum: 0 };
      byShop[sn].count++;
      byShop[sn].sum += o.amount ?? 0;
    }
    const em: Record<string, string> = {
      STARTED: '🟡',
      FINISHED: '🔵',
      CONFIRMED: '✅',
      CANCELED: '❌',
    };
    const statusLines = Object.entries(byStatus)
      .map(([s, c]) => `  ${em[s] ?? '•'} ${s}: ${c} ta`)
      .join('\n');
    const shopLines = Object.entries(byShop)
      .sort((a, b) => b[1].sum - a[1].sum)
      .slice(0, 10)
      .map(
        ([n, v]) => `  🏪 ${n}: ${v.count} ta — ${v.sum.toLocaleString()} so'm`,
      )
      .join('\n');
    await this.reply(
      chatId,
      `📊 <b>${label} hisoboti</b>\n\n` +
        `📦 Jami: <b>${orders.length} ta</b>\n` +
        `💰 Summa: <b>${total.toLocaleString()} so'm</b>\n\n` +
        `<b>Holat:</b>\n${statusLines}\n\n` +
        `<b>Do'konlar (top 10):</b>\n${shopLines}`,
    );
  }

  private async sendExcel(
    chatId: number,
    from: Date,
    to: Date,
    filename: string,
  ) {
    await this.reply(chatId, '⏳ Excel tayyorlanmoqda...');
    try {
      const orders = await this.fetchOrders(from, to);
      const buffer = await this.buildExcel(orders);
      // form-data is a transitive dep of axios — always present
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const FormData = require('form-data');
      const fd = new FormData();
      fd.append('chat_id', String(chatId));
      fd.append('document', buffer, {
        filename: `${filename}.xlsx`,
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      fd.append(
        'caption',
        `📥 ${filename}.xlsx — ${orders.length} ta buyurtma`,
      );
      await axios.post(
        `https://api.telegram.org/bot${this.token}/sendDocument`,
        fd,
        { headers: fd.getHeaders(), timeout: 30_000 },
      );
    } catch (e: any) {
      this.logger.error(`sendExcel error: ${e?.message}`);
      await this.reply(chatId, '❌ Excel yaratishda xatolik yuz berdi.');
    }
  }

  private async buildExcel(orders: any[]): Promise<Buffer> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ExcelJS = require('exceljs');
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Diametr Bot';

    // ── Sheet 1: Buyurtmalar ─────────────────────────────────────────
    const ws = wb.addWorksheet('Buyurtmalar');
    ws.columns = [
      { header: '№', key: 'id', width: 8 },
      { header: 'Sana', key: 'date', width: 18 },
      { header: "Do'kon", key: 'shop', width: 22 },
      { header: 'Holat', key: 'status', width: 14 },
      { header: 'Manzil', key: 'address', width: 30 },
      { header: "To'lov", key: 'payment', width: 12 },
      { header: 'Yetkazish', key: 'delivery', width: 14 },
      { header: 'Chegirma', key: 'discount', width: 14 },
      { header: "Summa (so'm)", key: 'amount', width: 16 },
    ];
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A5F' },
    };

    const sLabel: Record<string, string> = {
      STARTED: 'Yangi',
      FINISHED: 'Tasdiqlandi',
      CONFIRMED: 'Yetkazildi',
      CANCELED: 'Bekor',
    };
    const sColor: Record<string, string> = {
      STARTED: 'FFFFF9C4',
      FINISHED: 'FFBBDEFB',
      CONFIRMED: 'FFC8E6C9',
      CANCELED: 'FFFFCDD2',
    };
    for (const o of orders) {
      const row = ws.addRow({
        id: o.id,
        date: new Date(o.createdt.getTime() + 5 * 3600_000)
          .toISOString()
          .replace('T', ' ')
          .slice(0, 16),
        shop: (o as any).shop?.name ?? '—',
        status: sLabel[o.status] ?? o.status,
        address: o.address ?? '—',
        payment: o.payment_type ?? '—',
        delivery: o.delivery_type ?? '—',
        discount: o.discount_amount ?? 0,
        amount: o.amount ?? 0,
      });
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: sColor[o.status] ?? 'FFFFFFFF' },
      };
    }
    ws.getColumn('amount').numFmt = '#,##0';
    ws.getColumn('discount').numFmt = '#,##0';

    // ── Sheet 2: Xulosa ──────────────────────────────────────────────
    const ws2 = wb.addWorksheet('Xulosa');
    const total = orders.reduce((s, o) => s + (o.amount ?? 0), 0);
    const active = orders.filter((o) => o.status !== 'CANCELED');
    const rows: [string, number | string][] = [
      ["Ko'rsatkich", 'Qiymat'],
      ['Jami buyurtmalar', orders.length],
      ['Faol (bekordan tashqari)', active.length],
      ['Yangi (STARTED)', orders.filter((o) => o.status === 'STARTED').length],
      [
        'Tasdiqlangan (FINISHED)',
        orders.filter((o) => o.status === 'FINISHED').length,
      ],
      [
        'Yetkazilgan (CONFIRMED)',
        orders.filter((o) => o.status === 'CONFIRMED').length,
      ],
      [
        'Bekor (CANCELED)',
        orders.filter((o) => o.status === 'CANCELED').length,
      ],
      ['', ''],
      ["Jami summa (so'm)", total],
      [
        "O'rtacha (so'm)",
        active.length ? Math.round(total / active.length) : 0,
      ],
    ];
    rows.forEach((row, i) => {
      const r = ws2.addRow(row);
      if (i === 0) {
        r.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        r.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1E3A5F' },
        };
      }
      if (typeof row[1] === 'number' && i > 7) {
        ws2.getCell(`B${i + 1}`).numFmt = '#,##0';
      }
    });
    ws2.getColumn('A').width = 32;
    ws2.getColumn('B').width = 18;

    return Buffer.from(await wb.xlsx.writeBuffer());
  }
}
