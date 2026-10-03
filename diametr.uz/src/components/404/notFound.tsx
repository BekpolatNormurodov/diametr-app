import React from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../../context/AppContext'

export default function NotFound() {
  const { lang } = useLang()
  const uz = lang === 'uz'
  return (
    <section className="min-h-screen w-full flex items-center justify-center px-6 py-16 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-md text-center">
        <p className="text-8xl sm:text-9xl font-extrabold leading-none bg-gradient-to-br from-primary to-emerald-300 bg-clip-text text-transparent select-none">
          404
        </p>
        <h1 className="mt-6 text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100">
          {uz ? 'Sahifa topilmadi' : 'Страница не найдена'}
        </h1>
        <p className="mt-3 text-slate-500 dark:text-slate-400">
          {uz
            ? 'Bu manzil o‘zgargan yoki mavjud emas. Bosh sahifadan kerakli mahsulotni toping.'
            : 'Адрес изменился или не существует. Найдите нужный товар на главной странице.'}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:opacity-90 transition-opacity"
          >
            {uz ? 'Bosh sahifaga qaytish' : 'На главную'}
          </Link>
          <Link
            to="/shops"
            className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:border-primary hover:text-primary transition-colors"
          >
            {uz ? "Do'konlar" : 'Магазины'}
          </Link>
        </div>
      </div>
    </section>
  )
}
