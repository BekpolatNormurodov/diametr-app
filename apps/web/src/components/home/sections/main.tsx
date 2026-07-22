import React from 'react'
import phone from "../../../assets/phone.png"
import { useLang } from '../../../context/AppContext'

const BULLETS = [
  { uz: "500+ do'kon narxlarini solishtiring", ru: "Сравните цены 500+ магазинов" },
  { uz: "Sizga eng yaqin sotuvchini toping",   ru: "Найдите ближайшего продавца" },
  { uz: "Eng arzon variantni tanlang",         ru: "Выберите самый выгодный вариант" },
  { uz: "Tez va qulay yetkazib berish",        ru: "Быстрая и удобная доставка" },
]

export default function Main() {
  const { lang } = useLang()
  return (
    <section id="Main" className="w-full bg-gradient-to-br from-primary/5 via-white to-primary/5 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

        {/* Text */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6 text-center lg:text-left">
          <h1 className="hero-title text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white leading-tight">
            {lang === "uz" ? (
              <span>Qurilish materiallarini <span className="text-primary">eng arzon narxda</span> va eng yaqin do'kondan toping</span>
            ) : (
              <span>Найдите стройматериалы <span className="text-primary">по самой выгодной цене</span> в ближайшем магазине</span>
            )}
          </h1>

          <ul className="hero-desc flex flex-col gap-3 text-slate-700 dark:text-slate-200 text-base sm:text-lg">
            {BULLETS.map((b, i) => (
              <li key={i} className="flex items-start gap-3 justify-center lg:justify-start">
                <span className="mt-1 w-5 h-5 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </span>
                <span>{lang === "uz" ? b.uz : b.ru}</span>
              </li>
            ))}
          </ul>

          <div className="hero-btns flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button
              onClick={() => document.getElementById("Writing")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-accent text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-200 text-base"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 3h3m-6 3h.008v.008H9v-.008ZM6 12h.008v.008H6V12Z" />
              </svg>
              {lang === "uz" ? "Ilovani yuklab olish" : "Скачать приложение"}
            </button>
          </div>
        </div>

        {/* Phone mockup */}
        <div className="hero-phone w-full lg:w-1/2 flex justify-center items-center">
          <div className="relative inline-flex justify-center">
            {/* Glow */}
            <div className="absolute inset-0 bg-primary/30 rounded-full blur-3xl opacity-40 scale-75" />

            {/* Phone image (already includes its own frame) */}
            <img
              src={phone}
              alt="Diametr App"
              className="relative z-10 w-56 sm:w-64 drop-shadow-2xl"
              style={{ display: 'block' }}
            />

            {/* Expanding rings — behind phone */}
            <div className="hero-ring hero-ring-1" />
            <div className="hero-ring hero-ring-2" />
            <div className="hero-ring hero-ring-3" />
            <div className="hero-ring hero-ring-4" />

            {/* Floating badge — rating (left) */}
            <div className="badge-float-left absolute bottom-8 -left-14 bg-white dark:bg-slate-800 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 border border-primary/15 dark:border-primary/20 z-20"
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,196,140,0.18), 0 0 0 1px rgba(0,196,140,0.10)' }}>
              {/* Star icon */}
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="#F59E0B" className="w-4.5 h-4.5" style={{width:18,height:18}}>
                  <path d="M12 2l2.939 6.112 6.561.954-4.75 4.629 1.121 6.532L12 17.25l-5.871 2.977 1.121-6.532L2.5 9.066l6.561-.954L12 2z"/>
                </svg>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">4.9 / 5</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">{lang === 'uz' ? '2K+ sharh' : '2K+ отзывов'}</div>
              </div>
            </div>

            {/* Floating badge — users (right) */}
            <div className="badge-float-right absolute top-8 -right-14 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 z-20"
              style={{ background: 'linear-gradient(135deg, #00C48C 0%, #00a876 100%)', boxShadow: '0 8px 32px rgba(0,196,140,0.40), 0 2px 12px rgba(0,0,0,0.15)' }}>
              {/* People icon */}
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="white" style={{width:18,height:18}}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                </svg>
              </div>
              <div className="text-white">
                <div className="text-xs font-bold leading-tight">1M+</div>
                <div className="text-[10px] opacity-85 leading-tight mt-0.5">{lang === 'uz' ? 'Foydalanuvchi' : 'Пользователей'}</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
