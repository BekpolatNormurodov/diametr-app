import { createContext, useContext, useEffect, useMemo, useState } from "react";

/**
 * Dashboard i18n — mirrors the customer site's AppContext (useLang).
 *
 * Storage:
 * - localStorage key `diametr_admin_lang` → "uz" | "ru"
 * - defaults to "uz"
 *
 * Usage:
 *   const { lang, setLang, t } = useLang();
 *   <Label>{t("Tavsif", "Описание")}</Label>
 *
 * The two-argument `t(uz, ru)` form keeps the strings next to their usage
 * site — no separate JSON files to sync — and yet is easy to grep for
 * ("what still needs Russian?"). A key-based variant `t.k("desc")` reads from
 * the DICT below when we want the same wording reused in many places.
 */

export type Lang = "uz" | "ru";

const STORAGE_KEY = "diametr_admin_lang";

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Inline translation: t("Tavsif", "Описание") → current-lang string. */
  t: TFn;
}

interface TFn {
  (uz: string, ru: string): string;
  /** Key-based lookup from DICT — for repeated labels. */
  k: (key: keyof typeof DICT) => string;
}

const DICT = {
  // Sidebar / navigation
  dashboard: { uz: "Boshqaruv", ru: "Панель" },
  categories: { uz: "Kategoriyalar", ru: "Категории" },
  products: { uz: "Mahsulotlar", ru: "Товары" },
  shops: { uz: "Do'konlar", ru: "Магазины" },
  workers: { uz: "Ustalar", ru: "Мастера" },
  ads: { uz: "Reklamalar", ru: "Реклама" },
  news: { uz: "Yangiliklar", ru: "Новости" },
  users: { uz: "Foydalanuvchilar", ru: "Пользователи" },
  admins: { uz: "Administratorlar", ru: "Администраторы" },
  regions: { uz: "Hududlar", ru: "Регионы" },
  services: { uz: "Xizmatlar", ru: "Услуги" },
  payments: { uz: "To'lovlar", ru: "Платежи" },
  sales: { uz: "Sotuv", ru: "Продажи" },
  promoCodes: { uz: "Promo kodlar", ru: "Промокоды" },
  unitTypes: { uz: "O'lchov birliklari", ru: "Единицы измерения" },
  // Common actions
  add: { uz: "Qo'shish", ru: "Добавить" },
  edit: { uz: "Tahrirlash", ru: "Редактировать" },
  delete: { uz: "O'chirish", ru: "Удалить" },
  save: { uz: "Saqlash", ru: "Сохранить" },
  cancel: { uz: "Bekor qilish", ru: "Отмена" },
  search: { uz: "Qidirish", ru: "Поиск" },
  export: { uz: "Yuklab olish", ru: "Экспорт" },
  refresh: { uz: "Yangilash", ru: "Обновить" },
  // Common labels
  name: { uz: "Nomi", ru: "Название" },
  nameUz: { uz: "Nomi (UZ)", ru: "Название (UZ)" },
  nameRu: { uz: "Nomi (RU)", ru: "Название (RU)" },
  desc: { uz: "Tavsif", ru: "Описание" },
  descUz: { uz: "Tavsif (UZ)", ru: "Описание (UZ)" },
  descRu: { uz: "Tavsif (RU)", ru: "Описание (RU)" },
  image: { uz: "Rasm", ru: "Изображение" },
  category: { uz: "Kategoriya", ru: "Категория" },
  price: { uz: "Narx", ru: "Цена" },
  count: { uz: "Soni", ru: "Количество" },
  status: { uz: "Holat", ru: "Статус" },
  optional: { uz: "ixtiyoriy", ru: "необязательно" },
  required: { uz: "majburiy", ru: "обязательно" },
  loading: { uz: "Yuklanmoqda...", ru: "Загрузка..." },
  noData: { uz: "Ma'lumot yo'q", ru: "Нет данных" },
  actions: { uz: "Amallar", ru: "Действия" },
  page: { uz: "Sahifa", ru: "Страница" },
  previous: { uz: "Oldingi", ru: "Предыдущая" },
  next: { uz: "Keyingi", ru: "Следующая" },
  home: { uz: "Bosh sahifa", ru: "Главная" },
  // Products page + productsTable
  addProduct: { uz: "Mahsulot qo'shish", ru: "Добавить товар" },
  addUnitType: { uz: "O'lchov birligi qo'shish", ru: "Добавить единицу измерения" },
  searchPh: { uz: "Qidirish...", ru: "Поиск..." },
  all: { uz: "Hammasi", ru: "Все" },
  variantless: { uz: "Variantsiz", ru: "Без вариантов" },
  showN: { uz: "Ko'rsatish", ru: "Показать" },
  group: { uz: "Guruhla", ru: "Группировать" },
  ungroup: { uz: "Guruhdan chiqar", ru: "Разгруппировать" },
  photo: { uz: "Rasm", ru: "Фото" },
  unit: { uz: "O'lchov", ru: "Единица" },
  variants: { uz: "Variantlar", ru: "Варианты" },
  createdAt: { uz: "Yaratilgan", ru: "Создан" },
  noVariantNotSellable: { uz: "Variant yo'q — sotib bo'lmaydi", ru: "Нет варианта — нельзя купить" },
  addStandardVariant: { uz: "Standart", ru: "Стандарт" },
  editProduct: { uz: "Mahsulotni tahrirlash", ru: "Редактировать товар" },
  createProduct: { uz: "Yangi mahsulot", ru: "Новый товар" },
  addVariant: { uz: "Variant qo'shish", ru: "Добавить вариант" },
  editVariant: { uz: "Variantni tahrirlash", ru: "Редактировать вариант" },
  variantName: { uz: "Variant nomi", ru: "Название варианта" },
  color: { uz: "Rang", ru: "Цвет" },
  size: { uz: "O'lcham", ru: "Размер" },
  value: { uz: "Qiymati", ru: "Значение" },
  optional_short: { uz: "ixtiyoriy", ru: "необязательно" },
  saving: { uz: "Saqlanmoqda...", ru: "Сохранение..." },
  deleteConfirm: { uz: "O'chirishni tasdiqlaysizmi?", ru: "Подтверждаете удаление?" },
  // Category
  addCategory: { uz: "Kategoriya qo'shish", ru: "Добавить категорию" },
  editCategory: { uz: "Kategoriyani tahrirlash", ru: "Редактировать категорию" },
  categoriesTitle: { uz: "Kategoriyalar", ru: "Категории" },
  // Shop
  addShop: { uz: "Do'kon qo'shish", ru: "Добавить магазин" },
  editShop: { uz: "Do'konni tahrirlash", ru: "Редактировать магазин" },
  address: { uz: "Manzil", ru: "Адрес" },
  balance: { uz: "Balans", ru: "Баланс" },
  phone: { uz: "Telefon", ru: "Телефон" },
  region: { uz: "Hudud", ru: "Регион" },
  // Order / Sales
  order: { uz: "Buyurtma", ru: "Заказ" },
  orderList: { uz: "Buyurtmalar", ru: "Заказы" },
  amount: { uz: "Summa", ru: "Сумма" },
  deliveryType: { uz: "Yetkazish turi", ru: "Тип доставки" },
  finished: { uz: "Yakunlangan", ru: "Завершён" },
  new_: { uz: "Yangi", ru: "Новый" },
  processing: { uz: "Jarayonda", ru: "В процессе" },
  cancelled: { uz: "Bekor qilingan", ru: "Отменён" },
  // Ad
  addAd: { uz: "Reklama qo'shish", ru: "Добавить рекламу" },
  editAd: { uz: "Reklamani tahrirlash", ru: "Редактировать рекламу" },
  title: { uz: "Sarlavha", ru: "Заголовок" },
  titleUz: { uz: "Sarlavha (UZ)", ru: "Заголовок (UZ)" },
  titleRu: { uz: "Sarlavha (RU)", ru: "Заголовок (RU)" },
  subtitle: { uz: "Tavsif", ru: "Подзаголовок" },
  subtitleUz: { uz: "Tavsif (UZ)", ru: "Подзаголовок (UZ)" },
  subtitleRu: { uz: "Tavsif (RU)", ru: "Подзаголовок (RU)" },
  expiration: { uz: "Muddat", ru: "Срок" },
  type: { uz: "Tur", ru: "Тип" },
  target: { uz: "Manzil", ru: "Ссылка" },
  // News
  addNews: { uz: "Yangilik qo'shish", ru: "Добавить новость" },
  editNews: { uz: "Yangilikni tahrirlash", ru: "Редактировать новость" },
  // User
  usersTitle: { uz: "Foydalanuvchilar", ru: "Пользователи" },
  fullname: { uz: "To'liq ismi", ru: "Полное имя" },
  role: { uz: "Rol", ru: "Роль" },
  // Admin
  addAdmin: { uz: "Admin qo'shish", ru: "Добавить администратора" },
  editAdmin: { uz: "Adminni tahrirlash", ru: "Редактировать администратора" },
  login: { uz: "Login", ru: "Логин" },
  password: { uz: "Parol", ru: "Пароль" },
  // Region
  addRegion: { uz: "Hudud qo'shish", ru: "Добавить регион" },
  editRegion: { uz: "Hududni tahrirlash", ru: "Редактировать регион" },
  // Service
  addService: { uz: "Xizmat qo'shish", ru: "Добавить услугу" },
  editService: { uz: "Xizmatni tahrirlash", ru: "Редактировать услугу" },
  // Worker
  addWorker: { uz: "Usta qo'shish", ru: "Добавить мастера" },
  editWorker: { uz: "Ustani tahrirlash", ru: "Редактировать мастера" },
  // Payment
  addPayment: { uz: "To'lov qo'shish", ru: "Добавить платёж" },
  editPayment: { uz: "To'lovni tahrirlash", ru: "Редактировать платёж" },
  // Promo
  addPromo: { uz: "Promo kod qo'shish", ru: "Добавить промокод" },
  editPromo: { uz: "Promo kodni tahrirlash", ru: "Редактировать промокод" },
  code: { uz: "Kod", ru: "Код" },
  discount: { uz: "Chegirma", ru: "Скидка" },
  // Unit type
  unitTypesTitle: { uz: "O'lchov birliklari", ru: "Единицы измерения" },
  symbol: { uz: "Belgi", ru: "Символ" },
  // Analytics / dashboard home
  analytics: { uz: "Analitika", ru: "Аналитика" },
  overview: { uz: "Umumiy ko'rinish", ru: "Обзор" },
  total: { uz: "Jami", ru: "Всего" },
  today: { uz: "Bugun", ru: "Сегодня" },
  yesterday: { uz: "Kecha", ru: "Вчера" },
  thisMonth: { uz: "Bu oy", ru: "Этот месяц" },
  // Subscription
  subscriptionsTitle: { uz: "Obunalar", ru: "Подписки" },
  active: { uz: "Faol", ru: "Активно" },
  expired: { uz: "Muddati tugagan", ru: "Истёк срок" },
  blocked: { uz: "Bloklangan", ru: "Заблокирован" },
  // shop_admin extras
  stock: { uz: "Zaxira", ru: "Остаток" },
  stockValue: { uz: "Umumiy qiymati", ru: "Общая стоимость" },
  soldItems: { uz: "Sotilgan", ru: "Продано" },
  lowStock: { uz: "Kam qolgan", ru: "Мало осталось" },
  outOfStock: { uz: "Tugagan", ru: "Закончилось" },
  shopProducts: { uz: "Do'kon Tovarlar", ru: "Товары магазина" },
  // Fallbacks
  yes: { uz: "Ha", ru: "Да" },
  no: { uz: "Yo'q", ru: "Нет" },
} as const;

// TypeScript sees `home` twice above — the second literal wins at runtime but
// the type checker treats the earlier one as duplicate. Remove any duplicate
// keys before compile. NOTE: keep this file in sync with shop_admin's copy —
// same DICT keys let the same `t.k('...')` call work in both apps.

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === "ru" ? "ru" : "uz";
    } catch {
      return "uz";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.setAttribute("lang", lang);
    } catch { /* private mode etc. */ }
  }, [lang]);

  const t = useMemo(() => {
    const fn = ((uz: string, ru: string) => (lang === "ru" ? ru : uz)) as TFn;
    fn.k = (key) => (lang === "ru" ? DICT[key].ru : DICT[key].uz);
    return fn;
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang: setLangState, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) {
    // Fallback so a component that renders outside the provider (unit test,
    // stray stub) still gets a working `t` — always returns Uzbek strings.
    const fn = ((uz: string, _ru: string) => uz) as unknown as TFn;
    fn.k = (key) => DICT[key].uz;
    return { lang: "uz", setLang: () => undefined, t: fn };
  }
  return ctx;
}
