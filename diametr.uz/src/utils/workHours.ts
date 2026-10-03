/**
 * Weekly shop hours as the API stores them (shop.work_hours): 7 entries,
 * Monday first; null = day off. A close time earlier than the open time means
 * the shop works past midnight ("00:00" = until midnight); "00:00"–"24:00" is
 * open round the clock. Keep in sync with the copies in the other apps.
 */
export type WorkRange = { open: string; close: string };
export type WorkDay = WorkRange | null;
export type WorkHours = WorkDay[];
type Lang = "uz" | "ru";

export const DAY_NAMES: Record<Lang, string[]> = {
  uz: ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"],
  ru: ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"],
};
const RU_ON_DAY = ["в понедельник", "во вторник", "в среду", "в четверг", "в пятницу", "в субботу", "в воскресенье"];

export const FULL_DAY: WorkRange = { open: "00:00", close: "24:00" };
export const is24h = (d: WorkDay) => !!d && d.open === "00:00" && d.close === "24:00";

/** The stored value, or null when missing/malformed/all days off ("not set"). */
export function parseWorkHours(v: unknown): WorkHours | null {
  if (!Array.isArray(v) || v.length !== 7) return null;
  const days: WorkHours = v.map((d) =>
    d && typeof d === "object" && typeof d.open === "string" && typeof d.close === "string"
      ? { open: d.open, close: d.close }
      : null,
  );
  return days.some(Boolean) ? days : null;
}

/** True when every open day has a usable range (open ≠ close). */
export function workHoursValid(v: WorkHours | null): boolean {
  return !v || v.every((d) => !d || (!!d.open && !!d.close && d.open !== d.close));
}

const toMin = (s: string) => {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
};

/** Tashkent wall clock (UTC+5, no DST): weekday Monday = 0, minutes since midnight. */
function tashkentNow(now: number) {
  const d = new Date(now + 5 * 3600_000);
  return { day: (d.getUTCDay() + 6) % 7, min: d.getUTCHours() * 60 + d.getUTCMinutes() };
}

export type OpenStatus =
  | { open: true; closesAt: string | null } // null = round the clock
  | { open: false; opensAt: string | null; inDays: number }; // inDays 0 = today

export function openStatus(hours: WorkHours, now = Date.now()): OpenStatus {
  const { day, min } = tashkentNow(now);
  const prev = hours[(day + 6) % 7];
  if (prev && !is24h(prev) && toMin(prev.close) < toMin(prev.open) && min < toMin(prev.close)) {
    return { open: true, closesAt: prev.close };
  }
  const today = hours[day];
  if (today) {
    if (is24h(today)) return { open: true, closesAt: null };
    const o = toMin(today.open);
    const c = toMin(today.close);
    if (c > o ? min >= o && min < c : min >= o) return { open: true, closesAt: today.close };
    if (min < o) return { open: false, opensAt: today.open, inDays: 0 };
  }
  for (let i = 1; i <= 7; i++) {
    const d = hours[(day + i) % 7];
    if (d) return { open: false, opensAt: d.open, inDays: i };
  }
  return { open: false, opensAt: null, inDays: 0 };
}

/** "Open until 18:00" / "Closed · opens tomorrow at 09:00" in the given language. */
export function statusText(s: OpenStatus, lang: Lang, now = Date.now()): string {
  const ru = lang === "ru";
  if (s.open) {
    if (!s.closesAt) return ru ? "Открыто круглосуточно" : "Hozir ochiq · 24 soat";
    const at = s.closesAt === "24:00" ? "00:00" : s.closesAt;
    return ru ? `Открыто до ${at}` : `Hozir ochiq · ${at} gacha`;
  }
  if (!s.opensAt) return ru ? "Закрыто" : "Yopiq";
  if (s.inDays === 0) return ru ? `Закрыто · откроется в ${s.opensAt}` : `Yopiq · ${s.opensAt} da ochiladi`;
  if (s.inDays === 1) return ru ? `Закрыто · откроется завтра в ${s.opensAt}` : `Yopiq · ertaga ${s.opensAt} da ochiladi`;
  const day = (tashkentNow(now).day + s.inDays) % 7;
  return ru
    ? `Закрыто · откроется ${RU_ON_DAY[day]} в ${s.opensAt}`
    : `Yopiq · ${DAY_NAMES.uz[day].toLowerCase()} ${s.opensAt} da ochiladi`;
}

/** "09:00 – 18:00" / "24 soat" / "Dam olish" for one day. */
export function dayText(d: WorkDay, lang: Lang): string {
  if (!d) return lang === "ru" ? "Выходной" : "Dam olish";
  if (is24h(d)) return lang === "ru" ? "Круглосуточно" : "24 soat";
  return `${d.open} – ${d.close === "24:00" ? "00:00" : d.close}`;
}

/** Today's index in the Monday-first week, Tashkent time. */
export const todayIndex = (now = Date.now()) => tashkentNow(now).day;
