import { useLang } from "../../context/LangContext";
import {
  DAY_NAMES,
  FULL_DAY,
  is24h,
  todayIndex,
  type WorkDay,
  type WorkHours,
  type WorkRange,
} from "../../utils/workHours";

type Mode = "open" | "24h" | "off";

const EMPTY: WorkHours = [null, null, null, null, null, null, null];
const STD: WorkRange = { open: "09:00", close: "18:00" };

const MODE_STYLE: Record<Mode, { active: string; dot: string }> = {
  open: { active: "bg-emerald-500 text-white shadow-sm", dot: "bg-emerald-500" },
  "24h": { active: "bg-indigo-500 text-white shadow-sm", dot: "bg-indigo-500" },
  off: { active: "bg-gray-500 text-white shadow-sm dark:bg-gray-600", dot: "bg-gray-300 dark:bg-gray-600" },
};

function ClockIcon() {
  return (
    <svg className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

/**
 * Weekly hours editor: quick presets, then one row per day (open with times /
 * 24 hours / day off). `null` = not set (nothing shown to customers).
 */
export default function WorkHoursEditor({
  value,
  onChange,
}: {
  value: WorkHours | null;
  onChange: (v: WorkHours | null) => void;
}) {
  const { t, lang } = useLang();
  const days = value ?? EMPTY;
  const today = todayIndex();

  const emit = (next: WorkHours) => onChange(next.some(Boolean) ? next : null);
  const setDay = (i: number, d: WorkDay) => emit(days.map((x, j) => (j === i ? d : x)));
  const modeOf = (d: WorkDay): Mode => (!d ? "off" : is24h(d) ? "24h" : "open");
  const setMode = (i: number, m: Mode) => {
    const prev = days[i];
    if (m === "off") setDay(i, null);
    else if (m === "24h") setDay(i, { ...FULL_DAY });
    else setDay(i, prev && !is24h(prev) ? prev : { ...STD });
  };
  const setTime = (i: number, key: "open" | "close", v: string) => {
    const d = days[i];
    if (d && v) setDay(i, { ...d, [key]: v });
  };

  const presets: { label: string; build: () => WorkHours | null }[] = [
    { label: t("Du–Sh · 09:00–18:00", "Пн–Сб · 09:00–18:00"), build: () => EMPTY.map((_, i) => (i < 6 ? { ...STD } : null)) },
    { label: t("Har kuni · 09:00–18:00", "Ежедневно · 09:00–18:00"), build: () => EMPTY.map(() => ({ ...STD })) },
    { label: t("Har kuni · 24 soat", "Круглосуточно"), build: () => EMPTY.map(() => ({ ...FULL_DAY })) },
  ];

  const first = days.find((d) => d && !is24h(d)) ?? null;
  const copyFirst = () => first && emit(days.map((d) => (d && !is24h(d) ? { ...first } : d)));

  const modes: { m: Mode; label: string }[] = [
    { m: "open", label: t("Ochiq", "Открыто") },
    { m: "24h", label: t("24 soat", "24 часа") },
    { m: "off", label: t("Dam", "Выходной") },
  ];
  const timeCls =
    "h-10 w-[112px] rounded-lg border border-gray-200 bg-white pl-8 pr-2 text-sm font-medium tabular-nums text-gray-800 shadow-theme-xs focus:border-emerald-400 focus:outline-hidden focus:ring-3 focus:ring-emerald-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:[color-scheme:dark]";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-400">{t("Tez tanlash:", "Быстрый выбор:")}</span>
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => onChange(p.build())}
            className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-theme-xs transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
          >
            {p.label}
          </button>
        ))}
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded-full px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
          >
            {t("Tozalash", "Очистить")}
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
        {days.map((d, i) => {
          const mode = modeOf(d);
          const bad = !!d && mode === "open" && d.open === d.close;
          const isToday = i === today;
          return (
            <div
              key={i}
              className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 ${i ? "border-t border-gray-100 dark:border-gray-800" : ""} ${
                isToday ? "bg-emerald-50/60 dark:bg-emerald-500/[0.06]" : ""
              }`}
            >
              <div className="flex w-36 items-center gap-2.5">
                <span className={`h-2 w-2 shrink-0 rounded-full ${MODE_STYLE[mode].dot}`} />
                <span className={`text-sm ${mode === "off" ? "text-gray-400" : "font-medium text-gray-800 dark:text-white/90"}`}>
                  {DAY_NAMES[lang][i]}
                </span>
                {isToday && (
                  <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                    {t("Bugun", "Сегодня")}
                  </span>
                )}
              </div>
              <div className="inline-flex rounded-lg bg-gray-100 p-0.5 dark:bg-white/[0.06]" role="radiogroup" aria-label={DAY_NAMES[lang][i]}>
                {modes.map(({ m, label }) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={mode === m}
                    onClick={() => setMode(i, m)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                      mode === m ? MODE_STYLE[m].active : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {mode === "open" && d && (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <ClockIcon />
                    <input type="time" step={300} className={timeCls} value={d.open} onChange={(e) => setTime(i, "open", e.target.value)} aria-label={t("Ochilish vaqti", "Время открытия")} />
                  </div>
                  <span className="text-gray-300 dark:text-gray-600">—</span>
                  <div className="relative">
                    <ClockIcon />
                    <input type="time" step={300} className={timeCls} value={d.close === "24:00" ? "00:00" : d.close} onChange={(e) => setTime(i, "close", e.target.value)} aria-label={t("Yopilish vaqti", "Время закрытия")} />
                  </div>
                </div>
              )}
              {mode === "24h" && <span className="text-xs font-medium text-indigo-500 dark:text-indigo-400">{t("Kun bo'yi ochiq", "Открыто весь день")}</span>}
              {bad && <span className="text-xs font-medium text-error-500">{t("Ochilish va yopilish bir xil", "Время открытия и закрытия совпадает")}</span>}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-2 text-xs">
        {first ? (
          <button type="button" onClick={copyFirst} className="font-medium text-emerald-600 hover:underline dark:text-emerald-400">
            {t(`${first.open}–${first.close} vaqtini barcha ochiq kunlarga qo'llash`, `Применить ${first.open}–${first.close} ко всем рабочим дням`)}
          </button>
        ) : (
          <span className="text-amber-600 dark:text-amber-400">{t("Ish vaqti belgilanmagan — mijozlarga ko'rsatilmaydi", "Время работы не задано — покупатели его не увидят")}</span>
        )}
        <span className="text-gray-400">{t("Toshkent vaqti bo'yicha", "По времени Ташкента")}</span>
      </div>
      <p className="text-xs leading-relaxed text-gray-400">
        {t("Yopilish ochilishdan oldin bo'lsa, do'kon yarim tundan keyin ham ishlaydi (masalan 20:00 — 02:00).", "Если закрытие раньше открытия, магазин работает после полуночи (например 20:00 — 02:00).")}
      </p>
    </div>
  );
}
