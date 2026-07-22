import React, { useEffect, useState, useMemo, useCallback } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/home/sections/navbar'
import AuthModal from '../components/auth/AuthModal'
import CartDrawer from '../components/cart/CartDrawer'
import { useLang } from '../context/AppContext'
import { authService, AuthUser } from '../service/authService'
import StoreFilter from '../components/store/StoreFilter'

const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8888'
const API_URL = `${BASE_URL}/api/v1`

// ── Types ─────────────────────────────────────────────────────────────────────
interface Category {
  id: number
  name?: string
  name_uz?: string
  name_ru?: string
  image?: string
}

interface Shop {
  id: number
  name?: string
  image?: string
  address?: string
  lat?: number
  lon?: number
  region?: { id?: number; name?: string }
  delivery_amount?: number
  yandex_delivery?: boolean
  market_delivery?: boolean
}

interface Product {
  id: number
  name?: string
  name_uz?: string
  name_ru?: string
  image?: string
  price?: number
  category?: { id: number; name_uz?: string; name_ru?: string; name?: string }
  shop?: { id: number; name?: string }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatCount(n: number) {
  if (n <= 0) return ''
  if (n >= 1000) return `${Math.floor(n / 1000)}K+`
  if (n >= 100) return `${Math.floor(n / 100) * 100}+`
  if (n >= 10) return `${Math.floor(n / 10) * 10}+`
  return `${n}+`
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

const SKELETONS = Array.from({ length: 8 })

// ── Main Component ─────────────────────────────────────────────────────────────
export default function StorePage() {
  const { lang } = useLang()
  const navigate = useNavigate()

  const [tab, setTab] = useState<'categories' | 'shops'>('categories')
  const [user, setUser] = useState<AuthUser | null>(() => authService.getUser())
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null)

  useEffect(() => {
    if (!navigator?.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {},
      { timeout: 8000, maximumAge: 300_000, enableHighAccuracy: false },
    )
  }, [])
  const [authOpen, setAuthOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)

  // ── categories state ──
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [productCounts, setProductCounts] = useState<Record<number, number>>({})
  const [catsLoading, setCatsLoading] = useState(true)

  // ── shops state ──
  const [shops, setShops] = useState<Shop[]>([])
  const [shopsLoading, setShopsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRegion, setFilterRegion] = useState('')
  const [filterShopRegions, setFilterShopRegions] = useState<string[]>([])
  // shops filters
  const [filterMinKm, setFilterMinKm] = useState('')
  const [filterMaxKm, setFilterMaxKm] = useState('')
  // products filters
  const [filterMinPrice, setFilterMinPrice] = useState('')
  const [filterMaxPrice, setFilterMaxPrice] = useState('')

  // Expand Telegram WebApp if available
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (tg) {
      tg.ready()
      tg.expand()
    }
  }, [])

  // Auto-login from ?token= URL param (store bot redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token && !authService.getToken()) {
      const loggedInUser = authService.autoLoginFromToken(token)
      if (loggedInUser) setUser(loggedInUser)
    }
    if (token) {
      const cleanUrl = window.location.pathname + window.location.hash
      window.history.replaceState(null, '', cleanUrl)
    }
  }, [])

  // Auto-logout on 401
  useEffect(() => {
    const handler = () => setUser(null)
    window.addEventListener('diametr:unauthorized', handler)
    return () => window.removeEventListener('diametr:unauthorized', handler)
  }, [])

  // Fetch categories + product counts
  useEffect(() => {
    Promise.all([
      axios.get(`${API_URL}/category/all`),
      axios.get(`${API_URL}/product/all`),
    ])
      .then(([catRes, prodRes]) => {
        const cats: Category[] = Array.isArray(catRes.data?.data ?? catRes.data)
          ? (catRes.data?.data ?? catRes.data)
          : []
        const prods: Array<{ category?: { id: number } }> = Array.isArray(
          prodRes.data?.data ?? prodRes.data
        )
          ? prodRes.data?.data ?? prodRes.data
          : []
        const counts: Record<number, number> = {}
        prods.forEach(p => {
          if (p.category?.id) counts[p.category.id] = (counts[p.category.id] || 0) + 1
        })
        setCategories(cats)
        setProducts(prods as Product[])
        setProductCounts(counts)
      })
      .catch(() => setCategories([]))
      .finally(() => setCatsLoading(false))
  }, [])

  // Fetch shops
  useEffect(() => {
    axios.get(`${API_URL}/shop/all`)
      .then(res => {
        const d = res.data?.data ?? res.data
        setShops(Array.isArray(d) ? d : [])
      })
      .catch(() => setShops([]))
      .finally(() => setShopsLoading(false))
  }, [])

  const getCatName = useCallback(
    (c: Category) =>
      lang === 'ru'
        ? c.name_ru || c.name_uz || c.name || ''
        : c.name_uz || c.name_ru || c.name || '',
    [lang]
  )

  // Region list from shops
  const regions = useMemo(() => {
    const seen = new Set<string>()
    const list: string[] = []
    shops.forEach(s => {
      const r = s.region?.name
      if (r && !seen.has(r)) { seen.add(r); list.push(r) }
    })
    return list.sort()
  }, [shops])

  // Price/km mask helpers
  const parseNum = (v: string) => Number(v.replace(/\./g, '')) || 0

  const filteredShops = useMemo(() => {
    let list = shops
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(s =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.address || '').toLowerCase().includes(q) ||
        (s.region?.name || '').toLowerCase().includes(q)
      )
    }
    if (filterShopRegions.length > 0) list = list.filter(s => filterShopRegions.includes(s.region?.name || ''))
    if (userCoords && (filterMinKm || filterMaxKm)) {
      list = list.filter(s => {
        if (!s.lat || !s.lon) return true
        const km = haversineKm(userCoords.lat, userCoords.lon, s.lat, s.lon)
        if (filterMinKm && km < parseNum(filterMinKm)) return false
        if (filterMaxKm && km > parseNum(filterMaxKm)) return false
        return true
      })
    }
    return list
  }, [shops, search, filterShopRegions, filterMinKm, filterMaxKm, userCoords])

  const filteredCategories = useMemo(() => {
    let list = categories
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        (c.name_uz || '').toLowerCase().includes(q) ||
        (c.name_ru || '').toLowerCase().includes(q) ||
        (c.name || '').toLowerCase().includes(q)
      )
    }
    if (filterRegion) {
      const shopIdsInRegion = new Set(shops.filter(s => s.region?.name === filterRegion).map(s => s.id))
      const catIds = new Set(
        products
          .filter(p => p.shop && shopIdsInRegion.has(p.shop.id) && p.category?.id)
          .map(p => p.category!.id)
      )
      list = list.filter(c => catIds.has(c.id))
    }
    return list
  }, [categories, search, filterRegion, shops, products])

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    let list = products.filter(p =>
      (p.name_uz || '').toLowerCase().includes(q) ||
      (p.name_ru || '').toLowerCase().includes(q) ||
      (p.name || '').toLowerCase().includes(q)
    )
    if (filterRegion) {
      const shopIds = new Set(shops.filter(s => s.region?.name === filterRegion).map(s => s.id))
      list = list.filter(p => !p.shop || shopIds.has(p.shop.id))
    }
    if (filterMinPrice) list = list.filter(p => p.price == null || p.price >= parseNum(filterMinPrice))
    if (filterMaxPrice) list = list.filter(p => p.price == null || p.price <= parseNum(filterMaxPrice))
    return list
  }, [products, search, filterRegion, shops, filterMinPrice, filterMaxPrice])

  const getProductName = useCallback(
    (p: Product) =>
      lang === 'ru'
        ? p.name_ru || p.name_uz || p.name || ''
        : p.name_uz || p.name_ru || p.name || '',
    [lang]
  )

  const handleAuth = useCallback(() => setUser(authService.getUser()), [])
  const handleLogout = useCallback(() => { authService.logout(); setUser(null) }, [])

  const hasFilter = !!(filterRegion || filterShopRegions.length > 0 || filterMinKm || filterMaxKm || filterMinPrice || filterMaxPrice)
  const resetAll = () => { setFilterRegion(''); setFilterShopRegions([]); setFilterMinKm(''); setFilterMaxKm(''); setFilterMinPrice(''); setFilterMaxPrice('') }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 transition-colors duration-300">
      {/* Navbar */}
      <Navbar
        user={user}
        onAuthClick={() => setAuthOpen(true)}
        onLogout={handleLogout}
        onCartClick={() => setCartOpen(true)}
      />
      <div className="h-[76px] flex-shrink-0" />

      {/* Sticky header */}
      <div className="sticky top-[76px] z-30 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">

          {/* Row 1 — Region chips (above tabs, only for categories) */}
          {regions.length > 0 && tab === 'categories' && (
            <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-2" style={{ scrollbarWidth: 'none' }}>
              <button
                onClick={() => setFilterRegion('')}
                className={`flex-shrink-0 h-7 px-3 rounded-full text-xs font-semibold transition-all ${
                  !filterRegion ? 'bg-primary text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary'
                }`}
              >
                {lang === 'ru' ? 'Все' : 'Barchasi'}
              </button>
              {regions.map(r => (
                <button
                  key={r}
                  onClick={() => setFilterRegion(filterRegion === r ? '' : r)}
                  className={`flex-shrink-0 h-7 px-3 rounded-full text-xs font-semibold transition-all ${
                    filterRegion === r ? 'bg-primary text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary'
                  }`}
                >{r}</button>
              ))}
            </div>
          )}

          {/* Row 2 — Tabs + Search */}
          <div className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-800">
            {(['categories', 'shops'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setSearch(''); resetAll() }}
                className={`py-3.5 text-sm font-semibold transition-colors relative whitespace-nowrap
                  ${tab === t
                    ? 'text-primary'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
              >
                {t === 'categories'
                  ? lang === 'ru' ? 'Товары' : 'Mahsulotlar'
                  : lang === 'ru' ? 'Магазины' : "Do'konlar"}
                {tab === t && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 rounded-full bg-primary" />
                )}
              </button>
            ))}
            {/* Unified search */}
            <div className="relative flex-1 ml-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={tab === 'categories'
                  ? (lang === 'ru' ? 'Товар...' : 'Mahsulot...')
                  : (lang === 'ru' ? 'Do\'kon...' : "Do'kon...")}
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-400 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
                </button>
              )}
            </div>
          </div>

          {/* Row 3 — Numeric filters */}
          <div className="border-t border-slate-100 dark:border-slate-800">
            <StoreFilter
              tab={tab}
              lang={lang}
              filterMinPrice={filterMinPrice}
              filterMaxPrice={filterMaxPrice}
              setFilterMinPrice={setFilterMinPrice}
              setFilterMaxPrice={setFilterMaxPrice}
              filterMinKm={filterMinKm}
              filterMaxKm={filterMaxKm}
              setFilterMinKm={setFilterMinKm}
              setFilterMaxKm={setFilterMaxKm}
              userCoords={userCoords}
              hasFilter={hasFilter}
              resetAll={resetAll}
              regions={regions}
              filterShopRegions={filterShopRegions}
              setFilterShopRegions={setFilterShopRegions}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ── CATEGORIES TAB ── */}
        {tab === 'categories' && (
          <>
            {/* — No search: show all categories — */}
            {!search.trim() && (
              <>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white mb-5">
                  {lang === 'ru' ? 'Товары' : 'Mahsulotlar'}
                </h1>
                {catsLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                    {SKELETONS.map((_, i) => (
                      <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden animate-pulse border border-slate-100 dark:border-slate-700">
                        <div className="h-28 bg-slate-200 dark:bg-slate-700 w-full" />
                        <div className="px-3 py-2.5"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" /></div>
                      </div>
                    ))}
                  </div>
                ) : categories.length === 0 ? (
                  <p className="text-center py-16 text-slate-400">{lang === 'ru' ? 'Товары не найдены' : 'Mahsulotlar topilmadi'}</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                    {categories.map((cat, i) => {
                      const count = productCounts[cat.id] || 0
                      return (
                        <div key={cat.id} onClick={() => navigate(`/category/${cat.id}`)} className="group relative flex flex-col bg-white dark:bg-slate-800 border border-primary/20 dark:border-slate-700 rounded-2xl overflow-hidden hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 cursor-pointer hover:-translate-y-0.5">
                          <div className="relative h-28 sm:h-32 bg-gradient-to-br from-primary/5 to-slate-100 dark:from-primary/10 dark:to-slate-700 overflow-hidden">
                            {cat.image ? (<img src={`${BASE_URL}/static/categories/${cat.image}`} alt={getCatName(cat)} width={288} height={128} loading={i < 4 ? 'eager' : 'lazy'} fetchPriority={i < 4 ? 'high' : undefined} decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={e => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />) : (<div className="w-full h-full flex items-center justify-center"><span className="text-4xl group-hover:scale-110 transition-transform duration-200">📦</span></div>)}
                            {count > 0 && (<span className="absolute top-2 right-2 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">{formatCount(count)}</span>)}
                          </div>
                          <div className="px-3 py-2.5 flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-snug group-hover:text-primary transition-colors line-clamp-2">{getCatName(cat)}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 flex-shrink-0 text-slate-300 dark:text-slate-500 group-hover:text-primary transition-colors"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            {/* — Search active: show categories + products separately — */}
            {search.trim() && (
              <>
                {/* Section: Kategoriyalar */}
                <div className="mb-8">
                  <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                    {lang === 'ru' ? 'Категории' : 'Kategoriyalar'}
                    <span className="ml-2 text-primary">{filteredCategories.length}</span>
                  </h2>
                  {filteredCategories.length === 0 ? (
                    <p className="text-slate-400 text-sm py-4">{lang === 'ru' ? 'Нет совпадений' : 'Topilmadi'}</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                      {filteredCategories.map((cat, i) => {
                        const count = productCounts[cat.id] || 0
                        return (
                          <div key={cat.id} onClick={() => navigate(`/category/${cat.id}`)} className="group relative flex flex-col bg-white dark:bg-slate-800 border border-primary/20 dark:border-slate-700 rounded-2xl overflow-hidden hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 cursor-pointer hover:-translate-y-0.5">
                            <div className="relative h-28 sm:h-32 bg-gradient-to-br from-primary/5 to-slate-100 dark:from-primary/10 dark:to-slate-700 overflow-hidden">
                              {cat.image ? (<img src={`${BASE_URL}/static/categories/${cat.image}`} alt={getCatName(cat)} width={288} height={128} loading={i < 4 ? 'eager' : 'lazy'} fetchPriority={i < 4 ? 'high' : undefined} decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={e => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />) : (<div className="w-full h-full flex items-center justify-center"><span className="text-4xl">📦</span></div>)}
                              {count > 0 && (<span className="absolute top-2 right-2 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">{formatCount(count)}</span>)}
                            </div>
                            <div className="px-3 py-2.5 flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-snug group-hover:text-primary transition-colors line-clamp-2">{getCatName(cat)}</span>
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 flex-shrink-0 text-slate-300 dark:text-slate-500 group-hover:text-primary transition-colors"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Section: Mahsulotlar */}
                <div>
                  <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                    {lang === 'ru' ? 'Товары' : 'Mahsulotlar'}
                    <span className="ml-2 text-primary">{filteredProducts.length}</span>
                  </h2>
                  {filteredProducts.length === 0 ? (
                    <p className="text-slate-400 text-sm py-4">{lang === 'ru' ? 'Нет совпадений' : 'Topilmadi'}</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                      {filteredProducts.map(prod => (
                        <div key={prod.id} onClick={() => prod.category?.id && navigate(`/category/${prod.category.id}`)} className="group flex flex-col bg-white dark:bg-slate-800 border border-primary/20 dark:border-slate-700 rounded-2xl overflow-hidden hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 cursor-pointer hover:-translate-y-0.5">
                          <div className="relative h-28 sm:h-32 bg-gradient-to-br from-primary/5 to-slate-100 dark:from-primary/10 dark:to-slate-700 overflow-hidden">
                            {prod.image ? (<img src={`${BASE_URL}/static/products/${prod.image}`} alt={getProductName(prod)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={e => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />) : (<div className="w-full h-full flex items-center justify-center"><span className="text-4xl">📦</span></div>)}
                          </div>
                          <div className="px-3 py-2.5 flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-snug group-hover:text-primary transition-colors line-clamp-2">{getProductName(prod)}</span>
                            {prod.category && (
                              <span className="text-[10px] text-slate-400 line-clamp-1">
                                {lang === 'ru' ? prod.category.name_ru || prod.category.name_uz || prod.category.name : prod.category.name_uz || prod.category.name_ru || prod.category.name}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* ── SHOPS TAB ── */}
        {tab === 'shops' && (
          <>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
              {lang === 'ru' ? 'Магазины' : "Do'konlar"}
            </h1>



            {shopsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {SKELETONS.map((_, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden animate-pulse border border-slate-100 dark:border-slate-700">
                    <div className="h-40 bg-slate-200 dark:bg-slate-700 w-full" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredShops.length === 0 ? (
              <p className="text-center py-16 text-slate-400">
                {lang === 'ru' ? 'Магазины не найдены' : "Do'konlar topilmadi"}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredShops.map(shop => (
                  <div
                    key={shop.id}
                    onClick={() => navigate(`/shop/${shop.id}`)}
                    className="group bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl overflow-hidden hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
                  >
                    {/* Image */}
                    <div className="relative h-40 bg-gradient-to-br from-primary/5 to-slate-100 dark:from-primary/10 dark:to-slate-700 overflow-hidden">
                      {shop.image ? (
                        <img
                          src={`${BASE_URL}/static/shops/${shop.image}`}
                          alt={shop.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={e => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-5xl">🏪</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug mb-1 group-hover:text-primary transition-colors line-clamp-1">
                        {shop.name || (lang === 'ru' ? 'Магазин' : "Do'kon")}
                      </h3>
                      {shop.region?.name && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 flex-shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                          </svg>
                          {shop.region.name}
                        </p>
                      )}
                      {shop.address && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1">{shop.address}</p>
                      )}
                      {userCoords && shop.lat && shop.lon && (
                        <p className="text-xs font-bold text-primary flex items-center gap-1 mt-0.5">
                          <svg className="w-3 h-3 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                          </svg>
                          {formatKm(haversineKm(userCoords.lat, userCoords.lon, shop.lat, shop.lon))} {lang === 'ru' ? 'от вас' : 'sizdan'}
                        </p>
                      )}
                      {/* Delivery badges */}
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {shop.yandex_delivery && (
                          <span className="text-[10px] font-semibold bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-200 dark:border-yellow-800">
                            Yandex
                          </span>
                        )}
                        {shop.market_delivery && (
                          <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                            {lang === 'ru' ? 'Доставка' : 'Yetkazish'}
                          </span>
                        )}
                        {shop.delivery_amount != null && shop.delivery_amount > 0 && (
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                            {shop.delivery_amount.toLocaleString()} {lang === 'ru' ? 'сум' : "so'm"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuth={handleAuth}
      />
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        user={user}
        onAuthRequired={() => { setCartOpen(false); setAuthOpen(true) }}
      />
    </div>
  )
}
