import { useEffect, useState } from 'react'
import { DAY_NAMES, dayText, openStatus, statusText, todayIndex } from '../../utils/workHours'
import type { WorkHours } from '../../utils/workHours'

type Lang = 'uz' | 'ru'

/** Re-renders every minute so "open now" flips on time. */
function useMinuteTick() {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setTick(n => n + 1), 60_000)
    return () => window.clearInterval(id)
  }, [])
}

/** Compact "● Open until 18:00" pill for the shop header. */
export function OpenStatusPill({ hours, lang }: { hours: WorkHours; lang: Lang }) {
  useMinuteTick()
  const s = openStatus(hours)
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
        s.open
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30'
          : 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30'
      }`}
    >
      <span className="relative flex w-2 h-2">
        {s.open && <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-60 animate-ping" />}
        <span className={`relative inline-flex w-2 h-2 rounded-full ${s.open ? 'bg-emerald-500' : 'bg-rose-500'}`} />
      </span>
      {statusText(s, lang)}
    </span>
  )
}

/** Weekly hours, Monday first, today highlighted. */
export function WorkHoursCard({ hours, lang }: { hours: WorkHours; lang: Lang }) {
  useMinuteTick()
  const today = todayIndex()
  const s = openStatus(hours)
  return (
    <section className="rounded-3xl border border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-800/60 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-800 dark:text-slate-100">
          <span className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </span>
          {lang === 'uz' ? 'Ish vaqti' : 'Время работы'}
        </h2>
        <span className={`text-xs font-bold ${s.open ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
          {s.open ? (lang === 'uz' ? 'Hozir ochiq' : 'Сейчас открыто') : (lang === 'uz' ? 'Hozir yopiq' : 'Сейчас закрыто')}
        </span>
      </div>
      <ul className="space-y-1">
        {hours.map((d, i) => {
          const isToday = i === today
          return (
            <li
              key={i}
              className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm ${
                isToday ? 'bg-emerald-50 dark:bg-emerald-500/10 font-bold text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${d ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                {DAY_NAMES[lang][i]}
                {isToday && (
                  <span className="text-[10px] uppercase tracking-wide font-bold text-emerald-700 dark:text-emerald-400 bg-white/70 dark:bg-emerald-500/15 px-1.5 py-0.5 rounded-md">
                    {lang === 'uz' ? 'Bugun' : 'Сегодня'}
                  </span>
                )}
              </span>
              <span className={`tabular-nums ${d ? '' : 'text-slate-400 dark:text-slate-500 font-medium'}`}>{dayText(d, lang)}</span>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 text-[11px] text-slate-400">{lang === 'uz' ? 'Toshkent vaqti bo‘yicha' : 'По времени Ташкента'}</p>
    </section>
  )
}

/** The owner's about text; long texts fold. */
export function ShopAboutCard({ text, lang }: { text: string; lang: Lang }) {
  const [open, setOpen] = useState(false)
  const long = text.length > 420
  return (
    <section className="rounded-3xl border border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-800/60 p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-800 dark:text-slate-100 mb-3">
        <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
          </svg>
        </span>
        {lang === 'uz' ? 'Do‘kon haqida' : 'О магазине'}
      </h2>
      <div className={`relative text-sm leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line break-words ${long && !open ? 'max-h-48 overflow-hidden' : ''}`}>
        {text}
        {long && !open && <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white dark:from-slate-800 to-transparent" />}
      </div>
      {long && (
        <button onClick={() => setOpen(o => !o)} className="mt-2 text-sm font-bold text-primary hover:underline">
          {open ? (lang === 'uz' ? 'Yig‘ish' : 'Свернуть') : (lang === 'uz' ? 'Batafsil' : 'Подробнее')}
        </button>
      )}
    </section>
  )
}
