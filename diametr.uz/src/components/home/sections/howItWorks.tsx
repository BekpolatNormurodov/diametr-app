import React from 'react'
import { useScrollReveal } from '../../../hooks/useScrollReveal'
import { useLang } from '../../../context/AppContext'

const STEPS = [
  {
    number: "01",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3" />
      </svg>
    ),
    titleUz: "Ilovani yuklab oling",
    titleRu: "Скачайте приложение",
    descUz: "App Store yoki Google Play'dan bepul yuklab oling",
    descRu: "Бесплатно скачайте из App Store или Google Play",
  },
  {
    number: "02",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
    ),
    titleUz: "Mahsulot tanlang",
    titleRu: "Выберите товар",
    descUz: "10,000+ mahsulot orasidan keraklisini toping va narxlarni solishtiring",
    descRu: "Найдите нужный товар среди 10 000+ продуктов и сравните цены",
  },
  {
    number: "03",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
    titleUz: "Buyurtma bering",
    titleRu: "Оформите заказ",
    descUz: "Qulay yetkazib berish manzilingizni kiriting va to'lovni amalga oshiring",
    descRu: "Укажите удобный адрес доставки и внесите оплату",
  },
]

export default function HowItWorks() {
  const { lang } = useLang()
  const ref = useScrollReveal()
  return (
    <section id="HowItWorks" ref={ref} className="w-full bg-slate-50 dark:bg-slate-900 py-20 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14 reveal">
          <span className="inline-block bg-primary/10 dark:bg-primary/20 text-primary font-semibold text-xs px-4 py-1.5 rounded-full mb-4">
            {lang === "uz" ? "Qanday ishlaydi?" : "Как это работает?"}
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-white mb-4">
            {lang === "uz" ? "3 qadam — xolos!" : "Всего 3 шага!"}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-base max-w-xl mx-auto">
            {lang === "uz"
              ? "Diametr orqali qurilish materiallari sotib olish juda ham oson"
              : "Купить стройматериалы через Diametr очень просто"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <div key={i} className={`reveal reveal-delay-${i + 1} relative flex flex-col items-center text-center gap-5`}>
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-10 left-1/2 w-full border-t-2 border-dashed border-primary/30 dark:border-primary/40 z-0" style={{ left: "50%", width: "100%" }}></div>
              )}
              <div className="relative z-10 w-20 h-20 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 flex items-center justify-center text-primary shadow-sm">
                {step.icon}
                <span className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shadow">
                  {step.number}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{lang === "uz" ? step.titleUz : step.titleRu}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{lang === "uz" ? step.descUz : step.descRu}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
