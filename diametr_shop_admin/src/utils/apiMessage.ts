/**
 * The server's (localized, Uzbek by default) error message for a toast, e.g. 403 "Bu promokod
 * sizning do'koningizga tegishli emas" or 400 for a used promo code. Falls back to a generic text.
 */
export function apiMessage(e: unknown, fallback: string = "Xatolik yuz berdi"): string {
  const msg = (e as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  if (Array.isArray(msg)) return msg.filter((m) => typeof m === "string" && m).join(", ") || fallback;
  return typeof msg === "string" && msg.trim() ? msg : fallback;
}
