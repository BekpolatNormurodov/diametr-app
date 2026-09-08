import React from 'react'
import { useScrollReveal } from '../../../hooks/useScrollReveal'
import { useLang } from '../../../context/AppContext'

const FEATURES = [
  {
    // Map pin — nearest shops
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
      </svg>
    ),
    titleUz: "Yaqin do'konlar",
    titleRu: "Ближайшие магазины",
    descUz: "Qurilish do'konlarini bir necha soniyada o'zingizga yaqin joydan toping",
    descRu: "Находите строительные магазины рядом с вами за секунды",
  },
  {
    // Scales — price comparison (heroicons: scale)
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M5.25 6.375 12 4.5l6.75 1.875M6 21h12M9 21V10.5m6 10.5V10.5M3 10.5l3-6 3 6a3 3 0 1 1-6 0Zm12 0 3-6 3 6a3 3 0 1 1-6 0Z" />
      </svg>
    ),
    titleUz: "Narxlarni solishtirish",
    titleRu: "Сравнение цен",
    descUz: "Yuzlab sotuvchilarning takliflarini solishtiring va eng yaxshisini tanlang",
    descRu: "Сравнивайте предложения от сотен продавцов и выбирайте лучшее",
  },
  {
    // Stacked boxes — 10 000+ products
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
    ),
    titleUz: "10 000+ tovar",
    titleRu: "10 000+ товаров",
    descUz: "Barcha kerakli qurilish mollari bir joyda",
    descRu: "Все необходимые стройматериалы в одном месте",
  },
  {
    // Truck — fast delivery
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
    titleUz: "Tez yetkazib berish",
    titleRu: "Быстрая доставка",
    descUz: "Materiallarni ortiqcha qo'ng'iroqlarsiz tezda qabul qiling",
    descRu: "Получайте материалы быстро и без лишних звонков",
  },
  {
    // Phone — convenient app
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 3h3m-6 3h.008v.008H9v-.008ZM6 12h.008v.008H6V12Z" />
      </svg>
    ),
    titleUz: "Qulay ilova",
    titleRu: "Удобное приложение",
    descUz: "Smartfoningizdan to'g'ridan-to'g'ri qidiring, solishtiring va buyurtma bering",
    descRu: "Ищите, сравнивайте и заказывайте прямо со смартфона",
  },
  {
    // Shield check — verified sellers (heroicons: shield-check)
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 5.25-4 9-9 9.75C7 21 3 17.25 3 12V6.75l9-3.75 9 3.75V12Z" />
      </svg>
    ),
    titleUz: "Tekshirilgan sotuvchilar",
    titleRu: "Проверенные продавцы",
    descUz: "Faqat ishonchli do'konlar va sertifikatlangan mahsulotlar",
    descRu: "Только надежные магазины и сертифицированная продукция",
  },
]

export default function Customer() {
  const { lang } = useLang()
  const ref = useScrollReveal()
  return (
    <section id="Customer" ref={ref} className="w-full bg-white dark:bg-slate-900 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14 reveal">
          <span className="inline-block bg-primary/10 text-primary font-semibold text-xs px-4 py-1.5 rounded-full mb-4">
            {lang === "uz" ? "Nima uchun biz?" : "Почему мы?"}
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            {lang === "uz" ? "Quruvchilar nega Diametr ni tanlaydi" : "Почему строители выбирают Diametr"}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
            {lang === "uz"
              ? "Narxlarni solishtiring, yaqin do'konlarni toping va qurilish mollarini arzonroq xarid qiling"
              : "Сравнивайте цены, находите ближайшие магазины и покупайте стройматериалы выгоднее"}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((f, i) => (
            <div key={i} className={`reveal reveal-delay-${i + 1} group p-6 bg-white dark:bg-slate-800 border border-primary/20 rounded-2xl hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all duration-300`}>
              <div className="w-14 h-14 bg-primary/5 group-hover:bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4 transition-colors duration-300">
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                {lang === "uz" ? f.titleUz : f.titleRu}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                {lang === "uz" ? f.descUz : f.descRu}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
