import { Prisma } from '@prisma/client';

/**
 * A stock row whose catalogue chain is still live: the row itself, its variant
 * and the variant's product are all WORKING. Archiving a product or variant
 * cascades to its stock, but rows archived before that cascade existed are
 * still WORKING, so every read that counts or lists stock must use this.
 *
 * Deliberately NOT filtered by category.work_status: most sellable products
 * sit under archived categories and must stay visible.
 */
export const CATALOG_LIVE_STOCK_WHERE: Prisma.ShopProductWhereInput = {
  work_status: 'WORKING',
  product_item: {
    work_status: 'WORKING',
    product: { work_status: 'WORKING' },
  },
};

/**
 * Stock a customer may see: catalogue chain live (above) AND it belongs to an
 * existing, WORKING shop. Rows of a deleted shop keep shop_id NULL and can
 * never be checked out.
 */
export const LIVE_STOCK_WHERE: Prisma.ShopProductWhereInput = {
  AND: [
    CATALOG_LIVE_STOCK_WHERE,
    { shop_id: { not: null }, shop: { work_status: 'WORKING' } },
  ],
};

/**
 * Order statuses whose lines count as SOLD. finish() (STARTED -> FINISHED)
 * takes the stock and confirm() (FINISHED -> CONFIRMED, delivery confirmed)
 * keeps it taken, so both are sales: counting FINISHED alone made "sotilgan"
 * and revenue drop every time an order was confirmed.
 */
export const SOLD_ORDER_STATUSES: ('FINISHED' | 'CONFIRMED')[] = [
  'FINISHED',
  'CONFIRMED',
];

/** `order_products` filter for sold_count / last_sold. */
export const SOLD_ORDER_PRODUCT_WHERE: Prisma.OrderProductWhereInput = {
  order: { status: { in: SOLD_ORDER_STATUSES } },
};

/**
 * The single price rule shared by every client and the order line:
 * a discount applies only when it is positive and below the list price.
 */
export function effectivePrice(
  price: number | null | undefined,
  bonusPrice: number | null | undefined,
): number | null {
  if (price == null) return null;
  return bonusPrice != null && bonusPrice > 0 && bonusPrice < price
    ? bonusPrice
    : price;
}
