import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useScrollReveal } from '../hooks/useScrollReveal'
import Navbar from '../components/home/sections/navbar'
import Footer from '../components/home/sections/footer'
import { useLang } from '../context/AppContext'
import { authService, AuthUser } from '../service/authService'
import AuthModal from '../components/auth/AuthModal'
import CartDrawer from '../components/cart/CartDrawer'

const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8888'
const API_URL = `${BASE_URL}/api/v1`

interface Region {
  id: number
  name: string
}

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
    window.open(
      `https://yandex.com/maps/?pt=${lon},${lat}&z=16&l=map&text=${encodeURIComponent(name || '')}`,
      '_blank', 'noopener,noreferrer'
    )
  }
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const toRad = (v: number) => (v * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km % 1 === 0 ? km.toFixed(0) : km.toFixed(1)} km`
}

const SKELETON = Array.from({ length: 12 })

export default function ShopsPage() {
  const { lang } = useLang()
  const navigate = useNavigate()
  const [shops, setShops] = useState<Shop[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [selectedRegion, setSelectedRegion] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeShopId, setActiveShopId] = useState<number | null>(null)
  const [user, setUser] = useState<AuthUser | null>(() => authService.getUser())
  const [authOpen, setAuthOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null)
  const revealRef = useScrollReveal()

  useEffect(() => {
    if (!navigator?.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {},
      { timeout: 8000, maximumAge: 300_000, enableHighAccuracy: false },
    )
  }, [])

  useEffect(() => {
    axios.get(`${API_URL}/region/all`)
      .then(res => {
        const d = res.data?.data ?? res.data
        setRegions(Array.isArray(d) ? d : [])
      })
      .catch(() => setRegions([]))
  }, [])

  useEffect(() => {
    axios.get(`${API_URL}/shop/all`)
      .then(res => {
        const d = res.data?.data ?? res.data
        setShops(Array.isArray(d) ? d : [])
      })
      .catch(() => setShops([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let list = shops
    if (selectedRegion !== null) {
      list = list.filter(s => (s.region as any)?.id === selectedRegion)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(s =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.address || '').toLowerCase().includes(q) ||
        (s.region?.name || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [shops, search, selectedRegion])

  // Yandex map embed URL
  const yandexEmbedUrl = useMemo(() => {
    const withCoords = filtered.filter(s => s.lat && s.lon)
    if (withCoords.length === 0) return 'https://yandex.com/map-widget/v1/?ll=64.5,41.3&z=6&l=map'
    const pts = withCoords.map(s => `${s.lon},${s.lat},pm2grm1`).join('~')
    const avgLon = withCoords.reduce((a, s) => a + s.lon!, 0) / withCoords.length
    const avgLat = withCoords.reduce((a, s) => a + s.lat!, 0) / withCoords.length
    const zoom = withCoords.length === 1 ? 14 : 7
    return `https://yandex.com/map-widget/v1/?ll=${avgLon.toFixed(4)},${avgLat.toFixed(4)}&z=${zoom}&pt=${pts}&l=map`
  }, [filtered])

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 transition-colors duration-300">
      <Navbar
        user={user}
        onAuthClick={() => setAuthOpen(true)}
        onLogout={() => { authService.logout(); setUser(null) }}
        onCartClick={() => setCartOpen(true)}
      />
      <div className="h-[76px] flex-shrink-0" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Breadcrumb + title */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-primary transition-colors mb-4"
          >
            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            {lang === 'uz' ? 'Bosh sahifa' : 'Главная'}
          </button>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="inline-block bg-primary/10 text-primary font-semibold text-xs px-4 py-1.5 rounded-full mb-3">
                {lang === 'uz' ? "Do'konlar" : "Магазины"}
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                {lang === 'uz' ? "Barcha do'konlar" : "Все магазины"}
              </h1>
              {!loading && (
                <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                  {lang === 'uz'
                    ? `${filtered.length} ta do'kon topildi`
                    : `Найдено ${filtered.length} магазинов`}
                </p>
              )}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={lang === 'uz' ? "Do'kon qidirish..." : "Поиск магазина..."}
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Region filter chips */}
          {regions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5">
              <button
                onClick={() => setSelectedRegion(null)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                  selectedRegion === null
                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary hover:text-primary'
                }`}
              >
                {lang === 'uz' ? 'Barchasi' : 'Все'}
              </button>
              {regions.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRegion(prev => prev === r.id ? null : r.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                    selectedRegion === r.id
                      ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary hover:text-primary'
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Yandex Map */}
        {!loading && (
          <div className="mb-10 rounded-3xl overflow-hidden shadow-xl border border-primary/10 dark:border-slate-700">
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
                  ? `${filtered.filter(s => s.lat && s.lon).length} ta do'kon xaritada`
                  : `${filtered.filter(s => s.lat && s.lon).length} магазинов на карте`}
              </div>
              <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">Yandex Maps</span>
            </div>
            <iframe
              src={yandexEmbedUrl}
              title="Yandex Maps"
              width="100%"
              height="480"
              frameBorder="0"
              allowFullScreen
              style={{ display: 'block', border: 'none' }}
            />
          </div>
        )}

        {/* Loading map skeleton */}
        {loading && (
          <div className="mb-10 rounded-3xl overflow-hidden shadow-xl border border-primary/10 dark:border-slate-700 animate-pulse">
            <div className="bg-slate-100 dark:bg-slate-800 h-12 border-b border-slate-200 dark:border-slate-700" />
            <div className="bg-slate-200 dark:bg-slate-700" style={{ height: 480 }} />
          </div>
        )}

        {/* Cards */}
        <div ref={revealRef}>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {SKELETON.map((_, i) => (
              <div key={i} className="bg-slate-50 dark:bg-slate-800 rounded-3xl overflow-hidden animate-pulse">
                <div className="h-44 bg-slate-200 dark:bg-slate-700 w-full" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                  <div className="h-9 bg-slate-200 dark:bg-slate-700 rounded-2xl w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <svg className="w-14 h-14 mx-auto mb-4 opacity-30" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
            </svg>
            <p className="font-semibold text-lg">{lang === 'uz' ? "Do'konlar topilmadi" : "Магазинов не найдено"}</p>
            {search && (
              <button onClick={() => setSearch('')} className="mt-3 text-primary text-sm hover:underline">
                {lang === 'uz' ? "Qidiruvni tozalash" : "Очистить поиск"}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((shop, i) => (
              <div
                key={shop.id}
                onClick={() => navigate(`/shop/${shop.id}`)}
                style={{ transitionDelay: `${i * 0.07}s` }}
                className={`reveal group flex flex-col bg-white dark:bg-slate-800 border rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer ${
                  activeShopId === shop.id
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-slate-100 dark:border-slate-700'
                }`}
              >
                {/* Image */}
                <div className="relative h-44 bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  {shop.image ? (
                    <img
                      src={`${BASE_URL}/static/shops/${shop.image}`}
                      alt={shop.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-slate-100 dark:to-slate-700">
                      <svg className="w-14 h-14 text-slate-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
                      </svg>
                    </div>
                  )}
                  {shop.lat && shop.lon && (
                    <div className="absolute bottom-2 right-2 bg-primary text-white p-1.5 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                      <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                      </svg>
                    </div>
                  )}
                  {shop.region?.name && (
                    <span className="absolute top-2 left-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-xs font-semibold text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded-full shadow-sm">
                      📍 {shop.region.name}
                    </span>
                  )}
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    {shop.yandex_delivery && (
                      <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">Yandex</span>
                    )}
                    {shop.market_delivery && (
                      <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        {lang === 'uz' ? "Yetkazib berish" : "Доставка"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex flex-col flex-1 p-4 gap-2">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm leading-snug group-hover:text-primary transition-colors">
                    {shop.name || (lang === 'uz' ? "Do'kon" : "Магазин")}
                  </h3>
                  {shop.address && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5 leading-snug">
                      <svg className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                      </svg>
                      <span className="flex-1 min-w-0 truncate">{shop.address}</span>
                    </p>
                  )}
                  {userCoords && shop.lat && shop.lon && (
                    <p className="text-xs font-bold text-primary flex items-center gap-1">
                      <svg className="w-3 h-3 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                      </svg>
                      {formatKm(haversineKm(userCoords.lat, userCoords.lon, shop.lat, shop.lon))} {lang === 'uz' ? 'sizdan' : 'от вас'}
                    </p>
                  )}
                  {shop.delivery_amount != null && (
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {lang === 'uz' ? "Yetkazib berish:" : "Доставка:"} {shop.delivery_amount.toLocaleString()} {lang === 'uz' ? "so'm" : "сум"}
                    </p>
                  )}

                  <div className="mt-auto flex gap-2 pt-1">
                    {shop.lat && shop.lon ? (
                      <>
                        <button
                          onClick={e => { e.stopPropagation(); openYandexMap(shop.lat, shop.lon, shop.name) }}
                          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-accent transition-all"
                        >
                          <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                          </svg>
                          {lang === 'uz' ? 'Xaritada' : 'На карте'}
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); window.open(`https://yandex.com/maps/?pt=${shop.lon},${shop.lat}&z=16&l=map&text=${encodeURIComponent(shop.name || '')}`, '_blank', 'noopener,noreferrer') }}
                          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border border-primary/40 text-primary text-xs font-semibold hover:bg-primary/5 transition-all"
                        >
                          <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                          Yandex
                        </button>
                      </>
                    ) : shop.address ? (
                      <button
                        onClick={e => { e.stopPropagation(); window.open(`https://yandex.com/maps/?text=${encodeURIComponent(shop.address!)}`, '_blank', 'noopener,noreferrer') }}
                        className="w-full flex items-center justify-center gap-1 py-2 rounded-xl border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/5 transition-all"
                      >
                        <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                        </svg>
                        {lang === 'uz' ? "Xaritada ko'rish" : "Посмотреть"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </main>

      <Footer />

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuth={() => setUser(authService.getUser())}
        lang={lang}
      />
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onAuthRequired={() => { setCartOpen(false); setAuthOpen(true) }}
        user={user}
      />
    </div>
  )
}
