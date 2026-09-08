/**
 * Small, dependency-free i18n for API error messages.
 *
 * The API used to return raw class-validator / English strings like
 * "amount must not be less than 1000". This maps them to human, localized text.
 * Language comes from the `accept-language` header; anything that is not clearly
 * Russian falls back to Uzbek (uz) — the default.
 */
export type Lang = 'uz' | 'ru';

/** Resolve a request language. Null/unknown → 'uz'. */
export function resolveLang(header?: string | null): Lang {
  const v = (header ?? '').toLowerCase();
  if (v.startsWith('ru')) return 'ru';
  return 'uz'; // default
}

// ── Field names ──────────────────────────────────────────────────────────────
const FIELDS: Record<string, { uz: string; ru: string }> = {
  amount: { uz: 'Summa', ru: 'Сумма' },
  price: { uz: 'Narx', ru: 'Цена' },
  bonus_price: { uz: 'Chegirma narxi', ru: 'Цена со скидкой' },
  count: { uz: 'Soni', ru: 'Количество' },
  shop_id: { uz: "Do'kon", ru: 'Магазин' },
  worker_id: { uz: 'Ishchi', ru: 'Работник' },
  ad_id: { uz: 'Reklama', ru: 'Реклама' },
  product_id: { uz: 'Mahsulot', ru: 'Товар' },
  category_id: { uz: 'Kategoriya', ru: 'Категория' },
  service_id: { uz: 'Xizmat', ru: 'Услуга' },
  region_id: { uz: 'Hudud', ru: 'Регион' },
  unit_type_id: { uz: "O'lchov birligi", ru: 'Единица измерения' },
  phone: { uz: 'Telefon raqami', ru: 'Номер телефона' },
  login: { uz: 'Login', ru: 'Логин' },
  password: { uz: 'Parol', ru: 'Пароль' },
  code: { uz: 'Kod', ru: 'Код' },
  email: { uz: 'Email', ru: 'Email' },
  name: { uz: 'Nomi', ru: 'Название' },
  name_uz: { uz: 'Nomi (uz)', ru: 'Название (uz)' },
  name_ru: { uz: 'Nomi (ru)', ru: 'Название (ru)' },
  title: { uz: 'Sarlavha', ru: 'Заголовок' },
  desc: { uz: 'Tavsif', ru: 'Описание' },
  address: { uz: 'Manzil', ru: 'Адрес' },
  image: { uz: 'Rasm', ru: 'Изображение' },
  type: { uz: 'Turi', ru: 'Тип' },
  status: { uz: 'Holati', ru: 'Статус' },
  start_date: { uz: 'Boshlanish sanasi', ru: 'Дата начала' },
  end_date: { uz: 'Tugash sanasi', ru: 'Дата окончания' },
  expired: { uz: 'Amal qilish muddati', ru: 'Срок действия' },
  months: { uz: 'Oylar soni', ru: 'Количество месяцев' },
  free_trial_months: { uz: 'Bepul davr (oy)', ru: 'Бесплатный период (мес.)' },
  subscription_price: { uz: 'Obuna narxi', ru: 'Цена подписки' },
  lat: { uz: 'Kenglik', ru: 'Широта' },
  lon: { uz: 'Uzunlik', ru: 'Долгота' },
  inn: { uz: 'INN', ru: 'ИНН' },
  note: { uz: 'Izoh', ru: 'Примечание' },
  auto_payment: { uz: "Avto to'lov", ru: 'Автооплата' },
  delivery_amount: { uz: 'Yetkazib berish narxi', ru: 'Стоимость доставки' },
  promo_code: { uz: 'Promo kod', ru: 'Промокод' },
};

function fieldName(field: string, lang: Lang): string {
  const f = FIELDS[field];
  if (f) return f[lang];
  // Unknown field: humanize the raw key (snake_case → words).
  return field.replace(/_/g, ' ');
}

