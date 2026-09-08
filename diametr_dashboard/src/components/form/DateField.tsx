import { useEffect, useMemo, useRef, useState } from "react";
import Label from "./Label";
import { CalenderIcon } from "../../icons";

interface DateFieldProps {
  label?: string;
  /** Selected date as "YYYY-MM-DD" (or empty). */
  value?: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

const MONTHS = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];
const WEEKDAYS = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"]; // Monday-first

const pad = (n: number) => String(n).padStart(2, "0");
const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/**
 * Self-contained pro date picker — a styled button + popover calendar.
 * No external library (avoids flatpickr's inline-calendar height and the native
 * date-input fallback), fully controlled, and visually matched to `Select`.
 */
export default function DateField({ label, value, placeholder = "Sanani tanlang", onChange }: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => (value ? new Date(`${value}T00:00:00`) : null), [value]);
  const [view, setView] = useState<Date>(selected ?? new Date());

  useEffect(() => {
    if (selected) setView(selected);
  }, [selected]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const year = view.getFullYear();
  const month = view.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first offset

  const cells: (number | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const today = new Date();
  const isSameDay = (d: Date | null, y: number, m: number, day: number) =>
    !!d && d.getFullYear() === y && d.getMonth() === m && d.getDate() === day;

  const pick = (day: number) => {
    onChange(fmt(new Date(year, month, day)));
    setOpen(false);
  };

  const goToday = () => {
    const t = new Date();
    setView(new Date(t.getFullYear(), t.getMonth(), 1));
    onChange(fmt(t));
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      {label && <Label>{label}</Label>}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`h-11 w-full flex items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-800 dark:focus:border-brand-600 ${
          value ? "text-gray-800 dark:text-white/90" : "text-gray-400 dark:text-gray-500"
        }`}
      >
        <span>{value || placeholder}</span>
        <CalenderIcon className="w-5 h-5 text-gray-500 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-72 rounded-xl border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {/* Month header */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setView(new Date(year, month - 1, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              aria-label="Oldingi oy"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90">{MONTHS[month]} {year}</span>
            <button
              type="button"
              onClick={() => setView(new Date(year, month + 1, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              aria-label="Keyingi oy"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          {/* Weekday row */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((w) => (
              <span key={w} className="text-center text-xs font-medium text-gray-400 py-1">{w}</span>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) =>
              day === null ? (
                <span key={i} />
              ) : (
                <button
                  key={i}
                  type="button"
                  onClick={() => pick(day)}
                  className={`h-8 rounded-lg text-sm transition-colors ${
                    isSameDay(selected, year, month, day)
                      ? "bg-brand-500 text-white font-medium"
                      : isSameDay(today, year, month, day)
                      ? "text-brand-600 font-medium ring-1 ring-brand-300 dark:text-brand-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {day}
                </button>
              )
            )}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); }}
              className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              Tozalash
            </button>
            <button
              type="button"
              onClick={goToday}
              className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              Bugun
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
