import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';
import { SmsService } from 'src/sms/sms.service';
import { JwtService } from '@nestjs/jwt';

// ─── Types ────────────────────────────────────────────────────────────────────

type CartItem = {
  shop_product_id: number;
  name: string; // display name
  price: number; // price per unit
  count: number; // quantity in cart
  shop_id: number;
  shop_name: string;
};

type CheckoutCtx = {
  delivery_type?: 'MARKET' | 'YANDEX';
  payment_type?: string;
  address?: string;
  lat?: number;
  lon?: number;
};

// ─── Color name mapping ───────────────────────────────────────────────────────

const COLOR_NAMES: Record<string, string> = {
  '#EF4444': 'Qizil',
  '#DC2626': "To'q qizil",
  '#F87171': 'Och qizil',
  '#B91C1C': 'Bordo',
  '#FCA5A5': 'Pushti-qizil',
  '#EC4899': 'Pushti',
  '#F472B6': 'Och pushti',
  '#BE185D': "To'q pushti",
  '#F97316': "Zarg'aldoq",
  '#FB923C': "Och zarg'aldoq",
  '#EA580C': "To'q zarg'aldoq",
  '#EAB308': 'Sariq',
  '#FACC15': 'Limon',
  '#CA8A04': "To'q sariq",
  '#FDE047': 'Och sariq',
  '#F59E0B': 'Oltin rang',
  '#22C55E': 'Yashil',
  '#16A34A': "To'q yashil",
  '#4ADE80': 'Och yashil',
  '#15803D': "O'rmon rang",
  '#84CC16': 'Sabzi rang',
  '#A3E635': 'Limetka',
  '#06B6D4': 'Moviy',
  '#22D3EE': 'Och moviy',
  '#0891B2': "To'q moviy",
  '#3B82F6': "Ko'k",
  '#60A5FA': "Och ko'k",
  '#2563EB': "To'q ko'k",
  '#1D4ED8': "Quyuq ko'k",
  '#93C5FD': 'Osmon rang',
  '#1E40AF': 'Nil rang',
  '#6366F1': 'Indigo',
  '#818CF8': 'Och indigo',
  '#8B5CF6': 'Binafsha',
  '#A78BFA': 'Och binafsha',
  '#7C3AED': "To'q binafsha",
  '#C084FC': 'Lavanda',
  '#92400E': 'Jigarrang',
  '#B45309': "Qarag'ay",
  '#78350F': "To'q jigarrang",
  '#D97706': 'Bronza',
  '#6B7280': 'Kulrang',
  '#9CA3AF': 'Och kulrang',
  '#374151': "To'q kulrang",
  '#D1D5DB': 'Kumush',
  '#FFFFFF': 'Oq',
  '#F8FAFC': 'Oqish',
  '#0F172A': 'Qora',
  '#1E293B': 'Qoramtir',
  '#334155': 'Grafitli',
  '#64748B': "Ko'kish kulrang",
};

function colorLabel(hex: string | null | undefined): string {
  if (!hex) return '';
  const upper = hex.toUpperCase();
  return COLOR_NAMES[upper] || hex;
}

// ─── Bot commands ─────────────────────────────────────────────────────────────

const STORE_BOT_COMMANDS = [
  {
    command: 'start',
    description: "🏠 Botni ishga tushirish — Do'konga kirish",
  },
  {
    command: 'orders',
    description: '📦 Mening buyurtmalarim — Barchasi sahifali',
  },
  { command: 'cart', description: "🛒 Savat — Tanlangan tovarlar ro'yxati" },
  {
    command: 'nearby',
    description: "📍 Yaqin atrofdagi do'konlar — GPS orqali",
  },
  {
    command: 'search',
    description: "🔍 Qidirish — tovar nomlari va do'konlar",
  },
  { command: 'language', description: "🌐 Tilni o'zgartirish — uz / ru" },
  { command: 'login', description: '🔑 Tizimga kirish yoki qayta kirish' },
  { command: 'help', description: "❓ Barcha komandalar ro'yxati" },
];

const STORE_BOT_COMMANDS_RU = [
  { command: 'start', description: '🏠 Запустить бота — Перейти в магазин' },
  { command: 'orders', description: '📦 Мои заказы — Со страницами' },
  { command: 'cart', description: '🛒 Корзина — Список выбранных товаров' },
  { command: 'nearby', description: '📍 Ближайшие магазины — Через GPS' },
  { command: 'search', description: '🔍 Поиск — товары и магазины с ценами' },
  { command: 'language', description: '🌐 Сменить язык — uz / ru' },
  { command: 'login', description: '🔑 Войти или перевойти вход' },
  { command: 'help', description: '❓ Список всех команд' },
];

@Injectable()
export class StoreTelegramService implements OnModuleInit {
  private readonly logger = new Logger(StoreTelegramService.name);
  private readonly token = process.env.STORE_BOT_TOKEN ?? '';
  private readonly webhookBase = (
    process.env.STORE_BOT_WEBHOOK_URL ?? ''
  ).replace(/\/$/, '');
  private readonly storeUrl = 'https://diametr.uz/store';
  private readonly ORDERS_PER_PAGE = 3;
  private readonly SEARCH_PER_PAGE = 3;
  private readonly ITEMS_PER_PHOTO_PAGE = 6;
  private readonly IMG_BASE = 'https://diametr.uz';

  constructor(
    private readonly prisma: PrismaClientService,
    private readonly smsService: SmsService,
    private readonly jwtService: JwtService,
  ) {}

  // ─── Init ──────────────────────────────────────────────────────────────────

  async onModuleInit() {
    if (!this.token) {
      this.logger.warn("STORE_BOT_TOKEN topilmadi — store bot o'chirilgan");
      return;
    }
    await this.registerCommands();
    if (this.webhookBase) {
      await this.setWebhook(`${this.webhookBase}/api/v1/store/webhook`);
    } else {
      this.logger.log(
        "STORE_BOT_WEBHOOK_URL yo'q — long polling rejimida ishga tushmoqda...",
      );
      await this.deleteWebhook();
      this.startPolling();
    }
    this.logger.log('Store bot ishga tushdi ✅');
  }

  private async setWebhook(url: string) {
    try {
      await axios.post(
        `https://api.telegram.org/bot${this.token}/setWebhook`,
        { url, drop_pending_updates: true },
        { timeout: 8000 },
      );
      this.logger.log(`Store bot webhook set: ${url} ✅`);
    } catch (e: any) {
      this.logger.error(`setWebhook error: ${e?.message}`);
    }
  }

  private async deleteWebhook() {
    try {
      await axios.post(
        `https://api.telegram.org/bot${this.token}/deleteWebhook`,
        { drop_pending_updates: true },
        { timeout: 8000 },
      );
    } catch {
      /* ignore */
    }
  }