// ── Validation messages, keyed by class-validator constraint name ────────────
type Builder = (field: string, args: string[], lang: Lang) => string;

const VALIDATION: Record<string, { uz: Builder; ru: Builder }> = {
  isNotEmpty: {
    uz: (f) => `${f} to'ldirilishi shart`,
    ru: (f) => `Поле «${f}» обязательно для заполнения`,
  },
  isDefined: {
    uz: (f) => `${f} kiritilishi shart`,
    ru: (f) => `Поле «${f}» обязательно`,
  },
  min: {
    uz: (f, a) => (a[0] ? `${f} ${a[0]} dan kichik bo'lmasligi kerak` : `${f} juda kichik`),
    ru: (f, a) => (a[0] ? `${f} не может быть меньше ${a[0]}` : `${f} слишком мало`),
  },
  max: {
    uz: (f, a) => (a[0] ? `${f} ${a[0]} dan katta bo'lmasligi kerak` : `${f} juda katta`),
    ru: (f, a) => (a[0] ? `${f} не может быть больше ${a[0]}` : `${f} слишком велико`),
  },
  isNumber: {
    uz: (f) => `${f} raqam bo'lishi kerak`,
    ru: (f) => `${f} должно быть числом`,
  },
  isInt: {
    uz: (f) => `${f} butun son bo'lishi kerak`,
    ru: (f) => `${f} должно быть целым числом`,
  },
  isString: {
    uz: (f) => `${f} matn bo'lishi kerak`,
    ru: (f) => `${f} должно быть текстом`,
  },
  isBoolean: {
    uz: (f) => `${f} ha/yo'q qiymati bo'lishi kerak`,
    ru: (f) => `${f} должно быть да/нет`,
  },
  isEmail: {
    uz: (f) => `${f} noto'g'ri kiritilgan`,
    ru: (f) => `Неверный ${f}`,
  },
  isEnum: {
    uz: (f) => `${f} uchun noto'g'ri qiymat tanlandi`,
    ru: (f) => `Недопустимое значение для «${f}»`,
  },
  isDate: {
    uz: (f) => `${f} noto'g'ri sana formatida`,
    ru: (f) => `${f} в неверном формате даты`,
  },
  isDateString: {
    uz: (f) => `${f} noto'g'ri sana formatida`,
    ru: (f) => `${f} в неверном формате даты`,
  },
  minLength: {
    uz: (f, a) => `${f} kamida ${a[0] ?? ''} ta belgidan iborat bo'lishi kerak`.trim(),
    ru: (f, a) => `${f} должно содержать не менее ${a[0] ?? ''} символов`.trim(),
  },
  maxLength: {
    uz: (f, a) => `${f} ${a[0] ?? ''} ta belgidan oshmasligi kerak`.trim(),
    ru: (f, a) => `${f} не должно превышать ${a[0] ?? ''} символов`.trim(),
  },
  length: {
    uz: (f) => `${f} uzunligi noto'g'ri`,
    ru: (f) => `Неверная длина поля «${f}»`,
  },
  isPhoneNumber: {
    uz: (f) => `${f} noto'g'ri kiritilgan`,
    ru: (f) => `Неверный ${f}`,
  },
  matches: {
    uz: (f) => `${f} noto'g'ri formatda`,
    ru: (f) => `${f} в неверном формате`,
  },
  isNumberString: {
    uz: (f) => `${f} raqamlardan iborat bo'lishi kerak`,
    ru: (f) => `${f} должно состоять из цифр`,
  },
};

/**
 * Build a localized message for one class-validator failure.
 * `constraint` is the key (e.g. "min"), `args` are extracted numbers/values.
 */
export function validationMessage(
  field: string,
  constraint: string,
  args: string[],
  lang: Lang,
): string {
  const f = fieldName(field, lang);
  const v = VALIDATION[constraint];
  if (v) return v[lang](f, args, lang);
  // Unknown constraint: safe generic fallback.
  return lang === 'ru' ? `Неверное значение поля «${f}»` : `${f} noto'g'ri kiritilgan`;
}

