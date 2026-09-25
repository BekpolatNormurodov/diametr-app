/**
 * Shop columns that may appear in a PUBLIC response (anonymous or customer):
 * every column except the internal billing ones (balance, expired,
 * auto_payment, inn). Prisma 6.1 has no GA `omit`, so this is an explicit
 * `select`. The site and mobile read only these fields; the shop panel gets
 * its own billing data from /subscription/*, and the SUPER dashboard from
 * /shop/all-admin (or /shop/all and /shop/:id with its SUPER token).
 */
export const SHOP_PUBLIC_SELECT = {
  id: true,
  name: true,
  name_uz: true,
  name_ru: true,
  image: true,
  work_status: true,
  address: true,
  address_ru: true,
  lat: true,
  lon: true,
  delivery_amount: true,
  yandex_delivery: true,
  market_delivery: true,
  fixed_delivery: true,
  region_id: true,
  createdt: true,
  updatedAt: true,
} as const;

/** Shop owner fields a customer may see (mobile shop/cart/status screens). */
export const SHOP_PUBLIC_ADMIN_SELECT = {
  id: true,
  fullname: true,
  phone: true,
  image: true,
} as const;

type PublicShopKey = keyof typeof SHOP_PUBLIC_SELECT;

/**
 * Copies only the public columns of an already loaded shop row (for rows that
 * were read in full because server-side code, e.g. notifications, needs them).
 */
export function toPublicShop<T extends Record<string, any>>(
  shop: T | null | undefined,
): Partial<Pick<T, Extract<keyof T, PublicShopKey>>> | null {
  if (!shop) return null;
  const out: Record<string, any> = {};
  for (const key of Object.keys(SHOP_PUBLIC_SELECT)) {
    if (key in shop) out[key] = shop[key];
  }
  return out as any;
}
