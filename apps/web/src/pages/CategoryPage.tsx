import React, { useEffect, useState, useRef, useCallback, useLayoutEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useLang } from '../context/AppContext'
import { useCart } from '../context/CartContext'
import Navbar from '../components/home/sections/navbar'
import AuthModal from '../components/auth/AuthModal'
import CartDrawer from '../components/cart/CartDrawer'
import { authService, AuthUser } from '../service/authService'
import { useScrollReveal } from '../hooks/useScrollReveal'

const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8888'
const API_URL = `${BASE_URL}/api/v1`

interface Product {
  id: number
  name?: string
  name_uz?: string
  name_ru?: string
  image?: string
  desc?: string
  category?: { id: number; name_uz?: string; name_ru?: string; name?: string }
  items?: Array<{
    id: number
    name?: string
    name_uz?: string
    name_ru?: string
    shop_products?: Array<{
      id: number
      price?: number
      bonus_price?: number | null
      count?: number
      shop?: { id: number; name?: string; address?: string; lat?: number; lon?: number; image?: string }
    }>
  }>
}

interface Category {
  id: number
  name?: string
  name_uz?: string
  name_ru?: string
  image?: string
}

const SKELETON = Array.from({ length: 8 })

export default function CategoryPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { lang } = useLang()
  const [products, setProducts] = useState<Product[]>([])
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Product | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(() => authService.getUser())
  const [authOpen, setAuthOpen] = useState(false)
  const revealRef = useScrollReveal()
  const [cartOpen, setCartOpen] = useState(false)
  const [pricesMap, setPricesMap] = useState<Record<number, number>>({})
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set())
  const { addItem } = useCart()
  const modalRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Category chip strip — measure how many fit in one row
  const chipsWrapperRef = useRef<HTMLDivElement>(null)
  const [showAllCats, setShowAllCats] = useState(false)
  const [visibleChipCount, setVisibleChipCount] = useState<number | null>(null)

  const measureChips = useCallback(() => {
    const wrap = chipsWrapperRef.current
    if (!wrap) return
    const chips = Array.from(wrap.querySelectorAll<HTMLElement>('[data-chip]'))
    if (chips.length === 0) return
    // Reserve space for the toggle button + safety padding
    const toggleBtn = wrap.querySelector<HTMLElement>('[data-chip-toggle]')
    const reserved = (toggleBtn ? toggleBtn.offsetWidth : 130) + 32
    const wrapWidth = wrap.clientWidth - reserved
    let used = 0
    let count = 0
    // Temporarily un-hide all chips to measure their natural width
    const prevDisplay: string[] = chips.map(c => c.style.display)
    chips.forEach(c => { c.style.display = '' })
    for (const chip of chips) {
      const w = chip.offsetWidth + 8 // gap-2
      if (used + w > wrapWidth) break
      used += w
      count++
    }
    // Restore (state will re-render correctly anyway)
    chips.forEach((c, i) => { c.style.display = prevDisplay[i] })
    if (count < 1) count = 1
    setVisibleChipCount(count)
  }, [])

  useLayoutEffect(() => {
    if (allCategories.length === 0) return
    measureChips()
    const onResize = () => measureChips()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [allCategories, lang, measureChips])

  // Auto-focus search when navigated from navbar search icon
  useEffect(() => {
    const state = location.state as { focusSearch?: boolean } | null
    if (state?.focusSearch) {
      // small delay so the input is mounted
      setTimeout(() => searchInputRef.current?.focus(), 80)
      // clear the state so refresh won't re-focus
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location, navigate])

  // Close modal on backdrop click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setSelected(null)
      }
    }
    if (selected) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [selected])

  // Fetch products & category info
  useEffect(() => {
    setLoading(true)
    setSearch('')
    setMinPrice('')
    setMaxPrice('')

    const isAll = id === 'all'
    const catId = Number(id)
    // Let the server filter by category instead of pulling the whole catalogue
    const byCategory = !isAll && Number.isFinite(catId)

    Promise.all([
      axios.get(byCategory ? `${API_URL}/product?category_id=${catId}` : `${API_URL}/product/all`),
      axios.get(`${API_URL}/category/all`),
    ])
      .then(([prodRes, catRes]) => {
        const allProds: Product[] = Array.isArray(prodRes.data?.data ?? prodRes.data)
          ? (prodRes.data?.data ?? prodRes.data)
          : []
        const allCats: Category[] = Array.isArray(catRes.data?.data ?? catRes.data)
          ? (catRes.data?.data ?? catRes.data)
          : []

        // Newest first by id
        allProds.sort((a, b) => (b.id ?? 0) - (a.id ?? 0))
        // Category chips: newest first (id desc)
        const sortedCats = [...allCats].sort((a, b) => (b.id ?? 0) - (a.id ?? 0))

        setProducts(byCategory || isAll ? allProds : allProds.filter(p => p.category?.id === catId))
        setCategory(isAll ? null : (allCats.find(c => c.id === catId) || null))
        setAllCategories(sortedCats)
      })
      .catch(() => { setProducts([]); setCategory(null) })
      .finally(() => setLoading(false))
  }, [id])

  const openDetail = (p: Product) => {
    setSelected(null)
    setDetailLoading(true)
    axios.get(`${API_URL}/product/${p.id}`)
      .then(res => {
        const data = res.data?.data ?? res.data
        setSelected(data || p)
      })
      .catch(() => setSelected(p))
      .finally(() => setDetailLoading(false))
  }

  // Batch-fetch product prices in background — delayed + throttled so the
  // product images get the connection pool first, one state commit per wave
  useEffect(() => {
    if (products.length === 0) return
    let cancelled = false
    const controller = new AbortController()

    const minPriceOf = (data: any) => {
      let minP = Infinity
      ;(data?.items ?? []).forEach((item: any) => {
        ;(item.shop_products ?? []).forEach((sp: any) => {
          const eff = (sp.bonus_price != null && sp.bonus_price > 0 && (sp.price == null || sp.bonus_price < sp.price))
            ? sp.bonus_price
            : sp.price
          if (eff != null && eff < minP) minP = eff
        })
      })
      return minP
    }

    const timer = setTimeout(async () => {
      const queue = products.filter(p => pricesMap[p.id] == null)
      for (let i = 0; i < queue.length; i += 3) {
        if (cancelled) return
        const wave = queue.slice(i, i + 3)
        const results = await Promise.all(wave.map(p =>
          axios.get(`${API_URL}/product/${p.id}`, { signal: controller.signal })
            .then(res => {
              const minP = minPriceOf(res.data?.data ?? res.data)
              return minP !== Infinity ? ([p.id, minP] as [number, number]) : null
            })
            .catch(() => null)
        ))
        if (cancelled) return
        const found = results.filter(Boolean) as Array<[number, number]>
        if (found.length > 0) {
          setPricesMap(prev => {
            const next = { ...prev }
            found.forEach(([pid, minP]) => { next[pid] = minP })
            return next
          })
        }
      }
    }, 1200)

    return () => {
      cancelled = true
      clearTimeout(timer)
      controller.abort()
    }
  }, [products]) // eslint-disable-line

  // ── Price mask helpers (300.000 format) ──
  const fmtInput = (v: string) => {
    const raw = v.replace(/\D/g, '')
    if (!raw) return ''
    return raw.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }
  const parseInput = (v: string) => v.replace(/\./g, '')

  const getName = (p: { name?: string; name_uz?: string; name_ru?: string }) =>
    lang === 'ru' ? p.name_ru || p.name_uz || p.name || '' : p.name_uz || p.name_ru || p.name || ''

  const handleAddToCart = useCallback((sp: {
    id: number; price?: number; bonus_price?: number | null; count?: number
    shop?: { id: number; name?: string; address?: string; lat?: number; lon?: number; image?: string }
  }) => {
    if (!selected || sp.price == null) return
    const productName = getName(selected)
    const shopName = sp.shop?.name ?? (lang === 'uz' ? "Do'kon" : 'Магазин')
    const finalPrice = sp.bonus_price != null && sp.bonus_price > 0 && sp.bonus_price < sp.price ? sp.bonus_price : sp.price
    addItem({
      shopProductId: sp.id,
      productId: selected.id,
      productName,
      productNameRu: selected.name_ru,
      productImage: selected.image,
      shopId: sp.shop?.id ?? 0,
      shopName,
      price: finalPrice,
      maxQty: sp.count,
    })
    // Button flash animation
    setAddedIds(prev => new Set(prev).add(sp.id))
    setTimeout(() => setAddedIds(prev => { const s = new Set(prev); s.delete(sp.id); return s }), 1600)
    // Toast
    toast(
      <div className="flex items-center gap-3 px-4 py-3.5 w-full">
        {/* Thumbnail */}
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100">
          {selected.image
            ? <img src={`${BASE_URL}/static/products/${selected.image}`} alt={productName} width={48} height={48} decoding="async" className="w-full h-full object-cover" onError={e => { (e.currentTarget as HTMLImageElement).style.display='none' }} />
            : <div className="w-full h-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-slate-300"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg></div>
          }
        </div>
        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-4 h-4 rounded-full bg-[#00C48C] flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-2.5 h-2.5"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
            </span>
            <p className="text-[13px] font-bold text-slate-800">
              {lang === 'uz' ? 'Savatga qo\'shildi!' : 'Добавлено в корзину!'}
            </p>
          </div>
          <p className="text-[11px] text-slate-500 truncate">{productName}</p>
          <p className="text-[11px] text-[#00C48C] font-semibold truncate">{shopName} · {sp.price!.toLocaleString()} {lang === 'uz' ? "so'm" : 'сум'}</p>
        </div>
      </div>,
      { icon: false, autoClose: 2500, pauseOnHover: false }
    )
  }, [selected, addItem, lang])

  const catName = id === 'all'
    ? (lang === 'uz' ? 'Barcha mahsulotlar' : 'Все товары')
    : (category ? getName(category) : '...')
  const filtered = products.filter(p => {
    const q = search.trim().toLowerCase()
    if (q) {
      const cat = p.category
      const haystack = [
        p.name_uz, p.name_ru, p.name, p.desc,
        cat?.name_uz, cat?.name_ru, cat?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(q)) return false
    }
    const price = pricesMap[p.id]
    if (price != null) {
      if (minPrice && price < Number(parseInput(minPrice))) return false
      if (maxPrice && price > Number(parseInput(maxPrice))) return false
    }
    return true
  })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Shared Navbar */}
      <Navbar
        user={user}
        onAuthClick={() => setAuthOpen(true)}
        onLogout={() => { authService.logout(); setUser(null) }}
        onCartClick={() => setCartOpen(true)}
      />
      <div className="h-[76px] flex-shrink-0" />

      {/* Category tabs strip — fit-in-row + show-all toggle */}
      {allCategories.length > 0 && (
        <div className="w-full bg-white dark:bg-slate-900/95 border-b border-primary/10 dark:border-slate-700/50 sticky top-[76px] z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              ref={chipsWrapperRef}
              className={`flex items-center gap-2 py-2 ${showAllCats ? 'flex-wrap' : 'flex-nowrap'}`}
            >
              <div className={`flex items-center gap-2 ${showAllCats ? 'flex-wrap' : 'flex-nowrap min-w-0 flex-1'}`}>
                {/* Hammasi chip */}
                <button
                  data-chip
                  onClick={() => navigate('/category/all')}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                    id === 'all'
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20'
                  }`}
                >
                  {lang === 'uz' ? 'Hammasi' : 'Все'}
                </button>
                {allCategories.map((cat, idx) => {
                  const isHidden = !showAllCats && visibleChipCount != null && idx + 1 >= visibleChipCount
                  return (
                    <button
                      key={cat.id}
                      data-chip
                      onClick={() => navigate(`/category/${cat.id}`)}
                      style={isHidden ? { display: 'none' } : undefined}
                      className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                        cat.id === Number(id)
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20'
                      }`}
                    >
                      {lang === 'ru' ? cat.name_ru || cat.name_uz || cat.name : cat.name_uz || cat.name_ru || cat.name}
                    </button>
                  )
                })}
              </div>
              {/* Toggle button — outside scroll container, never clipped */}
              {visibleChipCount != null && allCategories.length + 1 > visibleChipCount && (
                <button
                  data-chip-toggle
                  onClick={() => setShowAllCats(s => !s)}
                  className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-primary/30 text-primary hover:bg-primary hover:text-white transition-all duration-150 whitespace-nowrap"
                >
                  {showAllCats
                    ? (lang === 'uz' ? 'Kamroq' : 'Свернуть')
                    : (lang === 'uz' ? `Hammasi (${allCategories.length})` : `Все (${allCategories.length})`)}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ── Compact toolbar row ─────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">

          {/* Left: title + count */}
          <div className="flex items-center gap-3 min-w-0">
            {category?.image && (
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-primary/20 flex-shrink-0">
                <img
                  src={`${BASE_URL}/static/categories/${category.image}`}
                  alt={catName}
                  width={40}
                  height={40}
                  decoding="async"
                  fetchPriority="high"
                  className="w-full h-full object-cover"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-slate-800 dark:text-white leading-tight truncate">{catName}</h1>
              {!loading && (
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {lang === 'uz' ? `${filtered.length} ta mahsulot` : `${filtered.length} товаров`}
                </p>
              )}
            </div>
          </div>

          {/* Right: search */}
          <div className="relative flex-1 sm:max-w-sm sm:ml-auto">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              ref={searchInputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={lang === 'uz' ? 'Mahsulot yoki kategoriya...' : 'Товар или категория...'}
              className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Price filter row */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-semibold text-slate-400 whitespace-nowrap hidden sm:block">
              {lang === 'uz' ? 'Narx:' : 'Цена:'}
            </span>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={minPrice}
                onChange={e => setMinPrice(fmtInput(e.target.value))}
                placeholder={lang === 'uz' ? 'Min' : 'Мин'}
                className="w-28 pl-3 pr-8 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              {minPrice && (
                <button onClick={() => setMinPrice('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-400 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
                </button>
              )}
            </div>
            <span className="text-slate-300 font-bold text-sm">—</span>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={maxPrice}
                onChange={e => setMaxPrice(fmtInput(e.target.value))}
                placeholder={lang === 'uz' ? 'Max' : 'Макс'}
                className="w-28 pl-3 pr-8 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              {maxPrice && (
                <button onClick={() => setMaxPrice('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-400 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div ref={revealRef}>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {SKELETON.map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm animate-pulse">
                <div className="w-full h-44 bg-slate-200 dark:bg-slate-700" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <svg className="w-14 h-14 mx-auto mb-4 opacity-30" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <p className="text-base font-medium">{lang === 'uz' ? 'Mahsulot topilmadi' : 'Товаров не найдено'}</p>
            <p className="text-sm mt-1">{lang === 'uz' ? "Qidiruv so\u02BBzini o\u02BBzgartiring" : 'Попробуйте другой запрос'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {filtered.map((p, i) => (
              <div
                key={p.id}
                onClick={() => openDetail(p)}
                style={{ transitionDelay: `${Math.min(i * 0.06, 0.3)}s` }}
                className="reveal group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 border border-transparent dark:border-slate-700 hover:border-primary/20 cursor-pointer"
              >
                {/* Image */}
                  <div className="relative w-full h-44 bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  {p.image ? (
                    <img
                      src={`${BASE_URL}/static/products/${p.image}`}
                      alt={getName(p)}
                      width={288}
                      height={176}
                      loading={i < 4 ? 'eager' : 'lazy'}
                      fetchPriority={i < 4 ? 'high' : undefined}
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-slate-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {getName(p) || (lang === 'uz' ? "Nomi yo'q" : 'Без названия')}
                  </h3>
                  {p.desc && (
                    <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 line-clamp-1">{p.desc}</p>
                  )}
                  <div className="mt-3">
                    {pricesMap[p.id] != null && (
                      <p className="text-primary font-bold text-sm mb-2">
                        {lang === 'uz' ? `${pricesMap[p.id].toLocaleString()} so'm dan` : `от ${pricesMap[p.id].toLocaleString()} сум`}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-primary font-semibold">
                        {lang === 'uz' ? 'Batafsil →' : 'Подробнее →'}
                      </span>
                      <div className="w-7 h-7 rounded-full bg-primary/10 group-hover:bg-primary flex items-center justify-center transition-colors duration-200">
                        <svg className="w-3.5 h-3.5 text-primary group-hover:text-white transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </main>

      {/* Product detail modal */}
      {(detailLoading || selected) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          {detailLoading ? (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 flex flex-col items-center gap-4 shadow-2xl">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">{lang === 'uz' ? 'Yuklanmoqda...' : 'Загружается...'}</p>
            </div>
          ) : selected ? (
            <div
              ref={modalRef}
              className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Modal header */}
              <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-primary/10 dark:border-slate-700 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
                <h2 className="font-bold text-slate-800 dark:text-white text-base leading-snug line-clamp-1 pr-4">
                  {getName(selected)}
                </h2>
                <button
                  onClick={() => setSelected(null)}
                  className="p-2 rounded-xl hover:bg-primary/5 transition-colors flex-shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-slate-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Product image + info */}
                <div className="flex gap-5">
                  <div className="w-28 h-28 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-700 flex-shrink-0">
                    {selected.image ? (
                      <img
                        src={`${BASE_URL}/static/products/${selected.image}`}
                        alt={getName(selected)}
                        width={112}
                        height={112}
                        decoding="async"
                        fetchPriority="high"
                        className="w-full h-full object-cover"
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-slate-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg leading-snug mb-1">{getName(selected)}</h3>
                    {selected.category && (
                      <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">
                        {getName(selected.category)}
                      </span>
                    )}
                    {selected.desc && (
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 leading-relaxed">{selected.desc}</p>
                    )}
                  </div>
                </div>

                {/* Items + prices */}
                {selected.items && selected.items.length > 0 ? (
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wide">
                      {lang === 'uz' ? "Do'konlardagi narxlar" : 'Цены в магазинах'}
                    </h4>
                    {selected.items.map(item => (
                      item.shop_products && item.shop_products.length > 0 ? (
                        <div key={item.id} className="space-y-2">
                          {item.name_uz || item.name_ru || item.name ? (
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                              {getName(item)}
                            </p>
                          ) : null}
                          {item.shop_products.map(sp => (
                            <div key={sp.id} className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-primary/10 dark:border-slate-600 hover:border-primary/30 transition-colors">
                              <div className="flex items-center gap-3 min-w-0">
                                {sp.shop?.image ? (
                                  <img
                                    src={`${BASE_URL}/static/shops/${sp.shop.image}`}
                                    alt={sp.shop.name}
                                    width={36}
                                    height={36}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
                                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349" />
                                    </svg>
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm truncate">
                                    {sp.shop?.name || (lang === 'uz' ? "Do'kon" : 'Магазин')}
                                  </p>
                                  {sp.shop?.address && (
                                    <p className="text-xs text-slate-400 truncate">{sp.shop.address}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                {sp.price != null ? (
                                  sp.bonus_price != null && sp.bonus_price > 0 && sp.bonus_price < sp.price ? (
                                    <div className="flex flex-col items-end">
                                      <span className="font-bold text-primary text-sm whitespace-nowrap">
                                        {sp.bonus_price.toLocaleString()} {lang === 'uz' ? "so'm" : 'сум'}
                                      </span>
                                      <span className="text-[11px] text-slate-400 line-through whitespace-nowrap">
                                        {sp.price.toLocaleString()} {lang === 'uz' ? "so'm" : 'сум'}
                                      </span>
                                      <span className="text-[10px] font-bold text-rose-500 px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30">
                                        -{Math.round(((sp.price - sp.bonus_price) / sp.price) * 100)}%
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="font-bold text-primary text-sm whitespace-nowrap">
                                      {sp.price.toLocaleString()} {lang === 'uz' ? "so'm" : 'сум'}
                                    </span>
                                  )
                                ) : (
                                  <span className="text-slate-400 text-xs">{lang === 'uz' ? "Narx yo\u02BBq" : 'Нет цены'}</span>
                                )}
                                {/* Stock + sold count */}
                                {sp.count != null && (
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                    sp.count === 0
                                      ? 'bg-red-100 text-red-500 dark:bg-red-900/30'
                                      : sp.count <= 5
                                        ? 'bg-orange-100 text-orange-500 dark:bg-orange-900/30'
                                        : 'bg-green-100 text-green-600 dark:bg-green-900/30'
                                  }`}>
                                    {sp.count === 0
                                      ? (lang === 'uz' ? 'Tugagan' : 'Нет в наличии')
                                      : (lang === 'uz' ? `${sp.count} ta qoldi` : `Осталось ${sp.count} шт`)}
                                  </span>
                                )}
                                {(sp as any).sold_count != null && (
                                  <span className="text-xs text-slate-400">
                                    {lang === 'uz' ? `${(sp as any).sold_count} ta sotilgan` : `Продано: ${(sp as any).sold_count}`}
                                  </span>
                                )}
                                {sp.shop?.lat && sp.shop?.lon && (
                                  <button
                                    onClick={e => { e.stopPropagation(); window.open(`https://yandex.com/maps/?pt=${sp.shop!.lon},${sp.shop!.lat}&z=16&l=map&text=${encodeURIComponent(sp.shop!.name || '')}`, '_blank', 'noopener,noreferrer') }}
                                    className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-primary transition-colors font-medium group/map"
                                  >
                                    {/* Pin icon */}
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0 group-hover/map:text-primary transition-colors">
                                      <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-2.003 3.5-4.697 3.5-8.327a8.25 8.25 0 0 0-16.5 0c0 3.63 1.556 6.326 3.5 8.327a19.58 19.58 0 0 0 2.683 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
                                    </svg>
                                    {lang === 'uz' ? 'Xaritada' : 'На карте'}
                                  </button>
                                )}
                                {/* Add to cart button */}
                                {sp.price != null && sp.count !== 0 && (() => {
                                  const added = addedIds.has(sp.id)
                                  return (
                                    <button
                                      onClick={e => { e.stopPropagation(); handleAddToCart(sp) }}
                                      className={`relative overflow-hidden inline-flex items-center justify-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-all duration-300 whitespace-nowrap select-none ${
                                        added
                                          ? 'bg-emerald-500 text-white scale-95 shadow-lg shadow-emerald-500/30'
                                          : 'bg-primary text-white hover:bg-accent hover:scale-[1.03] hover:shadow-lg hover:shadow-primary/30 active:scale-95'
                                      }`}
                                    >
                                      {/* Ripple bg */}
                                      <span className={`absolute inset-0 rounded-xl transition-opacity duration-300 bg-white/20 ${added ? 'opacity-100' : 'opacity-0'}`} />
                                      {added ? (
                                        <>
                                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-3.5 h-3.5 flex-shrink-0 animate-checkPop">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                          </svg>
                                          {lang === 'uz' ? "Qo'shildi!" : 'Добавлено!'}
                                        </>
                                      ) : (
                                        <>
                                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5 flex-shrink-0">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                                          </svg>
                                          {lang === 'uz' ? 'Savatga' : 'В корзину'}
                                        </>
                                      )}
                                    </button>
                                  )
                                })()}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
                    <p className="text-sm">
                      {lang === 'uz' ? "Do'konlarda narx topilmadi" : 'Цены в магазинах не найдены'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}
      {/* Auth modal */}
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuth={() => { setUser(authService.getUser()); setAuthOpen(false) }}
      />
      {/* Cart drawer */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onAuthRequired={() => { setCartOpen(false); setAuthOpen(true) }}
        user={user}
      />
    </div>
  )
}