// ── Known HttpException messages (English in code → localized) ────────────────
const HTTP_MESSAGES: Record<string, { uz: string; ru: string }> = {
  'shop not found': { uz: "Do'kon topilmadi", ru: 'Магазин не найден' },
  'worker not found': { uz: 'Ishchi topilmadi', ru: 'Работник не найден' },
  'product not found': { uz: 'Mahsulot topilmadi', ru: 'Товар не найден' },
  'productitem not found': { uz: 'Mahsulot varianti topilmadi', ru: 'Вариант товара не найден' },
  'shopproduct not found': { uz: "Do'kon mahsuloti topilmadi", ru: 'Товар магазина не найден' },
  'service not found': { uz: 'Xizmat topilmadi', ru: 'Услуга не найдена' },
  'region not found': { uz: 'Hudud topilmadi', ru: 'Регион не найден' },
  'order not found': { uz: 'Buyurtma topilmadi', ru: 'Заказ не найден' },
  'category not found': { uz: 'Kategoriya topilmadi', ru: 'Категория не найдена' },
  'ad not found': { uz: 'Reklama topilmadi', ru: 'Реклама не найдена' },
  'payment not found': { uz: "To'lov topilmadi", ru: 'Платёж не найден' },
  'news not found': { uz: 'Yangilik topilmadi', ru: 'Новость не найдена' },
  'promo code not found': { uz: 'Promo kod topilmadi', ru: 'Промокод не найден' },
  'admin not found': { uz: 'Admin topilmadi', ru: 'Администратор не найден' },
  'user not found': { uz: 'Foydalanuvchi topilmadi', ru: 'Пользователь не найден' },
  'unittype not found': { uz: "O'lchov birligi topilmadi", ru: 'Единица измерения не найдена' },
  'incorrect credentials': { uz: "Login yoki parol noto'g'ri", ru: 'Неверный логин или пароль' },
  'this phone is used': { uz: 'Bu telefon raqami allaqachon band', ru: 'Этот номер телефона уже используется' },
  'invalid or expired token': { uz: 'Sessiya muddati tugagan, qaytadan kiring', ru: 'Сессия истекла, войдите снова' },
  'store token required': { uz: 'Avtorizatsiya talab qilinadi', ru: 'Требуется авторизация' },
  'access denied': { uz: 'Ruxsat yo`q', ru: 'Доступ запрещён' },
  'order is canceled': { uz: 'Buyurtma bekor qilingan', ru: 'Заказ отменён' },
  'order is already confirmed': { uz: 'Buyurtma allaqachon tasdiqlangan', ru: 'Заказ уже подтверждён' },
  'shop_id is required when type is shop': { uz: "Tur 'do'kon' bo'lganda do'kon tanlanishi shart", ru: 'При типе «магазин» нужно выбрать магазин' },
  'ad_id is required when type is ad': { uz: "Tur 'reklama' bo'lganda reklama tanlanishi shart", ru: 'При типе «реклама» нужно выбрать рекламу' },
  'worker_id is required when type is worker': { uz: "Tur 'ishchi' bo'lganda ishchi tanlanishi shart", ru: 'При типе «работник» нужно выбрать работника' },
  'internal server error': { uz: 'Serverda xatolik yuz berdi', ru: 'Произошла ошибка на сервере' },
  'unauthorized': { uz: 'Avtorizatsiya talab qilinadi', ru: 'Требуется авторизация' },
  'forbidden': { uz: 'Ruxsat yo`q', ru: 'Доступ запрещён' },
  'bad request': { uz: "Noto'g'ri so'rov", ru: 'Неверный запрос' },
};

/** Translate a plain HttpException message. Unknown → returned unchanged. */
export function translateHttpMessage(message: string, lang: Lang): string {
  const hit = HTTP_MESSAGES[message.trim().toLowerCase()];
  return hit ? hit[lang] : message;
}
