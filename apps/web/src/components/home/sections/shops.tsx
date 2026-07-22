import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useScrollReveal } from '../../../hooks/useScrollReveal'
import { useLang } from '../../../context/AppContext'

const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8888'
const API_URL = `${BASE_URL}/api/v1`

interface Shop {
  id: number
  name?: string
  image?: string
  address?: string
  lat?: number
  lon?: number
  region?: { name?: string }
  delivery_amount?: number
  yandex_delivery?: boolean
  market_delivery?: boolean
}

function openYandexMap(lat?: number, lon?: number, name?: string) {
  if (lat && lon) {
    const url = `https://yandex.com/maps/?pt=${lon},${lat}&z=16&l=map&text=${encodeURIComponent(name || '')}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

const SKELETON = Array.from({ length: 6 })

export default function Shops() {
  const { lang } = useLang()
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [activeShopId, setActiveShopId] = useState<number | null>(null)
  const [showAll, setShowAll] = useState(false)
  const navigate = useNavigate()
  const ref = useScrollReveal()

  useEffect(() => {
    axios.get(`${API_URL}/shop/all`)
      .then(res => {
        const d = res.data?.data ?? res.data
        const list: Shop[] = Array.isArray(d) ? d : []
        // Newest first
        list.sort((a, b) => (b.id ?? 0) - (a.id ?? 0))
        setShops(list)
      })
      .catch(() => setShops([]))
      .finally(() => setLoading(false))
  }, [])

  // Build Yandex Maps embed URL with all shop markers
  const yandexEmbedUrl = useMemo(() => {
    const withCoords = shops.filter(s => s.lat && s.lon)
    if (withCoords.length === 0) {
      return 'https://yandex.com/map-widget/v1/?ll=64.5,41.3&z=6&l=map'
    }
    const pts = withCoords.map(s => `${s.lon},${s.lat},pm2grm1`).join('~')
    const avgLon = withCoords.reduce((a, s) => a + s.lon!, 0) / withCoords.length
    const avgLat = withCoords.reduce((a, s) => a + s.lat!, 0) / withCoords.length
    const zoom = withCoords.length === 1 ? 14 : 7
    return `https://yandex.com/map-widget/v1/?ll=${avgLon.toFixed(4)},${avgLat.toFixed(4)}&z=${zoom}&pt=${pts}&l=map`
  }, [shops])

  return (
    <section id="Shops" ref={ref} className="w-full bg-white dark:bg-slate-900 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12 reveal">
          <span className="inline-block bg-primary/10 text-primary font-semibold text-xs px-4 py-1.5 rounded-full mb-4">
            {lang === 'uz' ? "Do'konlar" : "Магазины"}
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            {lang === 'uz' ? "Bizning hamkor do'konlar" : "Наши магазины-партнёры"}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-base max-w-xl mx-auto">
            {lang === 'uz'
              ? "Yaqin atrofdagi do'konlarni xaritada toping va kartochkadan tanlang"
              : "Найдите ближайший магазин на карте или выберите из списка"}
          </p>
        </div>

        {/* Yandex Maps Embed */}
        {!loading && (
          <div className="reveal mb-10 rounded-3xl overflow-hidden shadow-xl border border-primary/10 dark:border-slate-700">
            {/* Browser chrome bar */}
            <div className="bg-slate-100 dark:bg-slate-800 px-5 py-3 flex items-center gap-3 border-b border-primary/10 dark:border-slate-700">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                <svg className="w-4 h-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                {lang === 'uz'
                  ? `${shops.filter(s => s.lat && s.lon).length} ta do'kon xaritada`
                  : `${shops.filter(s => s.lat && s.lon).length} магазинов на карте`}
              </div>
              <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">Yandex Maps</span>
            </div>
            {/* iframe */}
            <iframe
              src={yandexEmbedUrl}
              title="Yandex Maps"
              width="100%"
              height="420"
              frameBorder="0"
              allowFullScreen
              style={{ display: 'block', border: 'none' }}
            />
          </div>
        )}

        {/* Loading skeleton for map area */}
        {loading && (
          <div className="reveal mb-10 rounded-3xl overflow-hidden shadow-xl border border-primary/10 dark:border-slate-700 animate-pulse">
            <div className="bg-slate-100 dark:bg-slate-800 h-12 border-b border-slate-200 dark:border-slate-700" />
            <div className="bg-slate-200 dark:bg-slate-700" style={{ height: '420px' }} />
          </div>
        )}

        {/* Shop Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SKELETON.map((_, i) => (
              <div key={i} className="bg-slate-50 dark:bg-slate-800 rounded-3xl overflow-hidden animate-pulse">
                <div className="h-48 bg-slate-200 dark:bg-slate-700 w-full" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                  <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-2xl w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : shops.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-40" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
            </svg>
            <p className="font-medium">{lang === 'uz' ? "Do'konlar topilmadi" : "Магазинов не найдено"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(showAll ? shops : shops.slice(0, 8)).map((shop, i) => (
              <div
                key={shop.id}
                onClick={() => navigate(`/shop/${shop.id}`)}
                className={`reveal reveal-delay-${Math.min((i % 3) + 1, 6)} group flex flex-col bg-white dark:bg-slate-800 border rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer border-slate-100 dark:border-slate-700`}
              >
                {/* Shop image */}
                <div className="relative h-48 bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  {shop.image ? (
                    <img
                      src={`${BASE_URL}/static/shops/${shop.image}`}
                      alt={shop.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-slate-100 dark:to-slate-700">
                      <svg className="w-16 h-16 text-slate-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
                      </svg>
                    </div>
                  )}
                  {shop.lat && shop.lon && (
                    <div className="absolute bottom-3 right-3 bg-primary text-white p-1.5 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                      <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                      </svg>
                    </div>
                  )}
                  {shop.region?.name && (
                    <span className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-xs font-semibold text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-full shadow-sm">
                      📍 {shop.region.name}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-col flex-1 p-5 gap-3">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base leading-snug group-hover:text-primary transition-colors">
                    {shop.name || (lang === 'uz' ? "Do'kon" : "Магазин")}
                  </h3>

                  {/* Delivery badges */}
                  {(shop.yandex_delivery || shop.market_delivery) && (
                    <div className="flex flex-wrap gap-1.5">
                      {shop.yandex_delivery && (
                        <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-yellow-200 dark:border-yellow-700/40">Yandex Delivery</span>
                      )}
                      {shop.market_delivery && (
                        <span className="bg-primary/10 text-primary text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-primary/20">
                          {lang === 'uz' ? "Yetkazib berish" : "Доставка"}
                        </span>
                      )}
                    </div>
                  )}

                  {shop.address && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-start gap-2 leading-snug">
                      <svg className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                      </svg>
                      {shop.address}
                    </p>
                  )}

                  {shop.delivery_amount != null && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                      </svg>
                      {lang === 'uz' ? "Yetkazib berish:" : "Доставка:"} {shop.delivery_amount.toLocaleString()} {lang === 'uz' ? "so'm" : "сум"}
                    </p>
                  )}

                  {/* Buttons */}
                  <div className="mt-auto">
                    {shop.lat && shop.lon ? (
                      <button
                        onClick={e => { e.stopPropagation(); openYandexMap(shop.lat, shop.lon, shop.name) }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-primary text-white text-xs font-semibold hover:bg-accent transition-all duration-200 hover:shadow-lg hover:shadow-primary/20"
                      >
                        <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                        {lang === 'uz' ? 'Xaritada koʻrish' : 'На карте'}
                      </button>
                    ) : shop.address ? (
                      <button
                        onClick={e => { e.stopPropagation(); window.open(`https://yandex.com/maps/?text=${encodeURIComponent(shop.address!)}`, '_blank', 'noopener,noreferrer') }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/5 transition-all duration-200"
                      >
                        <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                        </svg>
                        {lang === 'uz' ? "Xaritada ko'rish" : "Посмотреть на карте"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Show more → navigate to /shops */}
        {!loading && shops.length > 0 && (
          <div className="text-center mt-10">
            <button
              onClick={() => navigate('/shops')}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-primary text-white font-semibold text-sm hover:bg-accent transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5"
            >
              {lang === 'uz'
                ? (shops.length > 8 ? `Barcha ${shops.length} ta do'konni ko'rish` : "Barcha do'konlarni ko'rish")
                : (shops.length > 8 ? `Посмотреть все ${shops.length} магазинов` : "Посмотреть все магазины")}
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