  /** Long-polling loop — runs when STORE_BOT_WEBHOOK_URL is not set */
  private startPolling() {
    let offset = 0;
    const poll = async () => {
      while (true) {
        try {
          const { data } = await axios.get(
            `https://api.telegram.org/bot${this.token}/getUpdates`,
            { params: { offset, limit: 100, timeout: 25 }, timeout: 30000 },
          );
          for (const update of data.result ?? []) {
            offset = update.update_id + 1;
            this.handleUpdate(update).catch((e: any) =>
              this.logger.error(`poll handleUpdate: ${e?.message}`),
            );
          }
        } catch (e: any) {
          this.logger.error(`polling error: ${e?.message}`);
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
    };
    poll();
  }

  private async registerCommands() {
    try {
      const url = `https://api.telegram.org/bot${this.token}/setMyCommands`;
      await axios.post(
        url,
        { commands: STORE_BOT_COMMANDS },
        { timeout: 8000 },
      );
      await axios.post(
        url,
        { commands: STORE_BOT_COMMANDS, language_code: 'uz' },
        { timeout: 8000 },
      );
      await axios.post(
        url,
        { commands: STORE_BOT_COMMANDS_RU, language_code: 'ru' },
        { timeout: 8000 },
      );
      this.logger.log('Store bot commands registered (uz + ru) ✅');
    } catch (e: any) {
      this.logger.error(`registerCommands error: ${e?.message}`);
    }
  }

  // ─── Update router ─────────────────────────────────────────────────────────

  async handleUpdate(update: any) {
    if (update?.callback_query) {
      await this.handleCallback(update.callback_query);
      return;
    }

    const message = update?.message ?? update?.edited_message;
    if (!message) return;

    const chatId = String(message.chat?.id);
    if (!chatId) return;

    if (message.contact) {
      await this.handleContact(chatId, message.contact);
      return;
    }

    if (message.location) {
      const session = await this.getSession(chatId);
      const chk: CheckoutCtx = JSON.parse(session?.chk ?? '{}');
      const isCheckoutLoc =
        session?.state === 'waiting_checkout_address' ||
        (chk.delivery_type === 'YANDEX' && !chk.address && !chk.payment_type);
      if (isCheckoutLoc) {
        await this.handleCheckoutLocationAddress(chatId, message.location);
      } else {
        await this.handleLocation(chatId, message.location);
      }
      return;
    }

    const text: string = (message.text ?? '').trim();

    if (text && !text.startsWith('/')) {
      const session = await this.getSession(chatId);
      if (session?.state === 'waiting_code') {
        await this.handleSmsCode(chatId, text);
        return;
      }
      if (session?.state === 'waiting_search_shop') {
        await this.clearState(chatId);
        await this.cmdSearchShops(chatId, text.trim(), 0, 'd');
        return;
      }
      if (session?.state === 'waiting_search_product') {
        await this.clearState(chatId);
        await this.cmdSearchProducts(chatId, text.trim(), 0);
        return;
      }
      if (session?.state === 'waiting_checkout_address') {
        await this.handleCheckoutAddress(chatId, text.trim());
        return;
      }
    }

    if (text.startsWith('/')) {
      const cmd = text.split(' ')[0].split('@')[0].toLowerCase();
      await this.handleCommand(cmd, chatId);
    }
  }

  private async handleCommand(cmd: string, chatId: string) {
    switch (cmd) {
      case '/start':
      case '/login':
        return this.cmdStart(chatId);
      case '/orders':
        return this.cmdOrders(chatId, 0);
      case '/cart':
        return this.cmdCart(chatId);
      case '/nearby':
        return this.cmdNearby(chatId);
      case '/search':
        return this.cmdSearchHint(chatId);
      case '/language':
        return this.cmdLanguage(chatId);
      case '/help':
        return this.cmdHelp(chatId);
    }
  }

  // ─── /start ────────────────────────────────────────────────────────────────

  private async cmdStart(chatId: string) {
    const user = await this.prisma.user.findFirst({
      where: { chat_id: chatId },
    });
    if (user) {
      const lang = user.lang ?? 'uz';
      const token = await this.generateToken(user);
      const url = `${this.storeUrl}?token=${token}`;
      const text =
        lang === 'ru'
          ? `👋 <b>Добро пожаловать, ${user.fullname ?? user.phone}!</b>\n\n🛒 Нажмите кнопку ниже, чтобы открыть магазин.`
          : `👋 <b>Xush kelibsiz, ${user.fullname ?? user.phone}!</b>\n\n🛒 Quyidagi tugmani bosib do'konga o'ting.`;
      await this.sendMessage(chatId, text, {
        inline_keyboard: [[{ text: "🛒 Do'konga o'tish", web_app: { url } }]],
      });
    } else {
      const text =
        `👋 <b>Diametr Store botiga xush kelibsiz!</b>\n\n` +
        `🔑 Davom etish uchun telefon raqamingizni ulashing.\n\n` +
        `📱 Quyidagi tugmani bosing:`;
      await this.sendMessage(chatId, text, {
        keyboard: [
          [{ text: '📱 Telefon raqamni ulashish', request_contact: true }],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      });
    }
  }

  // ─── /orders ───────────────────────────────────────────────────────────────

  private async cmdOrders(chatId: string, page = 0) {
    const user = await this.prisma.user.findFirst({
      where: { chat_id: chatId },
    });
    const lang = user?.lang ?? 'uz';
    if (!user) {
      return this.reply(
        chatId,
        lang === 'ru'
          ? '🔑 Вы не вошли в систему. Используйте /login.'
          : '🔑 Siz tizimga kirmagansiz. Kirish uchun /login.',
      );
    }
    const total = await this.prisma.order.count({
      where: { user_id: user.id },
    });
    if (total === 0) {
      return this.reply(
        chatId,
        lang === 'ru'
          ? '📭 У вас пока нет заказов.'
          : "📭 Hali buyurtmalaringiz yo'q.",
      );
    }
    const totalPages = Math.ceil(total / this.ORDERS_PER_PAGE);
    const safePage = Math.max(0, Math.min(page, totalPages - 1));
    const orders = await this.prisma.order.findMany({
      where: { user_id: user.id },
      skip: safePage * this.ORDERS_PER_PAGE,
      take: this.ORDERS_PER_PAGE,
      orderBy: { createdt: 'desc' },
      include: { shop: { select: { name: true } } },
    });
    const { text, keyboard } = this.buildOrdersPage(
      orders,
      lang,
      safePage,
      totalPages,
      total,
    );
    await this.sendMessage(chatId, text, { inline_keyboard: keyboard });
  }

  private buildOrdersPage(
    orders: any[],
    lang: string,
    page: number,
    totalPages: number,
    total: number,
  ) {
    const statusEmoji: Record<string, string> = {
      STARTED: '⏳',
      FINISHED: '🏁',
      CONFIRMED: '✅',
      CANCELED: '❌',
    };
    const statusLabel: Record<string, Record<string, string>> = {
      STARTED: { uz: 'Jarayonda', ru: 'В процессе' },
      FINISHED: { uz: 'Yetkazildi', ru: 'Доставлен' },
      CONFIRMED: { uz: 'Tasdiqlandi', ru: 'Подтверждён' },
      CANCELED: { uz: 'Bekor qilindi', ru: 'Отменён' },
    };
    const nums = ['1️⃣', '2️⃣', '3️⃣'];
    const div = '─────────────────────';
    const header =
      lang === 'ru'
        ? `📦 <b>Мои заказы</b>  ·  Всего: ${total}`
        : `📦 <b>Buyurtmalarim</b>  ·  Jami: ${total} ta`;
    const lines = orders.map((o, i) => {
      const num = nums[i] ?? `${page * this.ORDERS_PER_PAGE + i + 1}.`;
      const emoji = statusEmoji[o.status] ?? '⚪';
      const sl = statusLabel[o.status]?.[lang] ?? o.status;
      const shop = o.shop?.name ?? '—';
      const amount = (o.amount ?? 0).toLocaleString('ru-RU');
      const d = new Date(o.createdt);
      const date = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
      return `${num} <b>#${o.id}</b>  ·  ${shop}\n    ${emoji} ${sl}\n    💰 ${amount} so'm   ·   📅 ${date}`;
    });
    const pageInfo =
      lang === 'ru'
        ? `📄 Страница ${page + 1} / ${totalPages}`
        : `📄 Sahifa ${page + 1} / ${totalPages}`;
    const text = `${header}\n${div}\n\n${lines.join('\n\n')}\n\n${div}\n${pageInfo}`;
    const pageRow = this.buildPageRow(totalPages, page, (p) => `orders_${p}`);
    return { text, keyboard: pageRow.length ? [pageRow] : [] };
  }

  // ─── /cart ─────────────────────────────────────────────────────────────────

  private async cmdCart(chatId: string, msgId?: number) {
    const [user, session] = await Promise.all([
      this.prisma.user.findFirst({ where: { chat_id: chatId } }),
      this.getSession(chatId),
    ]);
    const lang = user?.lang ?? 'uz';
    const cart = this.parseCart(session?.cart);

    if (cart.length === 0) {
      const text =
        lang === 'ru'
          ? '🛒 Ваша корзина пуста.\n\nИспользуйте /search для поиска товаров.'
          : "🛒 Savatingiz bo'sh.\n\n/search orqali tovar qidiring.";
      if (msgId)
        return this.editMessage(chatId, msgId, text, { inline_keyboard: [] });
      return this.reply(chatId, text);
    }

    const shopName = cart[0].shop_name;
    const total = cart.reduce((s, i) => s + i.price * i.count, 0);
    const totalQty = cart.reduce((s, i) => s + i.count, 0);
    const nums = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    const div = '━━━━━━━━━━━━━━━━━━━━━';

    const header =
      lang === 'ru'
        ? `🛒 <b>Корзина</b>  ·  ${shopName}`
        : `🛒 <b>Savat</b>  ·  ${shopName}`;
    const lines = cart.map((item, i) => {
      const amt = (item.price * item.count).toLocaleString('ru-RU');
      const pr = item.price.toLocaleString('ru-RU');
      return `${nums[i] ?? `${i + 1}.`}  <b>${item.name}</b>\n    💰 ${pr} × ${item.count} = ${amt} so'm`;
    });
    const footer =
      lang === 'ru'
        ? `📦 ${totalQty} шт.  ·  💰 Итого: <b>${total.toLocaleString('ru-RU')} сум</b>`
        : `📦 ${totalQty} ta  ·  💰 Jami: <b>${total.toLocaleString('ru-RU')} so'm</b>`;
    const text = `${header}\n${div}\n\n${lines.join('\n\n')}\n\n${div}\n${footer}`;

    // Per-item quantity control rows
    const qtyRows = cart.map((item) => [
      { text: '➖', callback_data: `dec:${item.shop_product_id}` },
      {
        text: `${item.name.substring(0, 16)}  (${item.count} ta)`,
        callback_data: 'noop',
      },
      { text: '➕', callback_data: `inc:${item.shop_product_id}` },
    ]);
    const clearRow = [
      {
        text: lang === 'ru' ? '🗑 Очистить корзину' : '🗑 Savatni tozalash',
        callback_data: 'clrcart',
      },
    ];
    const checkoutRow = [
      {
        text: lang === 'ru' ? '✅ Оформить заказ' : '✅ Buyurtma berish',
        callback_data: 'checkout',
      },
    ];
    const keyboard = [...qtyRows, clearRow, checkoutRow];

    if (msgId)
      return this.editMessage(chatId, msgId, text, {
        inline_keyboard: keyboard,
      });
    return this.sendMessage(chatId, text, { inline_keyboard: keyboard });
  }

  // ─── /nearby ───────────────────────────────────────────────────────────────

  private async cmdNearby(chatId: string) {
    const user = await this.prisma.user.findFirst({
      where: { chat_id: chatId },
    });
    const lang = user?.lang ?? 'uz';
    const text =
      lang === 'ru'
        ? '📍 <b>Поделитесь местоположением</b>, чтобы найти ближайшие магазины:'
        : "📍 <b>Joylashuvingizni ulashing</b>, yaqin do'konlarni topish uchun:";
    await this.sendMessage(chatId, text, {
      keyboard: [
        [
          {
            text: `📍 ${lang === 'ru' ? 'Отправить геолокацию' : 'Joylashuvni yuborish'}`,
            request_location: true,
          },
        ],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    });
  }

  private async handleLocation(
    chatId: string,
    location: { latitude: number; longitude: number },
  ) {
    const user = await this.prisma.user.findFirst({
      where: { chat_id: chatId },
    });
    const lang = user?.lang ?? 'uz';
    await this.upsertSession(chatId, {
      lat: location.latitude,
      lon: location.longitude,
      shop_q: null,
    });
    const loadingText =
      lang === 'ru'
        ? '⏳ Ищу ближайшие магазины...'
        : "⏳ Yaqin do'konlar qidirilmoqda...";
    await this.sendMessage(chatId, loadingText, { remove_keyboard: true });
    const { text, keyboard } = await this.buildNearbyContent(
      location.latitude,
      location.longitude,
      0,
      'd',
      lang,
    );
    await this.sendMessage(chatId, text, { inline_keyboard: keyboard });
  }

  private async buildNearbyContent(
    lat: number,
    lon: number,
    page: number,
    sort: string,
    lang: string,
  ): Promise<{ text: string; keyboard: any[][] }> {
    const allShops = await this.prisma.shop.findMany({
      where: { work_status: 'WORKING', lat: { not: null }, lon: { not: null } },
      select: {
        id: true,
        name: true,
        address: true,
        lat: true,
        lon: true,
        _count: {
          select: {
            products: { where: { work_status: 'WORKING', count: { gt: 0 } } },
          },
        },
      },
    });

    const withDist = allShops.map((s) => ({
      ...s,
      _count: s._count,
      dist: this.haversine(lat, lon, s.lat!, s.lon!),
    }));
    if (sort === 'n')
      withDist.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    else if (sort === 'c')
      withDist.sort((a, b) => b._count.products - a._count.products);
    else withDist.sort((a, b) => a.dist - b.dist);

    const total = withDist.length;
    if (total === 0) {
      return {
        text:
          lang === 'ru'
            ? '😔 Рядом нет работающих магазинов.'
            : "😔 Yaqin atrofda do'kon topilmadi.",
        keyboard: [],
      };
    }

    const totalPages = Math.ceil(total / this.SEARCH_PER_PAGE);
    const safePage = Math.max(0, Math.min(page, totalPages - 1));
    const slice = withDist.slice(
      safePage * this.SEARCH_PER_PAGE,
      (safePage + 1) * this.SEARCH_PER_PAGE,
    );
    const nums = ['1️⃣', '2️⃣', '3️⃣'];
    const div = '━━━━━━━━━━━━━━━━━━━━━';
    const sortLabels: Record<string, Record<string, string>> = {
      d: { uz: '📏 Masofa', ru: '📏 Расстояние' },
      n: { uz: '🔤 Nom', ru: '🔤 Название' },
      c: { uz: '📦 Tovar', ru: '📦 Товаров' },
    };
    const header =
      lang === 'ru'
        ? `📍 <b>Ближайшие магазины</b>  ·  ${total} шт.`
        : `📍 <b>Yaqin do'konlar</b>  ·  ${total} ta`;

    const lines = slice.map((s, i) => {
      const d =
        s.dist < 1
          ? `${Math.round(s.dist * 1000)} m`
          : `${s.dist.toFixed(1)} km`;
      const prodCnt = s._count.products;
      return (
        `${nums[i] ?? `${safePage * this.SEARCH_PER_PAGE + i + 1}.`} <b>${s.name ?? '—'}</b>\n` +
        `    📍 ${s.address ?? '—'}   ·   🚩 ${d} ${lang === 'ru' ? 'от вас' : 'uzoqda'}\n` +
        `    📦 ${prodCnt} ${lang === 'ru' ? 'тов.' : 'tovar'}`
      );
    });

    const pageInfo =
      lang === 'ru'
        ? `📄 Стр. ${safePage + 1} / ${totalPages}`
        : `📄 ${safePage + 1} / ${totalPages} sahifa`;
    const text = `${header}\n${div}\n\n${lines.join('\n\n')}\n\n${div}\n${pageInfo}`;

    const shopRows = slice.map((s) => [
      {
        text: `🛍 ${(s.name ?? '').substring(0, 28)}`,
        callback_data: `sp:${s.id}:0`,
      },
    ]);
    const sortRow = (['d', 'n', 'c'] as const).map((k) => ({
      text:
        (sort === k ? '·' : '') + sortLabels[k][lang] + (sort === k ? '·' : ''),
      callback_data: `nb:0:${k}`,
    }));
    const pageRow = this.buildPageRow(
      totalPages,
      safePage,
      (p) => `nb:${p}:${sort}`,
    );
    const keyboard: any[][] = [...shopRows, sortRow];
    if (pageRow.length) keyboard.push(pageRow);
    return { text, keyboard };
  }

  // ─── /search ───────────────────────────────────────────────────────────────

  private async cmdSearchHint(chatId: string) {
    await this.cmdShowCategories(chatId, 0);
  }

  // ─── Category catalog browser ──────────────────────────────────────────────

  private async cmdShowCategories(
    chatId: string,
    page: number,
    msgId?: number,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { chat_id: chatId },
    });
    const lang = user?.lang ?? 'uz';

    const cats = await this.prisma.category.findMany({
      where: {
        work_status: 'WORKING',
        products: {
          some: {
            items: {
              some: {
                work_status: 'WORKING',
                shop_products: {
                  some: { work_status: 'WORKING', count: { gt: 0 } },
                },
              },
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        name_uz: true,
        name_ru: true,
        image: true,
        _count: { select: { products: { where: { work_status: 'WORKING' } } } },
      },
      orderBy: { name: 'asc' },
    });

    if (cats.length === 0) {
      const no =
        lang === 'ru'
          ? '📂 Категории не найдены.'
          : '📂 Kategoriyalar topilmadi.';
      if (msgId)
        return this.editMessage(chatId, msgId, no, { inline_keyboard: [] });
      return this.reply(chatId, no);
    }

    const PER = this.ITEMS_PER_PHOTO_PAGE;
    const total = cats.length;
    const totalPages = Math.ceil(total / PER);
    const safePage = Math.max(0, Math.min(page, totalPages - 1));
    const slice = cats.slice(safePage * PER, (safePage + 1) * PER);
    const nums = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];
    const div = '━━━━━━━━━━━━━━━━━━━━━';

    const header =
      lang === 'ru'
        ? `📂 <b>Каталог</b>  ·  ${total} категорий`
        : `📂 <b>Katalog</b>  ·  ${total} ta kategoriya`;

    const lines = slice.map((cat, i) => {
      const catName =
        (lang === 'ru'
          ? (cat.name_ru ?? cat.name)
          : (cat.name_uz ?? cat.name)) ?? '—';
      const cnt = cat._count?.products ?? 0;
      return `${nums[i] ?? `${safePage * PER + i + 1}.`}  <b>${catName}</b>  ·  📦 ${cnt} ${lang === 'ru' ? 'тов.' : 'tovar'}`;
    });

    const pageInfo =
      lang === 'ru'
        ? `📄 стр. ${safePage + 1} / ${totalPages}`
        : `📄 ${safePage + 1} / ${totalPages} sahifa`;
    const text = `${header}\n${div}\n\n${lines.join('\n')}\n\n${div}\n${pageInfo}`;

    const catBtns = slice.map((cat) => {
      const catName =
        (lang === 'ru'
          ? (cat.name_ru ?? cat.name)
          : (cat.name_uz ?? cat.name)) ?? '—';
      return [{ text: `🛍 ${catName}`, callback_data: `catsel:${cat.id}:0` }];
    });
    const pageRow = this.buildPageRow(totalPages, safePage, (p) => `cat:${p}`);
    const keyboard: any[][] = [...catBtns];
    if (pageRow.length) keyboard.push(pageRow);
    keyboard.push([
      {
        text:
          lang === 'ru' ? '🔍 Поиск по названию' : "🔍 Nom bo'yicha qidirish",
        callback_data: 'search_prod',
      },
      {
        text: lang === 'ru' ? '🏪 Магазин' : "🏪 Do'kon",
        callback_data: 'search_shop',
      },
    ]);

    const firstPhoto = this.imgUrl(slice.find((c) => c.image)?.image);
    if (msgId) {
      return firstPhoto
        ? this.editTgMedia(chatId, msgId, firstPhoto, text, keyboard)
        : this.editMessage(chatId, msgId, text, { inline_keyboard: keyboard });
    }
    return firstPhoto
      ? this.sendTgPhoto(chatId, firstPhoto, text, {
          inline_keyboard: keyboard,
        })
      : this.sendMessage(chatId, text, { inline_keyboard: keyboard });
  }

  // ─── Product items in a category ─────────────────────────────────────────

  private async cmdShowCategoryItems(
    chatId: string,
    catId: number,
    page: number,
    msgId?: number,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { chat_id: chatId },
    });
    const lang = user?.lang ?? 'uz';

    const [cat, items] = await Promise.all([
      this.prisma.category.findUnique({
        where: { id: catId },
        select: { name: true, name_uz: true, name_ru: true },
      }),
      this.prisma.productItem.findMany({
        where: {
          work_status: 'WORKING',
          shop_products: { some: { work_status: 'WORKING', count: { gt: 0 } } },
          product: { category_id: catId },
        },
        select: {
          id: true,
          name: true,
          image: true,
          color: true,
          size: true,
          value: true,
          unit_type: { select: { id: true, symbol: true } },
          product: {
            select: {
              name: true,
              name_uz: true,
              name_ru: true,
              image: true,
              category: {
                select: { name: true, name_uz: true, name_ru: true },
              },
            },
          },
          _count: {
            select: {
              shop_products: {
                where: { work_status: 'WORKING', count: { gt: 0 } },
              },
            },
          },
        },
        take: 200,
      }),
    ]);

    if (items.length === 0) {
      const no =
        lang === 'ru'
          ? '📦 В этой категории нет товаров.'
          : "📦 Bu kategoriyada tovar yo'q.";
      if (msgId)
        return this.editMessage(chatId, msgId, no, { inline_keyboard: [] });
      return this.reply(chatId, no);
    }

    const catName =
      (lang === 'ru'
        ? (cat?.name_ru ?? cat?.name)
        : (cat?.name_uz ?? cat?.name)) ?? '—';
    const header =
      lang === 'ru'
        ? `🗂 <b>${catName}</b>  ·  ${items.length} шт.`
        : `🗂 <b>${catName}</b>  ·  ${items.length} ta`;
    await this.sendProductItemsPage(
      chatId,
      items,
      lang,
      page,
      { cat_id: catId },
      header,
      msgId,
    );
  }

  // ─── Product items single-message paginated list ───────────────────────────

  private async sendProductItemsPage(
    chatId: string,
    items: any[],
    lang: string,
    page: number,
    ctx: { prod_q?: string; cat_id?: number },
    headerLine: string,
    msgId?: number,
  ) {
    const PER = this.ITEMS_PER_PHOTO_PAGE;
    const total = items.length;
    const totalPages = Math.ceil(total / PER);
    const safePage = Math.max(0, Math.min(page, totalPages - 1));
    const slice = items.slice(safePage * PER, (safePage + 1) * PER);
    const nums = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];
    const div = '━━━━━━━━━━━━━━━━━━━━━';

    const lines = slice.map((pi, i) => {
      const pname =
        (lang === 'ru'
          ? (pi.product?.name_ru ?? pi.product?.name ?? pi.name)
          : (pi.product?.name_uz ?? pi.product?.name ?? pi.name)) ?? '—';
      const variant = pi.name && pi.name !== pname ? `  ·  ${pi.name}` : '';
      // Build variant detail string: unit/value, color, size
      const parts: string[] = [];
      if (pi.value != null && pi.unit_type?.symbol)
        parts.push(`${pi.value} ${pi.unit_type.symbol}`);
      else if (pi.unit_type?.symbol) parts.push(pi.unit_type.symbol);
      if (pi.color) parts.push(`🎨 ${colorLabel(pi.color)}`);
      if (pi.size) parts.push(`📐 ${pi.size}`);
      const variantDetail =
        parts.length > 0 ? `\n    📌 ${parts.join('  ·  ')}` : '';
      const catLabel =
        lang === 'ru'
          ? (pi.product?.category?.name_ru ?? pi.product?.category?.name ?? '')
          : (pi.product?.category?.name_uz ?? pi.product?.category?.name ?? '');
      const shopCount = pi._count?.shop_products ?? 0;
      const shopLabel =
        lang === 'ru' ? `${shopCount} маг.` : `${shopCount} ta do'kon`;
      return (
        `${nums[i] ?? `${safePage * PER + i + 1}.`}  <b>${pname}${variant}</b>${variantDetail}\n` +
        `    ${catLabel ? `🗂 ${catLabel}   ·   ` : ''}🏪 ${shopLabel}`
      );
    });

    const pageInfo =
      lang === 'ru'
        ? `📄 стр. ${safePage + 1} / ${totalPages}`
        : `📄 ${safePage + 1} / ${totalPages} sahifa`;
    const text = `${headerLine}\n${div}\n\n${lines.join('\n\n')}\n\n${div}\n${pageInfo}`;

    const itemBtns = slice.map((pi) => {
      const pname =
        (lang === 'ru'
          ? (pi.product?.name_ru ?? pi.product?.name ?? pi.name)
          : (pi.product?.name_uz ?? pi.product?.name ?? pi.name)) ?? '—';
      const variant = pi.name && pi.name !== pname ? ` · ${pi.name}` : '';
      const cnt = pi._count?.shop_products ?? 0;
      return [
        {
          text: `🏪 ${(pname + variant).substring(0, 26)} (${cnt} ta)`,
          callback_data: `pshops:${pi.id}`,
        },
      ];
    });

    const paginationFn =
      ctx.cat_id != null
        ? (p: number) => `catsel:${ctx.cat_id}:${p}`
        : (p: number) => `pr:${p}`;
    const pageRow = this.buildPageRow(totalPages, safePage, paginationFn);
    const keyboard: any[][] = [...itemBtns];
    if (pageRow.length) keyboard.push(pageRow);
    keyboard.push([
      {
        text: lang === 'ru' ? '◀️ Каталог' : '◀️ Katalog',
        callback_data: 'cat:0',
      },
    ]);

    const firstPhoto = (() => {
      for (const pi of slice) {
        const img = this.imgUrl(pi.image ?? pi.product?.image);
        if (img) return img;
      }
      return null;
    })();

    if (msgId) {
      return firstPhoto
        ? this.editTgMedia(chatId, msgId, firstPhoto, text, keyboard)
        : this.editMessage(chatId, msgId, text, { inline_keyboard: keyboard });
    }
    return firstPhoto
      ? this.sendTgPhoto(chatId, firstPhoto, text, {
          inline_keyboard: keyboard,
        })
      : this.sendMessage(chatId, text, { inline_keyboard: keyboard });
  }

  // ─── Shop search ───────────────────────────────────────────────────────────

  private async cmdSearchShops(
    chatId: string,
    query: string,
    page: number,
    sort: string,
  ) {
    const [user, session] = await Promise.all([
      this.prisma.user.findFirst({ where: { chat_id: chatId } }),
      this.upsertSession(chatId, { shop_q: query }),
    ]);
    const lang = user?.lang ?? 'uz';
    const userLoc =
      session.lat && session.lon
        ? { lat: session.lat, lon: session.lon }
        : undefined;

    const all = await this.prisma.shop.findMany({
      where: { work_status: 'WORKING', name: { contains: query } },
      select: {
        id: true,
        name: true,
        address: true,
        lat: true,
        lon: true,
        _count: {
          select: {
            products: { where: { work_status: 'WORKING', count: { gt: 0 } } },
          },
        },
      },
      take: 200,
    });

    if (all.length === 0) {
      return this.reply(
        chatId,
        lang === 'ru'
          ? `🔍 <b>Магазин не найден</b> по запросу «${query}»`
          : `🔍 <b>Do'kon topilmadi</b> «${query}» so'rovi bo'yicha`,
      );
    }

    const withDist = all.map((s) => ({
      ...s,
      _count: s._count,
      dist:
        userLoc && s.lat && s.lon
          ? this.haversine(userLoc.lat, userLoc.lon, s.lat, s.lon)
          : null,
    }));
    if (sort === 'n')
      withDist.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    else if (sort === 'c')
      withDist.sort((a, b) => b._count.products - a._count.products);
    else withDist.sort((a, b) => (a.dist ?? Infinity) - (b.dist ?? Infinity));

    const { text, keyboard } = this.buildShopsPage(
      withDist,
      query,
      lang,
      page,
      sort,
      userLoc,
    );
    await this.sendMessage(chatId, text, { inline_keyboard: keyboard });
  }

  private buildShopsPage(
    shops: any[],
    query: string,
    lang: string,
    page: number,
    sort: string,
    loc?: { lat: number; lon: number },
  ) {
    const total = shops.length;
    const totalPages = Math.ceil(total / this.SEARCH_PER_PAGE);
    const safePage = Math.max(0, Math.min(page, totalPages - 1));
    const slice = shops.slice(
      safePage * this.SEARCH_PER_PAGE,
      (safePage + 1) * this.SEARCH_PER_PAGE,
    );
    const nums = ['1️⃣', '2️⃣', '3️⃣'];
    const div = '━━━━━━━━━━━━━━━━━━━━━';
    const sortLabels: Record<string, Record<string, string>> = {
      d: { uz: '📏 Masofa', ru: '📏 Расстояние' },
      n: { uz: '🔤 Nom', ru: '🔤 Название' },
      c: { uz: '📦 Tovar', ru: '📦 Товаров' },
    };
    const header =
      lang === 'ru'
        ? `🏪 <b>Магазины</b>  ·  «${query}»  ·  ${total} шт.`
        : `🏪 <b>Do'konlar</b>  ·  «${query}»  ·  ${total} ta`;

    const lines = slice.map((s, i) => {
      const num = nums[i] ?? `${safePage * this.SEARCH_PER_PAGE + i + 1}.`;
      const prodCnt = s._count?.products ?? 0;
      let geoLine: string;
      if (s.dist != null) {
        const d =
          s.dist < 1
            ? `${Math.round(s.dist * 1000)} m`
            : `${s.dist.toFixed(1)} km`;
        geoLine = `🚩 ${d} ${lang === 'ru' ? 'от вас' : 'uzoqda'}`;
      } else if (s.lat && s.lon) {
        geoLine = `🗺 ${lang === 'ru' ? 'Есть на карте' : 'Xaritada mavjud'}`;
      } else {
        geoLine = `📌 ${lang === 'ru' ? 'Адрес не указан' : "Manzil ko'rsatilmagan"}`;
      }
      return (
        `${num} <b>${s.name ?? '—'}</b>\n` +
        `    📍 ${s.address ?? '—'}   ·   ${geoLine}\n` +
        `    📦 ${prodCnt} ${lang === 'ru' ? 'тов.' : 'tovar'}`
      );
    });

    const pageInfo =
      lang === 'ru'
        ? `📄 Стр. ${safePage + 1} / ${totalPages}`
        : `📄 ${safePage + 1} / ${totalPages}`;
    const text = `${header}\n${div}\n\n${lines.join('\n\n')}\n\n${div}\n${pageInfo}`;

    const shopRows = slice.map((s) => [
      {
        text: `🛍 ${(s.name ?? '').substring(0, 28)}`,
        callback_data: `sp:${s.id}:0`,
      },
    ]);
    const sortRow = (['d', 'n', 'c'] as const).map((k) => ({
      text:
        (sort === k ? '·' : '') + sortLabels[k][lang] + (sort === k ? '·' : ''),
      callback_data: `sh:${safePage}:${k}`,
    }));
    const pageRow = this.buildPageRow(
      totalPages,
      safePage,
      (p) => `sh:${p}:${sort}`,
    );
    const keyboard: any[][] = [...shopRows, sortRow];
    if (pageRow.length) keyboard.push(pageRow);
    return { text, keyboard };
  }

  // ─── Product search: text query → paginated list ────────────────────────────

  private async cmdSearchProducts(
    chatId: string,
    query: string,
    page: number,
    msgId?: number,
  ) {
    const [user] = await Promise.all([
      this.prisma.user.findFirst({ where: { chat_id: chatId } }),
      this.upsertSession(chatId, { prod_q: query }),
    ]);
    const lang = user?.lang ?? 'uz';

    const all = await this.prisma.productItem.findMany({
      where: {
        work_status: 'WORKING',
        shop_products: { some: { work_status: 'WORKING', count: { gt: 0 } } },
        OR: [
          { name: { contains: query } },
          { product: { name: { contains: query } } },
          { product: { name_uz: { contains: query } } },
          { product: { name_ru: { contains: query } } },
        ],
      },
      select: {
        id: true,
        name: true,
        image: true,
        color: true,
        size: true,
        value: true,
        unit_type: { select: { id: true, symbol: true } },
        product: {
          select: {
            name: true,
            name_uz: true,
            name_ru: true,
            image: true,
            category: { select: { name: true, name_uz: true, name_ru: true } },
          },
        },
        _count: {
          select: {
            shop_products: {
              where: { work_status: 'WORKING', count: { gt: 0 } },
            },
          },
        },
      },
      take: 100,
    });

    if (all.length === 0) {
      const no =
        lang === 'ru'
          ? `🔍 <b>Товар не найден</b> по запросу «${query}»`
          : `🔍 <b>Tovar topilmadi</b> «${query}» so'rovi bo'yicha`;
      if (msgId)
        return this.editMessage(chatId, msgId, no, { inline_keyboard: [] });
      return this.reply(chatId, no);
    }

    const header =
      lang === 'ru'
        ? `🔍 <b>Natijalar</b>: «${query}»  ·  ${all.length} шт.`
        : `🔍 <b>Natijalar</b>: «${query}»  ·  ${all.length} ta`;
    await this.sendProductItemsPage(
      chatId,
      all,
      lang,
      page,
      { prod_q: query },
      header,
      msgId,
    );
  }

  // ─── Shop list for a product item ─────────────────────────────────────────

  private async showProductShops(
    chatId: string,
    piId: number,
    page: number,
    msgId?: number,
  ) {
    const [user, session, pi] = await Promise.all([
      this.prisma.user.findFirst({ where: { chat_id: chatId } }),
      this.getSession(chatId),
      this.prisma.productItem.findUnique({
        where: { id: piId },
        select: {
          id: true,
          name: true,
          color: true,
          size: true,
          value: true,
          unit_type: { select: { id: true, symbol: true } },
          product: {
            select: {
              name: true,
              name_uz: true,
              name_ru: true,
              category: { select: { name: true } },
            },
          },
        },
      }),
    ]);
    const lang = user?.lang ?? 'uz';
    if (!pi) return;

    const spList = await this.prisma.shopProduct.findMany({
      where: {
        product_item_id: piId,
        work_status: 'WORKING',
        count: { gt: 0 },
      },
      select: {
        id: true,
        price: true,
        bonus_price: true,
        count: true,
        shop: {
          select: { id: true, name: true, address: true, lat: true, lon: true },
        },
        order_products: {
          where: { order: { status: 'FINISHED' } },
          select: { count: true },
        },
      },
      orderBy: { price: 'asc' },
    });

    if (spList.length === 0) {
      const noShops =
        lang === 'ru'
          ? '😔 В магазинах нет этого товара.'
          : "😔 Do'konlarda bu tovar yo'q.";
      if (msgId)
        return this.editMessage(chatId, msgId, noShops, {
          inline_keyboard: [],
        });
      return this.reply(chatId, noShops);
    }

    const userLoc =
      session?.lat && session?.lon
        ? { lat: session.lat, lon: session.lon }
        : null;
    const cart = this.parseCart(session?.cart);

    const pname =
      lang === 'ru'
        ? (pi.product?.name_ru ?? pi.product?.name ?? pi.name ?? '—')
        : (pi.product?.name_uz ?? pi.product?.name ?? pi.name ?? '—');
    const cat = pi.product?.category?.name ?? '';
    const PER_PAGE = 5;
    const total = spList.length;
    const totalPages = Math.ceil(total / PER_PAGE);
    const safePage = Math.max(0, Math.min(page, totalPages - 1));
    const slice = spList.slice(safePage * PER_PAGE, (safePage + 1) * PER_PAGE);
    const nums = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
    const div = '━━━━━━━━━━━━━━━━━━━━━';

    const minPrice = spList[0]?.price ?? 0;
    const maxPrice = spList[spList.length - 1]?.price ?? 0;
    const priceRange =
      minPrice === maxPrice
        ? `💰 ${minPrice.toLocaleString('ru-RU')} so'm`
        : `💰 ${minPrice.toLocaleString('ru-RU')} – ${maxPrice.toLocaleString('ru-RU')} so'm`;

    const variantTags = [
      (pi as any).value != null && (pi as any).unit_type?.symbol
        ? `${(pi as any).value} ${(pi as any).unit_type.symbol}`
        : '',
      colorLabel((pi as any).color) ?? '',
      (pi as any).size ?? '',
    ]
      .filter(Boolean)
      .join(' · ');

    const header =
      `📦 <b>${pname}</b>\n` +
      (variantTags ? `  <i>${variantTags}</i>\n` : '') +
      (cat ? `🗂 ${cat}\n` : '') +
      `${priceRange}   ·   🏪 ${total} ${lang === 'ru' ? 'маг.' : "do'kon"}`;

    const shopLines = slice.map((sp, i) => {
      const shop = sp.shop;
      const price = (sp.price ?? 0).toLocaleString('ru-RU');
      const soldCount =
        (sp as any).order_products?.reduce(
          (s: number, op: any) => s + op.count,
          0,
        ) ?? 0;
      let distLine = '';
      if (userLoc && shop.lat && shop.lon) {
        const d = this.haversine(userLoc.lat, userLoc.lon, shop.lat, shop.lon);
        distLine =
          d < 1
            ? `   ·   🚩 ${Math.round(d * 1000)} m`
            : `   ·   🚩 ${d.toFixed(1)} km`;
      }
      const inCart = cart.find((c) => c.shop_product_id === sp.id);
      const cartTag = inCart ? `  ✅ ${inCart.count} ta` : '';
      const soldLine =
        soldCount > 0
          ? `   ·   ✅ ${soldCount} ${lang === 'ru' ? 'продано' : 'sotilgan'}`
          : '';
      return (
        `${nums[i] ?? `${safePage * PER_PAGE + i + 1}.`}  <b>${shop.name ?? '—'}</b>${cartTag}\n` +
        `    📍 ${shop.address ?? '—'}${distLine}\n` +
        `    💰 ${price} so'm   ·   📦 ${sp.count} ta${soldLine}`
      );
    });

    const pageInfo =
      totalPages > 1 ? `\n📄 ${safePage + 1} / ${totalPages}` : '';
    const text = `${header}\n${div}\n\n${shopLines.join('\n\n')}\n${div}${pageInfo}`;

    const addRows = slice.map((sp) => {
      const price = (sp.price ?? 0).toLocaleString('ru-RU');
      const inCart = cart.find((c) => c.shop_product_id === sp.id);
      const shopLabel = (sp.shop.name ?? '').substring(0, 20);
      const label = inCart
        ? `✅ ${shopLabel} (${inCart.count} ta)`
        : `➕ ${shopLabel} — ${price} so'm`;
      return [{ text: label, callback_data: `add:${sp.id}` }];
    });

    const cartQty = cart.reduce((s, c) => s + c.count, 0);
    const cartTotal = cart.reduce((s, c) => s + c.price * c.count, 0);
    const cartBtn =
      cartQty > 0
        ? {
            text: `🛒 ${lang === 'ru' ? 'Корзина' : 'Savat'} (${cartQty} ta · ${cartTotal.toLocaleString('ru-RU')} so'm)`,
            callback_data: 'view_cart',
          }
        : {
            text: `🛒 ${lang === 'ru' ? 'Корзина пуста' : "Savat bo'sh"}`,
            callback_data: 'view_cart',
          };

    const pageRow = this.buildPageRow(
      totalPages,
      safePage,
      (p) => `pshops:${piId}:${p}`,
    );
    const backBtn = {
      text: lang === 'ru' ? '◀️ Каталог' : '◀️ Katalog',
      callback_data: 'cat:0',
    };
    const keyboard: any[][] = [...addRows, [cartBtn]];
    if (pageRow.length) keyboard.push(pageRow);
    keyboard.push([backBtn]);

    if (msgId)
      return this.editMessage(chatId, msgId, text, {
        inline_keyboard: keyboard,
      });
    return this.sendMessage(chatId, text, { inline_keyboard: keyboard });
  }

  // ─── Shop products page ────────────────────────────────────────────────────

  private async renderShopProducts(
    chatId: string,
    shopId: number,
    page: number,
    msgId?: number,
  ) {
    const [user, session, shop] = await Promise.all([
      this.prisma.user.findFirst({ where: { chat_id: chatId } }),
      this.getSession(chatId),
      this.prisma.shop.findUnique({
        where: { id: shopId },
        select: {
          id: true,
          name: true,
          image: true,
          address: true,
          lat: true,
          lon: true,
        },
      }),
    ]);
    const lang = user?.lang ?? 'uz';
    if (!shop) return;

    const all = await this.prisma.shopProduct.findMany({
      where: { shop_id: shopId, work_status: 'WORKING', count: { gt: 0 } },
      select: {
        id: true,
        price: true,
        count: true,
        product_item: {
          select: {
            name: true,
            product: {
              select: {
                name: true,
                name_uz: true,
                name_ru: true,
                category: { select: { name: true } },
              },
            },
          },
        },
        order_products: {
          where: { order: { status: 'FINISHED' } },
          select: { count: true },
        },
      },
      take: 100,
    });

    if (all.length === 0) {
      const noItems =
        lang === 'ru'
          ? `📭 В магазине <b>${shop.name}</b> пока нет товаров.`
          : `📭 <b>${shop.name}</b> do'konida tovar yo'q.`;
      if (msgId)
        return this.editMessage(chatId, msgId, noItems, {
          inline_keyboard: [],
        });
      return this.reply(chatId, noItems);
    }

    const cart = this.parseCart(session?.cart);
    const total = all.length;
    const totalPages = Math.ceil(total / this.SEARCH_PER_PAGE);
    const safePage = Math.max(0, Math.min(page, totalPages - 1));
    const slice = all.slice(
      safePage * this.SEARCH_PER_PAGE,
      (safePage + 1) * this.SEARCH_PER_PAGE,
    );
    const nums = ['1️⃣', '2️⃣', '3️⃣'];
    const div = '━━━━━━━━━━━━━━━━━━━━━';

    const addressLine = shop.address ? `\n📍 ${shop.address}` : '';
    const header =
      lang === 'ru'
        ? `🏪 <b>${shop.name}</b>  ·  ${total} товаров${addressLine}`
        : `🏪 <b>${shop.name}</b>  ·  ${total} tovar${addressLine}`;

    const lines = slice.map((sp, i) => {
      const pname = this.getProductName(sp, lang);
      const itemVariant = sp.product_item?.name;
      const displayName =
        itemVariant && itemVariant !== pname
          ? `${pname}  ·  ${itemVariant}`
          : pname;
      const cat = sp.product_item?.product?.category?.name ?? '';
      const price = (sp.price ?? 0).toLocaleString('ru-RU');
      const soldCount =
        (sp as any).order_products?.reduce(
          (s: number, op: any) => s + op.count,
          0,
        ) ?? 0;
      const inCart = cart.find((c) => c.shop_product_id === sp.id);
      const cartTag = inCart ? `  ✅ ${inCart.count} ta` : '';
      const soldLine =
        soldCount > 0
          ? `   ·   ✅ ${soldCount} ${lang === 'ru' ? 'прод.' : 'sotilgan'}`
          : '';
      return (
        `${nums[i] ?? `${safePage * this.SEARCH_PER_PAGE + i + 1}.`}  <b>${displayName}</b>${cartTag}\n` +
        `    ${cat ? `🗂 ${cat}   ·   ` : ''}💰 ${price} so'm   ·   📦 ${sp.count} ta${soldLine}`
      );
    });

    const pageInfo =
      lang === 'ru'
        ? `📄 Стр. ${safePage + 1} / ${totalPages}`
        : `📄 ${safePage + 1} / ${totalPages}`;
    const text = `${header}\n${div}\n\n${lines.join('\n\n')}\n\n${div}\n${pageInfo}`;

    const addRows = slice.map((sp) => {
      const pname = sp.product_item?.name || this.getProductName(sp, lang);
      const price = (sp.price ?? 0).toLocaleString('ru-RU');
      const inCart = cart.find((c) => c.shop_product_id === sp.id);
      const label = inCart
        ? `✅ ${pname.substring(0, 20)} (${inCart.count} ta)`
        : `➕  ${pname.substring(0, 20)} — ${price} so'm`;
      return [{ text: label, callback_data: `add:${sp.id}` }];
    });

    const cartQty = cart.reduce((s, c) => s + c.count, 0);
    const cartTotal = cart.reduce((s, c) => s + c.price * c.count, 0);
    const cartBtn =
      cartQty > 0
        ? {
            text: `🛒 ${lang === 'ru' ? 'Корзина' : 'Savat'} (${cartQty} ta · ${cartTotal.toLocaleString('ru-RU')} so'm)`,
            callback_data: 'view_cart',
          }
        : {
            text: `🛒 ${lang === 'ru' ? 'Просмотр корзины' : "Savatni ko'rish"}`,
            callback_data: 'view_cart',
          };

    const pageRow = this.buildPageRow(
      totalPages,
      safePage,
      (p) => `sp:${shopId}:${p}`,
    );
    const keyboard: any[][] = [...addRows, [cartBtn]];
    if (pageRow.length) keyboard.push(pageRow);

    const shopPhoto = this.imgUrl(shop.image);
    if (msgId) {
      const result = shopPhoto
        ? this.editTgMedia(chatId, msgId, shopPhoto, text, keyboard)
        : this.editMessage(chatId, msgId, text, { inline_keyboard: keyboard });
      return result;
    }
    // First open: send product list then location pin
    if (shopPhoto) {
      await this.sendTgPhoto(chatId, shopPhoto, text, {
        inline_keyboard: keyboard,
      });
    } else {
      await this.sendMessage(chatId, text, { inline_keyboard: keyboard });
    }
    if (shop.lat && shop.lon)
      await this.sendLocation(chatId, shop.lat, shop.lon);
  }

  // ─── Checkout flow ─────────────────────────────────────────────────────────

  private async cmdCheckout(chatId: string, msgId?: number) {
    const [user, session] = await Promise.all([
      this.prisma.user.findFirst({ where: { chat_id: chatId } }),
      this.getSession(chatId),
    ]);
    const lang = user?.lang ?? 'uz';
    if (!user) {
      const noauth =
        lang === 'ru'
          ? '🔑 Сначала войдите: /login'
          : '🔑 Avval kiring: /login';
      if (msgId)
        return this.editMessage(chatId, msgId, noauth, { inline_keyboard: [] });
      return this.reply(chatId, noauth);
    }
    const cart = this.parseCart(session?.cart);
    if (cart.length === 0) {
      const empty = lang === 'ru' ? '🛒 Корзина пуста.' : "🛒 Savat bo'sh.";
      if (msgId)
        return this.editMessage(chatId, msgId, empty, { inline_keyboard: [] });
      return this.reply(chatId, empty);
    }
    const total = cart.reduce((s, i) => s + i.price * i.count, 0);
    await this.upsertSession(chatId, { chk: null });
    const text =
      lang === 'ru'
        ? `📋 <b>Оформление заказа</b>\n🏪 Магазин: ${cart[0].shop_name}\n💰 Сумма: ${total.toLocaleString('ru-RU')} сум\n\nВыберите тип доставки:`
        : `📋 <b>Buyurtmani rasmiylashtirish</b>\n🏪 Do'kon: ${cart[0].shop_name}\n💰 Jami: ${total.toLocaleString('ru-RU')} so'm\n\nYetkazib berish turini tanlang:`;
    const kb = {
      inline_keyboard: [
        [
          {
            text: lang === 'ru' ? '🏪 Самовывоз' : "🏪 O'zim olaman",
            callback_data: 'chkdel:MARKET',
          },
          {
            text: lang === 'ru' ? '🚚 Доставка' : '🚚 Yetkazib berish',
            callback_data: 'chkdel:YANDEX',
          },
        ],
      ],
    };
    if (msgId) return this.editMessage(chatId, msgId, text, kb);
    return this.sendMessage(chatId, text, kb);
  }

  private async handleCheckoutDelivery(
    chatId: string,
    msgId: number,
    deliveryType: 'MARKET' | 'YANDEX',
  ) {
    const user = await this.prisma.user.findFirst({
      where: { chat_id: chatId },
    });
    const lang = user?.lang ?? 'uz';
    const chk: CheckoutCtx = { delivery_type: deliveryType };
    if (deliveryType === 'YANDEX') {
      await this.upsertSession(chatId, {
        chk: JSON.stringify(chk),
        state: 'waiting_checkout_address',
      });
      const text =
        lang === 'ru'
          ? '📍 Введите адрес доставки или отправьте геолокацию:\n\n<i>Например: Шайхантауский р-н, ул. Навруз, 12</i>'
          : "📍 Yetkazib berish manzilingizni yozing yoki joylashuvingizni yuboring:\n\n<i>Masalan: Shayxontohur, Navruz ko'chasi 12</i>";
      await this.editMessage(chatId, msgId, text, { inline_keyboard: [] });
      await this.sendMessage(chatId, lang === 'ru' ? '👇' : '👇', {
        keyboard: [
          [
            {
              text: `📍 ${lang === 'ru' ? 'Отправить геолокацию' : 'Joylashuvni yuborish'}`,
              request_location: true,
            },
          ],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      });
      return;
    } else {
      return this.showPaymentSelection(chatId, lang, msgId);
    }
  }

  private async handleCheckoutAddress(chatId: string, address: string) {
    const user = await this.prisma.user.findFirst({
      where: { chat_id: chatId },
    });
    const lang = user?.lang ?? 'uz';
    const session = await this.getSession(chatId);
    const chk: CheckoutCtx = JSON.parse(session?.chk ?? '{}');
    chk.address = address;
    await this.upsertSession(chatId, {
      state: 'idle',
      chk: JSON.stringify(chk),
    });
    const ack =
      lang === 'ru'
        ? `✅ Адрес принят: <b>${address}</b>\n\nВыберите способ оплаты:`
        : `✅ Manzil qabul qilindi: <b>${address}</b>\n\nTo'lov turini tanlang:`;
    await this.reply(chatId, ack);
    return this.showPaymentSelection(chatId, lang, undefined);
  }

  private async handleCheckoutLocationAddress(
    chatId: string,
    location: { latitude: number; longitude: number },
  ) {
    const user = await this.prisma.user.findFirst({
      where: { chat_id: chatId },
    });
    const lang = user?.lang ?? 'uz';
    const session = await this.getSession(chatId);
    const chk: CheckoutCtx = JSON.parse(session?.chk ?? '{}');
    const address = `📍 ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;
    chk.address = address;
    chk.lat = location.latitude;
    chk.lon = location.longitude;
    await this.upsertSession(chatId, {
      state: 'idle',
      chk: JSON.stringify(chk),
    });
    const ack =
      lang === 'ru'
        ? `✅ Местоположение принято\n\nВыберите способ оплаты:`
        : `✅ Joylashuv qabul qilindi\n\nTo'lov turini tanlang:`;
    await this.sendMessage(chatId, ack, { remove_keyboard: true });
    return this.showPaymentSelection(chatId, lang, undefined);
  }

  private async showPaymentSelection(
    chatId: string,
    lang: string,
    msgId?: number,
  ) {
    const text =
      lang === 'ru'
        ? '💳 Выберите способ оплаты:'
        : "💳 To'lov turini tanlang:";
    const kb = {
      inline_keyboard: [
        [
          {
            text: '💵 ' + (lang === 'ru' ? 'Наличные' : 'Naqd pul'),
            callback_data: 'chkpay:CASH',
          },
        ],
        [
          { text: '� Click', callback_data: 'chkpay:CLICK' },
          { text: '🔴 Payme', callback_data: 'chkpay:PAYME' },
          { text: '🟣 Uzum', callback_data: 'chkpay:UZUM' },
        ],
      ],
    };
    if (msgId) return this.editMessage(chatId, msgId, text, kb);
    return this.sendMessage(chatId, text, kb);
  }

  private async handleCheckoutPayment(
    chatId: string,
    msgId: number,
    paymentType: string,
  ) {
    const [user, session] = await Promise.all([
      this.prisma.user.findFirst({ where: { chat_id: chatId } }),
      this.getSession(chatId),
    ]);
    const lang = user?.lang ?? 'uz';
    const cart = this.parseCart(session?.cart);
    if (cart.length === 0) {
      return this.editMessage(
        chatId,
        msgId,
        lang === 'ru' ? '🛒 Корзина пуста.' : "🛒 Savat bo'sh.",
        { inline_keyboard: [] },
      );
    }
    const chk: CheckoutCtx = JSON.parse(session?.chk ?? '{}');
    chk.payment_type = paymentType;
    await this.upsertSession(chatId, { chk: JSON.stringify(chk) });

    const shopName = cart[0].shop_name;
    const total = cart.reduce((s, i) => s + i.price * i.count, 0);
    const payLabel: Record<string, Record<string, string>> = {
      CASH: { uz: 'Naqd pul', ru: 'Наличные' },
      CARD: { uz: 'Karta', ru: 'Карта' },
      CLICK: { uz: 'Click', ru: 'Click' },
      PAYME: { uz: 'Payme', ru: 'Payme' },
      UZUM: { uz: 'Uzum', ru: 'Uzum' },
    };
    const delLabel: Record<string, Record<string, string>> = {
      MARKET: { uz: "O'zim olaman", ru: 'Самовывоз' },
      YANDEX: { uz: 'Yetkazib berish', ru: 'Доставка' },
    };
    const pay = payLabel[paymentType]?.[lang] ?? paymentType;
    const del =
      delLabel[chk.delivery_type ?? 'MARKET']?.[lang] ?? chk.delivery_type;
    const addrLine = chk.address
      ? `\n📍 ${lang === 'ru' ? 'Адрес' : 'Manzil'}: ${chk.address}`
      : '';
    const itemLines = cart
      .map(
        (it) =>
          `  • ${it.name} × ${it.count} = ${(it.price * it.count).toLocaleString('ru-RU')} so'm`,
      )
      .join('\n');

    const text =
      lang === 'ru'
        ? `✅ <b>Подтвердите заказ</b>\n🏪 Магазин: ${shopName}\n🚚 Доставка: ${del}${addrLine}\n💳 Оплата: ${pay}\n\n<b>Товары:</b>\n${itemLines}\n\n💰 Итого: <b>${total.toLocaleString('ru-RU')} сум</b>`
        : `✅ <b>Buyurtmani tasdiqlang</b>\n🏪 Do'kon: ${shopName}\n🚚 Yetkazib berish: ${del}${addrLine}\n💳 To'lov: ${pay}\n\n<b>Tovarlar:</b>\n${itemLines}\n\n💰 Jami: <b>${total.toLocaleString('ru-RU')} so'm</b>`;

    return this.editMessage(chatId, msgId, text, {
      inline_keyboard: [
        [
          {
            text: lang === 'ru' ? '✅ Подтвердить' : '✅ Tasdiqlash',
            callback_data: 'confirm_order',
          },
          {
            text: lang === 'ru' ? '❌ Отмена' : '❌ Bekor',
            callback_data: 'cancel_order',
          },
        ],
      ],
    });
  }

  private async createOrderFromBot(chatId: string, msgId: number) {
    const [user, session] = await Promise.all([
      this.prisma.user.findFirst({ where: { chat_id: chatId } }),
      this.getSession(chatId),
    ]);
    const lang = user?.lang ?? 'uz';
    if (!user) {
      return this.editMessage(
        chatId,
        msgId,
        lang === 'ru' ? '🔑 /login' : '🔑 /login',
        { inline_keyboard: [] },
      );
    }
    const cart = this.parseCart(session?.cart);
    if (cart.length === 0) {
      return this.editMessage(
        chatId,
        msgId,
        lang === 'ru' ? '🛒 Корзина пуста.' : "🛒 Savat bo'sh.",
        { inline_keyboard: [] },
      );
    }
    const chk: CheckoutCtx = JSON.parse(session?.chk ?? '{}');
    const shopId = cart[0].shop_id;
    const total = cart.reduce((s, i) => s + i.price * i.count, 0);

    try {
      const order = await this.prisma.$transaction(async (tx) => {
        const o = await tx.order.create({
          data: {
            shop_id: shopId,
            user_id: user.id,
            amount: total,
            delivery_type: (chk.delivery_type ?? 'MARKET') as any,
            payment_type: chk.payment_type ?? 'CASH',
            address: chk.address ?? null,
            source: 'STORE_BOT' as any,
          },
        });
        await Promise.all(
          cart.map((item) =>
            tx.orderProduct.create({
              data: {
                order_id: o.id,
                shop_product_id: item.shop_product_id,
                count: item.count,
                amount: item.price,
              },
            }),
          ),
        );
        return o;
      });

      await this.upsertSession(chatId, { cart: null, chk: null });
      const successText =
        lang === 'ru'
          ? `🎉 <b>Заказ #${order.id} оформлен!</b>\n🏪 Магазин: ${cart[0].shop_name}\n💰 Сумма: ${total.toLocaleString('ru-RU')} сум\n⏳ Статус: В обработке\n\nОтслеживайте: /orders`
          : `🎉 <b>#${order.id} buyurtmangiz qabul qilindi!</b>\n🏪 Do'kon: ${cart[0].shop_name}\n💰 Jami: ${total.toLocaleString('ru-RU')} so'm\n⏳ Holat: Jarayonda\n\nKuzating: /orders`;
      await this.editMessage(chatId, msgId, successText, {
        inline_keyboard: [],
      });
    } catch (e: any) {
      this.logger.error(`createOrderFromBot error: ${e?.message}`);
      const errText =
        lang === 'ru'
          ? `❌ Ошибка: ${e?.message ?? 'Неизвестная ошибка'}`
          : `❌ Xatolik: ${e?.message ?? "Noma'lum xatolik"}`;
      await this.editMessage(chatId, msgId, errText, { inline_keyboard: [] });
    }
  }

  // ─── Contact + SMS code ────────────────────────────────────────────────────

  private async handleContact(chatId: string, contact: any) {
    let phone: string = contact.phone_number ?? '';
    if (!phone.startsWith('+')) phone = '+' + phone;
    try {
      const result = await this.smsService.send({ phone });
      await this.upsertSession(chatId, {
        state: 'waiting_code',
        sms_id: result.id,
        phone,
      });
      const text =
        `✅ <b>SMS yuborildi!</b>\n\n` +
        `📱 Raqam: <code>${phone}</code>\n\n` +
        `🔢 SMS orqali kelgan 6 raqamli kodni kiriting:`;
      await this.sendMessage(chatId, text, { remove_keyboard: true });
    } catch (e: any) {
      this.logger.error(`handleContact sms.send error: ${e?.message}`);
      await this.reply(
        chatId,
        '❌ SMS yuborishda xatolik. Qayta /start yozing.',
      );
    }
  }

  private async handleSmsCode(chatId: string, code: string) {
    const session = await this.getSession(chatId);
    if (!session?.sms_id) {
      return this.reply(chatId, '❌ Sessiya topilmadi. /start yozing.');
    }
    try {
      const result = await this.smsService.verify({
        id: session.sms_id,
        code,
        chat_id: chatId,
        lang: 'uz',
      });
      await this.clearState(chatId);
      const url = `${this.storeUrl}?token=${result.access_token}`;
      const text =
        `✅ <b>Muvaffaqiyatli kirdingiz!</b>\n\n` +
        `👤 Raqam: ${result.user.phone}\n\n` +
        `🛒 Do'konga o'tish uchun tugmani bosing:`;
      await this.sendMessage(chatId, text, {
        inline_keyboard: [[{ text: "🛒 Do'konga o'tish", web_app: { url } }]],
      });
    } catch (e: any) {
      const msg = e?.message ?? '';
      if (msg.includes("noto'g'ri") || msg.includes('Kod')) {
        await this.reply(
          chatId,
          "❌ Kod noto'g'ri. Qayta kiriting yoki /start yozing.",
        );
      } else if (msg.includes('muddati')) {
        await this.clearState(chatId);
        await this.reply(chatId, '⏰ Kod muddati tugagan. /start yozing.');
      } else {
        await this.clearState(chatId);
        await this.reply(chatId, '❌ Xatolik yuz berdi. /start yozing.');
      }
    }
  }

  // ─── Language / Help ───────────────────────────────────────────────────────

  private async cmdLanguage(chatId: string) {
    await this.sendMessage(chatId, '🌐 Tilni tanlang / Выберите язык:', {
      inline_keyboard: [
        [
          { text: "🇺🇿 O'zbek", callback_data: 'lang_uz' },
          { text: '🇷🇺 Русский', callback_data: 'lang_ru' },
        ],
      ],
    });
  }

  private async cmdHelp(chatId: string) {
    const user = await this.prisma.user.findFirst({
      where: { chat_id: chatId },
    });
    const lang = user?.lang ?? 'uz';
    const cmds = (lang === 'ru' ? STORE_BOT_COMMANDS_RU : STORE_BOT_COMMANDS)
      .map((c) => `/${c.command} — ${c.description}`)
      .join('\n');
    const text =
      lang === 'ru'
        ? `❓ <b>Список команд:</b>\n\n${cmds}\n\n🛒 Магазин: ${this.storeUrl}`
        : `❓ <b>Komandalar ro'yxati:</b>\n\n${cmds}\n\n🛒 Do'kon: ${this.storeUrl}`;
    await this.reply(chatId, text);
  }

  // ─── Callback handler ──────────────────────────────────────────────────────

  private async handleCallback(callbackQuery: any) {
    const chatId = String(callbackQuery.message?.chat?.id);
    const messageId = callbackQuery.message?.message_id as number;
    const data = (callbackQuery.data as string) ?? '';

    if (data === 'noop') {
      await this.answerCallback(callbackQuery.id);
      return;
    }

    // ── Orders pagination: orders_N ─────────────────────────────────────────
    if (data.startsWith('orders_')) {
      const page = parseInt(data.split('_')[1], 10) || 0;
      const user = await this.prisma.user.findFirst({
        where: { chat_id: chatId },
      });
      if (user) {
        const lang = user.lang ?? 'uz';
        const total = await this.prisma.order.count({
          where: { user_id: user.id },
        });
        const totalPages = Math.ceil(total / this.ORDERS_PER_PAGE);
        const safePage = Math.max(0, Math.min(page, totalPages - 1));
        const orders = await this.prisma.order.findMany({
          where: { user_id: user.id },
          skip: safePage * this.ORDERS_PER_PAGE,
          take: this.ORDERS_PER_PAGE,
          orderBy: { createdt: 'desc' },
          include: { shop: { select: { name: true } } },
        });
        const { text, keyboard } = this.buildOrdersPage(
          orders,
          lang,
          safePage,
          totalPages,
          total,
        );
        await this.editMessage(chatId, messageId, text, {
          inline_keyboard: keyboard,
        });
      }
      await this.answerCallback(callbackQuery.id);
      return;
    }

    // ── Shop search pagination: sh:PAGE:SORT ────────────────────────────────
    if (data.startsWith('sh:')) {
      const [, pg, srt] = data.split(':');
      const page = parseInt(pg, 10) || 0;
      const sort = srt ?? 'd';
      const [user, session] = await Promise.all([
        this.prisma.user.findFirst({ where: { chat_id: chatId } }),
        this.getSession(chatId),
      ]);
      const lang = user?.lang ?? 'uz';
      const query = session?.shop_q ?? '';
      if (query) {
        const userLoc =
          session?.lat && session?.lon
            ? { lat: session.lat, lon: session.lon }
            : undefined;
        const all = await this.prisma.shop.findMany({
          where: { work_status: 'WORKING', name: { contains: query } },
          select: {
            id: true,
            name: true,
            address: true,
            lat: true,
            lon: true,
            _count: {
              select: {
                products: {
                  where: { work_status: 'WORKING', count: { gt: 0 } },
                },
              },
            },
          },
          take: 200,
        });
        const withDist = all.map((s) => ({
          ...s,
          _count: s._count,
          dist:
            userLoc && s.lat && s.lon
              ? this.haversine(userLoc.lat, userLoc.lon, s.lat, s.lon)
              : null,
        }));
        if (sort === 'n')
          withDist.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
        else if (sort === 'c')
          withDist.sort((a, b) => b._count.products - a._count.products);
        else
          withDist.sort((a, b) => (a.dist ?? Infinity) - (b.dist ?? Infinity));
        const { text, keyboard } = this.buildShopsPage(
          withDist,
          query,
          lang,
          page,
          sort,
          userLoc,
        );
        await this.editMessage(chatId, messageId, text, {
          inline_keyboard: keyboard,
        });
      }
      await this.answerCallback(callbackQuery.id);
      return;
    }

    // ── Product search pagination: pr:PAGE ──────────────────────────────────
    if (data.startsWith('pr:')) {
      const page = parseInt(data.split(':')[1], 10) || 0;
      const session = await this.getSession(chatId);
      const query = session?.prod_q ?? '';
      if (query) await this.cmdSearchProducts(chatId, query, page, messageId);
      await this.answerCallback(callbackQuery.id);
      return;
    }

    // ── Category catalog pagination: cat:PAGE ────────────────────────────────
    if (data.startsWith('cat:')) {
      const page = parseInt(data.split(':')[1], 10) || 0;
      await this.cmdShowCategories(chatId, page, messageId);
      await this.answerCallback(callbackQuery.id);
      return;
    }

    // ── Category product items: catsel:CAT_ID:PAGE ────────────────────────────
    if (data.startsWith('catsel:')) {
      const parts = data.split(':');
      const catId = parseInt(parts[1], 10);
      const page = parseInt(parts[2] ?? '0', 10) || 0;
      if (catId)
        await this.cmdShowCategoryItems(chatId, catId, page, messageId);
      await this.answerCallback(callbackQuery.id);
      return;
    }

    // ── Product item shop list: pshops:PI_ID or pshops:PI_ID:PAGE ────────────
    if (data.startsWith('pshops:')) {
      const parts = data.split(':');
      const piId = parseInt(parts[1], 10);
      const page = parseInt(parts[2] ?? '0', 10) || 0;
      // Never pass messageId — shop list may be opened from a photo message which
      // cannot be edited as text. Always send a fresh text message.
      if (piId) await this.showProductShops(chatId, piId, page);
      await this.answerCallback(callbackQuery.id);
      return;
    }

    // ── Nearby pagination: nb:PAGE:SORT ─────────────────────────────────────
    if (data.startsWith('nb:')) {
      const [, pg, srt] = data.split(':');
      const page = parseInt(pg, 10) || 0;
      const sort = srt ?? 'd';
      const [user, session] = await Promise.all([
        this.prisma.user.findFirst({ where: { chat_id: chatId } }),
        this.getSession(chatId),
      ]);
      const lang = user?.lang ?? 'uz';
      const loc =
        session?.lat && session?.lon
          ? { lat: session.lat, lon: session.lon }
          : null;
      if (loc) {
        const { text, keyboard } = await this.buildNearbyContent(
          loc.lat,
          loc.lon,
          page,
          sort,
          lang,
        );
        await this.editMessage(chatId, messageId, text, {
          inline_keyboard: keyboard,
        });
      }
      await this.answerCallback(callbackQuery.id);
      return;
    }

    // ── Shop products: sp:SHOP_ID:PAGE ──────────────────────────────────────
    if (data.startsWith('sp:')) {
      const [, shopIdStr, pgStr] = data.split(':');
      const shopId = parseInt(shopIdStr, 10);
      const page = parseInt(pgStr ?? '0', 10) || 0;
      if (shopId)
        await this.renderShopProducts(chatId, shopId, page, messageId);
      await this.answerCallback(callbackQuery.id);
      return;
    }

    // ── Add to cart: add:SP_ID ──────────────────────────────────────────────
    if (data.startsWith('add:')) {
      const spId = parseInt(data.split(':')[1], 10);
      const toast = await this.handleAddToCart(chatId, spId, messageId);
      await this.answerCallback(callbackQuery.id, toast);
      return;
    }

    // ── Cart confirm-clear then add: cart_ok:SP_ID ──────────────────────────
    if (data.startsWith('cart_ok:')) {
      const spId = parseInt(data.split(':')[1], 10);
      await this.setCart(chatId, []);
      const toast = await this.handleAddToCart(chatId, spId, messageId);
      await this.answerCallback(callbackQuery.id, toast);
      return;
    }

    // ── Cart qty increment: inc:SP_ID ───────────────────────────────────────
    if (data.startsWith('inc:')) {
      const spId = parseInt(data.split(':')[1], 10);
      const session = await this.getSession(chatId);
      const cart = this.parseCart(session?.cart);
      const idx = cart.findIndex((c) => c.shop_product_id === spId);
      if (idx >= 0) {
        const sp = await this.prisma.shopProduct.findUnique({
          where: { id: spId },
          select: { count: true },
        });
        if (sp && cart[idx].count < sp.count) cart[idx].count++;
        await this.setCart(chatId, cart);
      }
      await this.cmdCart(chatId, messageId);
      await this.answerCallback(callbackQuery.id);
      return;
    }

    // ── Cart qty decrement: dec:SP_ID ───────────────────────────────────────
    if (data.startsWith('dec:')) {
      const spId = parseInt(data.split(':')[1], 10);
      const session = await this.getSession(chatId);
      const cart = this.parseCart(session?.cart);
      const idx = cart.findIndex((c) => c.shop_product_id === spId);
      if (idx >= 0) {
        if (cart[idx].count > 1) cart[idx].count--;
        else cart.splice(idx, 1);
        await this.setCart(chatId, cart);
      }
      await this.cmdCart(chatId, messageId);
      await this.answerCallback(callbackQuery.id);
      return;
    }

    // ── Clear cart ──────────────────────────────────────────────────────────
    if (data === 'clrcart') {
      await this.setCart(chatId, []);
      const user = await this.prisma.user.findFirst({
        where: { chat_id: chatId },
      });
      const lang = user?.lang ?? 'uz';
      await this.editMessage(
        chatId,
        messageId,
        lang === 'ru' ? '🗑 Корзина очищена.' : '🗑 Savat tozalandi.',
        {
          inline_keyboard: [
            [
              {
                text: lang === 'ru' ? '🔍 Найти товары' : '🔍 Tovar qidirish',
                callback_data: 'search_prod',
              },
            ],
          ],
        },
      );
      await this.answerCallback(callbackQuery.id);
      return;
    }

    // ── View cart ───────────────────────────────────────────────────────────
    if (data === 'view_cart') {
      await this.cmdCart(chatId, messageId);
      await this.answerCallback(callbackQuery.id);
      return;
    }

    // ── Checkout: step 1 delivery type ──────────────────────────────────────
    if (data === 'checkout') {
      await this.cmdCheckout(chatId, messageId);
      await this.answerCallback(callbackQuery.id);
      return;
    }
    if (data.startsWith('chkdel:')) {
      await this.handleCheckoutDelivery(
        chatId,
        messageId,
        data.split(':')[1] as 'MARKET' | 'YANDEX',
      );
      await this.answerCallback(callbackQuery.id);
      return;
    }
    // ── Checkout: step 2 payment type ───────────────────────────────────────
    if (data.startsWith('chkpay:')) {
      await this.handleCheckoutPayment(chatId, messageId, data.split(':')[1]);
      await this.answerCallback(callbackQuery.id);
      return;
    }
    // ── Checkout: confirm / cancel ───────────────────────────────────────────
    if (data === 'confirm_order') {
      await this.createOrderFromBot(chatId, messageId);
      await this.answerCallback(callbackQuery.id);
      return;
    }
    if (data === 'cancel_order') {
      const user = await this.prisma.user.findFirst({
        where: { chat_id: chatId },
      });
      const lang = user?.lang ?? 'uz';
      await this.editMessage(
        chatId,
        messageId,
        lang === 'ru'
          ? '❌ Заказ отменён. Корзина сохранена.'
          : '❌ Buyurtma bekor qilindi. Savat saqlab qolindi.',
        {
          inline_keyboard: [
            [
              {
                text: lang === 'ru' ? '🛒 Корзина' : '🛒 Savat',
                callback_data: 'view_cart',
              },
            ],
          ],
        },
      );
      await this.answerCallback(callbackQuery.id);
      return;
    }

    // ── Search type selection ────────────────────────────────────────────────
    if (data === 'search_shop' || data === 'search_prod') {
      const user = await this.prisma.user.findFirst({
        where: { chat_id: chatId },
      });
      const lang = user?.lang ?? 'uz';
      const isShop = data === 'search_shop';
      await this.upsertSession(chatId, {
        state: isShop ? 'waiting_search_shop' : 'waiting_search_product',
      });
      const prompt = isShop
        ? lang === 'ru'
          ? '🏪 Введите название магазина:'
          : "🏪 Do'kon nomini yozing:"
        : lang === 'ru'
          ? '📦 Введите название товара:'
          : '📦 Tovar nomini yozing:';
      await this.editMessage(chatId, messageId, prompt, {
        inline_keyboard: [],
      });
      await this.answerCallback(callbackQuery.id);
      return;
    }

    // ── Language switch ──────────────────────────────────────────────────────
    if (data === 'lang_uz' || data === 'lang_ru') {
      const lang = data.replace('lang_', '');
      const user = await this.prisma.user.findFirst({
        where: { chat_id: chatId },
      });
      if (user)
        await this.prisma.user.update({
          where: { id: user.id },
          data: { lang },
        });
      const text =
        lang === 'ru'
          ? '✅ Язык изменён на <b>Русский</b> 🇷🇺'
          : "✅ Til <b>O'zbek</b> ga o'zgartirildi 🇺🇿";
      await this.reply(chatId, text);
      // Update bot menu commands for this specific chat
      const cmds = lang === 'ru' ? STORE_BOT_COMMANDS_RU : STORE_BOT_COMMANDS;
      try {
        await axios.post(
          `https://api.telegram.org/bot${this.token}/setMyCommands`,
          { commands: cmds, scope: { type: 'chat', chat_id: chatId } },
          { timeout: 8000 },
        );
      } catch {}
      await this.answerCallback(callbackQuery.id);
      return;
    }

    await this.answerCallback(callbackQuery.id);
  }

  // ─── Add-to-cart helper ────────────────────────────────────────────────────

  private async handleAddToCart(
    chatId: string,
    spId: number,
    msgId?: number,
  ): Promise<string> {
    const [session, sp] = await Promise.all([
      this.getSession(chatId),
      this.prisma.shopProduct.findUnique({
        where: { id: spId },
        select: {
          id: true,
          price: true,
          count: true,
          shop: { select: { id: true, name: true } },
          product_item: {
            select: {
              name: true,
              product: { select: { name: true, name_uz: true, name_ru: true } },
            },
          },
        },
      }),
    ]);

    if (!sp?.shop) return '❌ Tovar topilmadi';
    const cart = this.parseCart(session?.cart);
    const shopId = sp.shop.id;
    const shopName = sp.shop.name ?? '—';
    const pname =
      sp.product_item?.name ??
      sp.product_item?.product?.name_uz ??
      sp.product_item?.product?.name ??
      '—';

    // Different shop in cart → ask to clear
    if (cart.length > 0 && cart[0].shop_id !== shopId) {
      const user = await this.prisma.user.findFirst({
        where: { chat_id: chatId },
      });
      const lang = user?.lang ?? 'uz';
      const text =
        lang === 'ru'
          ? `⚠️ В корзине товары из <b>${cart[0].shop_name}</b>.\nОчистить и добавить из <b>${shopName}</b>?`
          : `⚠️ Savatingizda <b>${cart[0].shop_name}</b> dan tovarlar bor.\n<b>${shopName}</b> dan qo'shish uchun savatni tozalaymizmi?`;
      if (msgId) {
        await this.editMessage(chatId, msgId, text, {
          inline_keyboard: [
            [
              {
                text: lang === 'ru' ? '✅ Ha, tozala' : '✅ Ha, tozala',
                callback_data: `cart_ok:${spId}`,
              },
              { text: "❌ Yo'q", callback_data: 'noop' },
            ],
          ],
        });
      }
      return lang === 'ru' ? '⚠️ Разные магазины!' : "⚠️ Boshqa do'kon!";
    }

    const existing = cart.find((c) => c.shop_product_id === spId);
    if (existing) {
      if (existing.count < (sp.count ?? 99)) existing.count++;
      await this.setCart(chatId, cart);
      return `✅ ${pname} (${existing.count} ta)`;
    }

    cart.push({
      shop_product_id: spId,
      name: pname,
      price: sp.price ?? 0,
      count: 1,
      shop_id: shopId,
      shop_name: shopName,
    });
    await this.setCart(chatId, cart);
    return `✅ Qo'shildi: ${pname}`;
  }

  // ─── Pagination ────────────────────────────────────────────────────────────

  /** Numbered page buttons row: ·N· = current, « = fast-back, » = fast-forward */
  private buildPageRow(
    totalPages: number,
    current: number,
    cbOf: (p: number) => string,
  ): any[] {
    if (totalPages <= 1) return [];
    const MAX = 5;
    let lo = Math.max(0, current - 2);
    let hi = Math.min(totalPages - 1, lo + MAX - 1);
    if (hi - lo < MAX - 1) lo = Math.max(0, hi - MAX + 1);

    const row: any[] = [];
    if (lo > 0) row.push({ text: '«', callback_data: cbOf(0) });
    for (let p = lo; p <= hi; p++) {
      row.push({
        text: p === current ? `·${p + 1}·` : `${p + 1}`,
        callback_data: cbOf(p),
      });
    }
    if (hi < totalPages - 1)
      row.push({ text: '»', callback_data: cbOf(totalPages - 1) });
    return row;
  }

  // ─── Cart helpers ──────────────────────────────────────────────────────────

  private parseCart(cartJson?: string | null): CartItem[] {
    if (!cartJson) return [];
    try {
      return JSON.parse(cartJson);
    } catch {
      return [];
    }
  }

  private async setCart(chatId: string, items: CartItem[]) {
    return this.upsertSession(chatId, {
      cart: items.length ? JSON.stringify(items) : null,
    });
  }

  // ─── Session helpers (DB-backed) ────────────────────────────────────────────

  private async getSession(chatId: string) {
    return this.prisma.botSession.findUnique({ where: { chat_id: chatId } });
  }

  private async upsertSession(
    chatId: string,
    data: Partial<{
      state: string;
      sms_id: string | null;
      phone: string | null;
      lat: number | null;
      lon: number | null;
      shop_q: string | null;
      prod_q: string | null;
      cart: string | null;
      chk: string | null;
    }>,
  ) {
    return this.prisma.botSession.upsert({
      where: { chat_id: chatId },
      update: data,
      create: { chat_id: chatId, ...data },
    });
  }

  private async clearState(chatId: string) {
    return this.prisma.botSession.upsert({
      where: { chat_id: chatId },
      update: { state: 'idle', sms_id: null, phone: null },
      create: { chat_id: chatId, state: 'idle' },
    });
  }

  /** Edit a photo message (media + caption + keyboard); falls back to editMessageText if needed */
  private async editTgMedia(
    chatId: string,
    msgId: number,
    photo: string,
    caption: string,
    keyboard: any[][],
  ) {
    try {
      await axios.post(
        `https://api.telegram.org/bot${this.token}/editMessageMedia`,
        {
          chat_id: chatId,
          message_id: msgId,
          media: { type: 'photo', media: photo, caption, parse_mode: 'HTML' },
          reply_markup: { inline_keyboard: keyboard },
        },
        { timeout: 15000 },
      );
    } catch {
      await this.editMessage(chatId, msgId, caption, {
        inline_keyboard: keyboard,
      });
    }
  }

  // ─── Image URL helper ──────────────────────────────────────────────────────

  private imgUrl(path: string | null | undefined): string | null {
    if (!path?.trim()) return null;
    if (path.startsWith('http')) return path;
    return `${this.IMG_BASE}/${path}`;
  }

  /** sendPhoto via Bot API; falls back to sendMessage if photo fails */
  private async sendTgPhoto(
    chatId: string,
    photo: string,
    caption: string,
    replyMarkup?: any,
  ): Promise<void> {
    try {
      await axios.post(
        `https://api.telegram.org/bot${this.token}/sendPhoto`,
        {
          chat_id: chatId,
          photo,
          caption,
          parse_mode: 'HTML',
          reply_markup: replyMarkup ?? null,
        },
        { timeout: 15000 },
      );
    } catch {
      if (replyMarkup) {
        await this.sendMessage(chatId, caption, {
          inline_keyboard: replyMarkup.inline_keyboard,
        });
      } else {
        await this.reply(chatId, caption);
      }
    }
  }

  // ─── Haversine ─────────────────────────────────────────────────────────────

  private haversine(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // ─── Product name helper ───────────────────────────────────────────────────

  private getProductName(sp: any, lang: string): string {
    return (
      (lang === 'ru'
        ? sp.product_item?.product?.name_ru
        : sp.product_item?.product?.name_uz) ??
      sp.product_item?.name ??
      sp.product_item?.product?.name ??
      '—'
    );
  }

  // ─── Order-status notifications (called from OrderService) ─────────────────

  async notifyUserNewOrder(order: any) {
    const chatId = order.user?.chat_id;
    if (!chatId) return;
    const lang = order.user?.lang ?? 'uz';
    const shop = order.shop;
    const amount = (order.amount ?? 0).toLocaleString('ru-RU');
    if ((order.delivery_type ?? '') === 'MARKET') {
      const text =
        lang === 'ru'
          ? `✅ <b>Заказ #${order.id} принят!</b>\n🏪 ${shop?.name ?? '—'}\n💰 ${amount} сум\n\n🛒 Самовывоз\n📍 ${shop?.address ?? '—'}\n\n/orders`
          : `✅ <b>#${order.id} buyurtmangiz qabul qilindi!</b>\n🏪 ${shop?.name ?? '—'}\n💰 ${amount} so'm\n\n🛒 Olib ketish\n📍 ${shop?.address ?? '—'}\n\n/orders`;
      await this.reply(chatId, text);
      if (shop?.lat && shop?.lon)
        await this.sendLocation(chatId, shop.lat, shop.lon);
    } else {
      const text =
        lang === 'ru'
          ? `✅ <b>Заказ #${order.id} принят!</b>\n🏪 ${shop?.name ?? '—'}\n💰 ${amount} сум\n\n🚚 Доставка\n📍 ${order.address ?? '—'}\n⏰ В течение 24 часов\n\n/orders`
          : `✅ <b>#${order.id} buyurtmangiz qabul qilindi!</b>\n🏪 ${shop?.name ?? '—'}\n💰 ${amount} so'm\n\n🚚 Yetkazib berish\n📍 ${order.address ?? '—'}\n⏰ 24 soat ichida\n\n/orders`;
      await this.reply(chatId, text);
      if (order.lat && order.lon)
        await this.sendLocation(chatId, order.lat, order.lon);
    }
  }

  async notifyUserOrderFinished(order: any) {
    const chatId = await this.getChatIdByOrder(order);
    if (!chatId) return;
    const lang = await this.getUserLang(order);
    const text =
      lang === 'ru'
        ? `🏁 <b>Заказ #${order.id} завершён.</b>\nПодтвердите получение через /orders`
        : `🏁 <b>#${order.id} buyurtmangiz tugatildi.</b>\nQabul qilganingizni tasdiqlang: /orders`;
    await this.reply(chatId, text);
  }

  async notifyUserOrderConfirmed(order: any) {
    const chatId = await this.getChatIdByOrder(order);
    if (!chatId) return;
    const lang = await this.getUserLang(order);
    const text =
      lang === 'ru'
        ? `🎉 <b>Заказ #${order.id} подтверждён!</b>\nСпасибо за покупку в Diametr.uz`
        : `🎉 <b>#${order.id} buyurtmangiz tasdiqlandi!</b>\nDiametr.uz dan xarid qilganingiz uchun rahmat`;
    await this.reply(chatId, text);
  }

  async notifyUserOrderCanceled(order: any) {
    const chatId = await this.getChatIdByOrder(order);
    if (!chatId) return;
    const lang = await this.getUserLang(order);
    const text =
      lang === 'ru'
        ? `❌ <b>Заказ #${order.id} отменён.</b>`
        : `❌ <b>#${order.id} buyurtmangiz bekor qilindi.</b>`;
    await this.reply(chatId, text);
  }

  private async getChatIdByOrder(order: any): Promise<string | null> {
    if (order.user?.chat_id) return order.user.chat_id;
    if (!order.user_id) return null;
    const user = await this.prisma.user.findUnique({
      where: { id: order.user_id },
    });
    return user?.chat_id ?? null;
  }

  private async getUserLang(order: any): Promise<string> {
    if (order.user?.lang) return order.user.lang;
    if (!order.user_id) return 'uz';
    const user = await this.prisma.user.findUnique({
      where: { id: order.user_id },
    });
    return user?.lang ?? 'uz';
  }

  private async generateToken(user: any): Promise<string> {
    return this.jwtService.signAsync(
      { user_id: user.id, role: user.role, source: 'STORE_BOT' },
      { expiresIn: '2h' },
    );
  }

  // ─── Telegram API helpers ──────────────────────────────────────────────────

  private async sendLocation(chatId: string, lat: number, lon: number) {
    try {
      await axios.post(
        `https://api.telegram.org/bot${this.token}/sendLocation`,
        { chat_id: chatId, latitude: lat, longitude: lon },
        { timeout: 8000 },
      );
    } catch (e: any) {
      this.logger.error(`sendLocation error: ${e?.message}`);
    }
  }

  private async answerCallback(callbackQueryId: string, text?: string) {
    await axios
      .post(
        `https://api.telegram.org/bot${this.token}/answerCallbackQuery`,
        {
          callback_query_id: callbackQueryId,
          ...(text ? { text, show_alert: false } : {}),
        },
        { timeout: 5000 },
      )
      .catch(() => {});
  }

  private async editMessage(
    chatId: string,
    messageId: number,
    text: string,
    replyMarkup?: any,
  ) {
    try {
      await axios.post(
        `https://api.telegram.org/bot${this.token}/editMessageText`,
        {
          chat_id: chatId,
          message_id: messageId,
          text,
          parse_mode: 'HTML',
          reply_markup: replyMarkup,
        },
        { timeout: 8000 },
      );
    } catch (e: any) {
      this.logger.error(`editMessage error: ${e?.message}`);
    }
  }

  private async reply(chatId: string, text: string) {
    try {
      await axios.post(
        `https://api.telegram.org/bot${this.token}/sendMessage`,
        { chat_id: chatId, text, parse_mode: 'HTML' },
        { timeout: 8000 },
      );
    } catch (e: any) {
      this.logger.error(`reply error: ${e?.message}`);
    }
  }

  private async sendMessage(chatId: string, text: string, replyMarkup: any) {
    try {
      await axios.post(
        `https://api.telegram.org/bot${this.token}/sendMessage`,
        {
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
          reply_markup: replyMarkup,
        },
        { timeout: 8000 },
      );
    } catch (e: any) {
      this.logger.error(`sendMessage error: ${e?.message}`);
    }
  }
}
