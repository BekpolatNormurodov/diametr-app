/**
 * Order statuses that count as a sale (revenue, sold counts).
 *
 * Status flow on the backend: STARTED -> finish() -> FINISHED (stock is taken,
 * "Tasdiqlandi — yetkazishga tayyor") -> confirm() -> CONFIRMED ("Yetkazildi —
 * yakunlangan"). Both FINISHED and CONFIRMED have already taken stock, so both
 * are sold; counting only FINISHED would make revenue drop each time an order
 * is confirmed as delivered. Keep in sync with the backend, shop_admin and bot.
 */
export const SOLD_ORDER_STATUSES = ["FINISHED", "CONFIRMED"] as const;

export function isSoldOrder(order: { status?: string | null } | null | undefined): boolean {
  const status = order?.status ?? "";
  return (SOLD_ORDER_STATUSES as readonly string[]).includes(status);
}

/** Still waiting for the shop (not sold, not canceled). */
export function isActiveOrder(order: { status?: string | null } | null | undefined): boolean {
  return order?.status === "STARTED";
}
