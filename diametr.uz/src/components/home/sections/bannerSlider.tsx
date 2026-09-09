import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useScrollReveal } from '../../../hooks/useScrollReveal'
import { useLang } from '../../../context/AppContext'

const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8888'
const API_URL = `${BASE_URL}/api/v1`

interface Ad {
  id: number
  title?: string
  subtitle?: string
  title_ru?: string
  subtitle_ru?: string
  image?: string
}

const BG_PALETTE = [
  'from-primary via-emerald-500 to-teal-600',
  'from-slate-800 via-slate-700 to-slate-900',
  'from-amber-500 via-orange-500 to-red-500',
  'from-violet-600 via-purple-600 to-indigo-600',
  'from-sky-500 via-cyan-500 to-teal-500',
]

const FALLBACK_BANNERS = [
  {
    bg: 'from-primary via-emerald-500 to-teal-600',
    badge: { uz: '🏗️ Qurilish', ru: '🏗️ Строительство' },
    title: { uz: 'Qurilish materiallari — eng yaxshi narxlarda', ru: 'Стройматериалы — по лучшим ценам' },
    desc: { uz: "O'zbekistondagi yetakchi qurilish bozori. 10,000+ mahsulot, 500+ do'kon.", ru: 'Ведущий строительный рынок Узбекистана. 10,000+ товаров, 500+ магазинов.' },
    cta: { uz: "Katalogni ko'rish", ru: 'Смотреть каталог' },
    image: null as string | null,
  },
  {
    bg: 'from-slate-800 via-slate-700 to-slate-900',
    badge: { uz: '🚚 Yetkazib berish', ru: '🚚 Доставка' },
    title: { uz: 'Tez va ishonchli yetkazib berish', ru: 'Быстрая и надёжная доставка' },
    desc: { uz: "Butun O'zbekiston bo'ylab tezkor yetkazib berish. Buyurtmangizni onlayn bering!", ru: 'Быстрая доставка по всему Узбекистану. Оформите заказ онлайн!' },
    cta: { uz: 'Ilovani yuklab olish', ru: 'Скачать приложение' },
    image: null as string | null,
  },
  {
    bg: 'from-amber-500 via-orange-500 to-red-500',
    badge: { uz: '⭐ Aksiyalar', ru: '⭐ Акции' },
    title: { uz: 'Chegirma va aksiyalar har kuni', ru: 'Скидки и акции каждый день' },
    desc: { uz: "Mahalliy do'konlardan eng katta chegirmalar. Vaqtni boy bermang!", ru: 'Лучшие скидки от местных магазинов. Не упустите возможность!' },
    cta: { uz: "Do'konlarni ko'rish", ru: 'Смотреть магазины' },
    image: null as string | null,
  },
]

export default function BannerSlider() {
  const { lang } = useLang()
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [ads, setAds] = useState<Ad[]>([])
  const [loaded, setLoaded] = useState(false)
  const ref = useScrollReveal()

  useEffect(() => {
    axios.get(`${API_URL}/ad/all`)
      .then(res => {
        const d = res.data?.data ?? res.data
        const list = Array.isArray(d) ? d.filter((a: Ad) => a.image) : []
        setAds(list)
      })
      .catch(() => setAds([]))
      .finally(() => setLoaded(true))
  }, [])

  const realBanners = loaded && ads.length > 0
    ? ads.map((ad, i) => ({
        bg: BG_PALETTE[i % BG_PALETTE.length],
        badge: { uz: ad.title || 'Reklama', ru: ad.title_ru || ad.title || 'Реклама' },
        title: { uz: ad.title || '', ru: ad.title_ru || ad.title || '' },
        desc: { uz: ad.subtitle || '', ru: ad.subtitle_ru || ad.subtitle || '' },
        cta: { uz: "Ko'proq", ru: 'Подробнее' },
        image: `${BASE_URL}/static/ads/${ad.image}`,
      }))
    : []

  // Show only the real ad banners. The branded fallback slides appear ONLY when
  // there are no ads at all — otherwise a single ad is the one main banner.
  const banners = realBanners.length > 0 ? realBanners : FALLBACK_BANNERS

  const total = banners.length

  const goTo = useCallback((idx: number) => {
    if (animating) return
    setAnimating(true)
    setTimeout(() => {
      setCurrent(idx)
      setAnimating(false)
    }, 350)
  }, [animating])

  useEffect(() => {
    // Only auto-advance when there is more than one banner — otherwise the
    // single banner needlessly re-animates (fades out/in) every 5s.
    if (!loaded || total <= 1) return
    const timer = setInterval(() => goTo((current + 1) % total), 5000)
    return () => clearInterval(timer)
  }, [current, goTo, total, loaded])

  const banner = banners[current]
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  // While the ads are loading, show a neutral skeleton instead of the coloured
  // fallback hero — otherwise the page flashes the fallback and then swaps to
  // the real banner ("ochib yonadi").
  if (!loaded) {
    return (
      <section ref={ref} className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="w-full rounded-3xl bg-gray-100 dark:bg-white/5 animate-pulse h-[200px] sm:h-[260px] lg:h-[320px]" />
        </div>
      </section>
    )
  }

  return (
    <section ref={ref} className="w-full px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-7xl mx-auto">
        <div
          className={
            banner.image
              // Real ad: the box hugs the image at a capped height so the banner
              // stays short AND the whole image shows, uncropped. It centers in
              // the row; the sides are just the page — nothing is "filled".
              ? 'relative mx-auto w-fit max-w-full rounded-3xl overflow-hidden transition-all duration-500'
              : `relative w-full rounded-3xl overflow-hidden transition-all duration-500 bg-gradient-to-r ${banner.bg}`
          }
        >
          {banner.image ? (
            <img
              src={banner.image}
              alt=""
              loading="eager"
              decoding="async"
              className={`block h-[190px] sm:h-[260px] lg:h-[340px] w-auto max-w-full transition-opacity duration-350 ${
                animating ? 'opacity-0' : 'opacity-100'
              }`}
            />
          ) : (
            /* Fallback hero — gradient background with text + CTA */
            <div
              className={`flex flex-col justify-center h-[200px] sm:h-[260px] lg:h-[320px] px-8 sm:px-16 max-w-2xl transition-all duration-350 ${
                animating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
              }`}
            >
              <span className="inline-flex items-center gap-2 bg-white/20 text-white font-semibold text-xs px-3 py-1.5 rounded-full mb-4 w-fit backdrop-blur-sm">
                {banner.badge[lang]}
              </span>
              <h2 className="text-white font-bold text-2xl sm:text-3xl lg:text-4xl leading-tight mb-3 drop-shadow">
                {banner.title[lang]}
              </h2>
              {banner.desc[lang] && (
                <p className="text-white/80 text-sm sm:text-base mb-6 max-w-lg leading-relaxed">
                  {banner.desc[lang]}
                </p>
              )}
              <button
                onClick={() => scrollTo('CategoryGrid')}
                className="inline-flex items-center gap-2 bg-white/95 text-slate-800 font-semibold px-6 py-2.5 rounded-xl hover:bg-white transition-all duration-200 hover:-translate-y-0.5 shadow-lg w-fit text-sm"
              >
                {banner.cta[lang]}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          )}

          {/* Dots */}
          {total > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === current ? 'w-6 h-2.5 bg-white' : 'w-2.5 h-2.5 bg-white/60 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Prev/Next arrows */}
          {total > 1 && (
            <>
              <button
                onClick={() => goTo((current - 1 + total) % total)}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center text-white transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button
                onClick={() => goTo((current + 1) % total)}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center text-white transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
