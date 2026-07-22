import React, { useState } from 'react'
import { useScrollReveal } from '../../../hooks/useScrollReveal'
import { useLang } from '../../../context/AppContext'

type Faq = {
  qUz: string; aUz: string
  qRu: string; aRu: string
  icon: React.ReactNode
}

const ICON = {
  scale: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m0-18 8.25 1.5M12 3 3.75 4.5M3.75 4.5l-1.5 6h6l-1.5-6Zm0 0v.75m16.5-.75 1.5 6h-6l1.5-6Zm0 0v.75M5.25 12a3 3 0 0 1-3-1.5m6 1.5a3 3 0 0 0 3-1.5m9 1.5a3 3 0 0 1-3-1.5m6 1.5a3 3 0 0 0 3-1.5M6.75 21h10.5" />
    </svg>
  ),
  pin: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  ),
  tag: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
    </svg>
  ),
  truck: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  ),
  shield: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 4.97-3.582 9-8 9s-8-4.03-8-9 3.582-9 8-9 8 4.03 8 9Z" />
    </svg>
  ),
  cart: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
    </svg>
  ),
  card: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
    </svg>
  ),
  phone: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3" />
    </svg>
  ),
}

const FAQS: Faq[] = [
  {
    icon: ICON.scale,
    qUz: "Qurilish materiallari narxlarini qanday solishtirish mumkin?",
    aUz: "Diametr orqali bir nechta do'kon narxlarini bir joyda ko'rib, eng foydali variantni tanlashingiz mumkin.",
    qRu: "Как можно сравнить цены на стройматериалы?",
    aRu: "Через Diametr вы можете увидеть цены нескольких магазинов в одном месте и выбрать самый выгодный вариант.",
  },
  {
    icon: ICON.pin,
    qUz: "Eng yaqin do'konni qanday topaman?",
    aUz: "Joylashuvingiz asosida sizga yaqin qurilish do'konlari avtomatik ko'rsatiladi.",
    qRu: "Как найти ближайший магазин?",
    aRu: "На основе вашего местоположения автоматически отображаются ближайшие строительные магазины.",
  },
  {
    icon: ICON.tag,
    qUz: "Diametr orqali xarid qilish foydalimi?",
    aUz: "Turli sotuvchilarning narxlarini solishtirib, ortiqcha xarajatlardan tejashingiz mumkin.",
    qRu: "Выгодно ли покупать через Diametr?",
    aRu: "Сравнивая цены разных продавцов, вы можете сэкономить на лишних расходах.",
  },
  {
    icon: ICON.truck,
    qUz: "Yetkazib berish xizmati mavjudmi?",
    aUz: "Ha, ko'plab do'konlar tez yetkazib berish xizmatini taklif qiladi.",
    qRu: "Доступна ли услуга доставки?",
    aRu: "Да, многие магазины предлагают услугу быстрой доставки.",
  },
  {
    icon: ICON.shield,
    qUz: "Mahsulotlar sifatiga kafolat bormi?",
    aUz: "Platformadagi sotuvchilar va mahsulotlar tekshiruvdan o'tkaziladi.",
    qRu: "Есть ли гарантия качества товаров?",
    aRu: "Продавцы и товары на платформе проходят проверку.",
  },
  {
    icon: ICON.cart,
    qUz: "Buyurtmani qanday amalga oshiraman?",
    aUz: "Mahsulotni tanlang, do'konni solishtiring va bir necha bosqichda buyurtma bering.",
    qRu: "Как оформить заказ?",
    aRu: "Выберите товар, сравните магазины и оформите заказ за несколько шагов.",
  },
  {
    icon: ICON.card,
    qUz: "To'lov qanday amalga oshiriladi?",
    aUz: "To'lovni karta yoki naqd shaklda amalga oshirishingiz mumkin.",
    qRu: "Как осуществляется оплата?",
    aRu: "Оплату можно произвести картой или наличными.",
  },
  {
    icon: ICON.phone,
    qUz: "Ilovani qayerdan yuklab olish mumkin?",
    aUz: "Diametr ilovasini App Store va Google Play orqali bepul yuklab olishingiz mumkin.",
    qRu: "Где можно скачать приложение?",
    aRu: "Приложение Diametr можно бесплатно скачать в App Store и Google Play.",
  },
]

function FAQItem({ q, a, icon }: { q: string; a: string; icon: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-primary/20 dark:border-primary/30 rounded-2xl overflow-hidden bg-white dark:bg-slate-800/50">
      <button
        className="w-full flex items-start gap-4 px-5 py-4 text-left text-slate-800 dark:text-slate-200 font-semibold hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors duration-200"
        onClick={() => setOpen(!open)}
      >
        <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
          {icon}
        </span>
        <span className="flex-1 mt-1.5">{q}</span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"
          className={`w-5 h-5 mt-2 text-primary flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-5 pl-[4.75rem] text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
          <p>{a}</p>
        </div>
      )}
    </div>
  )
}

export default function Questions() {
  const { lang } = useLang()
  const ref = useScrollReveal()
  return (
    <section id="Questions" ref={ref} className="w-full bg-gradient-to-b from-primary/5 to-white dark:from-slate-900 dark:to-slate-900 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12 reveal">
          <span className="inline-block bg-primary/10 text-primary font-semibold text-xs px-4 py-1.5 rounded-full mb-4">FAQ</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            {lang === "uz" ? "Ko'p beriladigan savollar" : "Часто задаваемые вопросы"}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-base">
            {lang === "uz"
              ? "Diametr haqida eng ko'p beriladigan savollarga javoblar"
              : "Ответы на самые часто задаваемые вопросы о Diametr"}
          </p>
        </div>
        <div className="flex flex-col gap-3 reveal reveal-delay-1">
          {FAQS.map((faq, i) => (
            <FAQItem
              key={i}
              icon={faq.icon}
              q={lang === "uz" ? faq.qUz : faq.qRu}
              a={lang === "uz" ? faq.aUz : faq.aRu}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
