import React from 'react'
import logo from "../../../assets/logo.png"
import { useLang } from '../../../context/AppContext'

export default function Footer() {
  const { lang, theme } = useLang()
  const year = new Date().getFullYear()
  return (
    <footer id="Footer" className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div
              className="relative flex items-center justify-center overflow-hidden mb-4 flex-shrink-0"
              style={{
                width: 56, height: 56,
                background: 'linear-gradient(140deg, rgba(0,196,140,0.18) 0%, rgba(0,20,12,0.96) 100%)',
                boxShadow: '0 0 0 1.5px rgba(0,196,140,0.30), 0 0 28px 4px rgba(0,196,140,0.18), 0 8px 24px rgba(0,0,0,0.4)',
                borderRadius: 16,
              }}
            >
              {/* Corner shine */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, transparent 45%)',
                borderRadius: 16,
              }} />
              {/* Shimmer sweep */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'linear-gradient(108deg, transparent 15%, rgba(255,255,255,0.30) 48%, rgba(200,255,240,0.15) 52%, transparent 85%)',
                animation: 'splashShimmer 2.8s 0.8s ease-in-out infinite',
                borderRadius: 16,
                zIndex: 3,
              }} />
              <img src={logo} alt="Diametr"
                style={{ width: 34, height: 34, objectFit: 'contain', filter: 'brightness(0) invert(1) drop-shadow(0 0 6px rgba(0,196,140,0.8))', position: 'relative', zIndex: 4 }}
              />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed mb-5">
              {lang === "uz"
                ? "O'zbekistondagi qurilish materiallari uchun yetakchi onlayn platforma"
                : "Ведущая онлайн-платформа для стройматериалов в Узбекистане"}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold text-slate-800 dark:text-white mb-5 text-base uppercase tracking-wider">
              {lang === "uz" ? "Havolalar" : "Ссылки"}
            </h4>
            <ul className="flex flex-col gap-3">
              {[
                { uz: "Bosh sahifa", ru: "Главная" },
                { uz: "Katalog", ru: "Каталог" },
                { uz: "Do'konlar", ru: "Магазины" },
                { uz: "Biz haqimizda", ru: "О нас" },
                { uz: "Aloqa", ru: "Контакты" },
              ].map((item, i) => (
                <li key={i}>
                  <span className="text-slate-500 dark:text-slate-400 hover:text-primary text-base cursor-pointer transition-colors duration-200">
                    {lang === "uz" ? item.uz : item.ru}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-slate-800 dark:text-white mb-5 text-base uppercase tracking-wider">
              {lang === "uz" ? "Bog'lanish" : "Связь"}
            </h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mt-0.5 flex-shrink-0 text-primary">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                <span className="text-slate-500 dark:text-slate-400 text-base">{lang === "uz" ? "Toshkent, O'zbekiston" : "Ташкент, Узбекистан"}</span>
              </div>
              <a href="tel:+998955055444" className="flex items-center gap-3 text-slate-500 dark:text-slate-400 hover:text-primary text-base transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0 text-primary">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                </svg>
                +998 95 505 54 44
              </a>
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0 text-primary">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                <a href="mailto:info@diametr.uz" className="text-slate-500 dark:text-slate-400 hover:text-primary text-base transition-colors">info@diametr.uz</a>
              </div>
            </div>

            {/* Social */}
            <div className="flex items-center gap-3 mt-5">
              <a href="https://t.me/diametr_uz" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-primary dark:hover:bg-primary flex items-center justify-center transition-colors duration-200 group">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-slate-700 dark:text-white group-hover:text-white">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </a>
              <a href="https://instagram.com/diametr_uz" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-primary dark:hover:bg-primary flex items-center justify-center transition-colors duration-200 group">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-slate-700 dark:text-white group-hover:text-white">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                </svg>
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-slate-500 dark:text-slate-500 text-xs">
            &copy; {year} Diametr. {lang === "uz" ? "Barcha huquqlar himoyalangan." : "Все права защищены."}
          </p>
          <div className="flex items-center gap-4">
            <a href="/diametr-mobile.privacy-policy.md" className="text-slate-500 dark:text-slate-500 hover:text-primary text-xs transition-colors">Privacy Policy</a>
            <span className="text-slate-400 dark:text-slate-700">|</span>
            <a href="/diametr-admin.privacy-policy.md" className="text-slate-500 dark:text-slate-500 hover:text-primary text-xs transition-colors">Admin Policy</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
