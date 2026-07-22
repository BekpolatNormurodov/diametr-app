import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useLang } from '../context/AppContext'
import { useCart } from '../context/CartContext'
import { useScrollReveal } from '../hooks/useScrollReveal'
import Navbar from '../components/home/sections/navbar'
import Footer from '../components/home/sections/footer'
import AuthModal from '../components/auth/AuthModal'
import CartDrawer from '../components/cart/CartDrawer'
import { authService, AuthUser } from '../service/authService'

const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8888'
const API_URL = `${BASE_URL}/api/v1`

const SKELETON = Array.from({ length: 8 })

interface Shop {
  id: number
  name?: string
  image?: string
  address?: string
  lat?: number
  lon?: number
  region?: { id: number; name?: string }
  region_id?: number
  delivery_amount?: number
  yandex_delivery?: boolean
  market_delivery?: boolean
  created_at?: string
}

function formatJoinDate(iso?: string, lang?: string) {
  if (!iso) return null
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return null
    return d.toLocaleDateString(lang === 'uz' ? 'uz-Latn-UZ' : 'ru-RU', { year: 'numeric', month: 'long' })
  } catch { return null }
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

interface ShopProductRaw {
  id: number
  price?: number
  bonus_price?: number | null
  count: number
  sold_count?: number
  last_sold?: string | null
  shop_id?: number
  product_item_id?: number
  work_status?: string
  // Variant fields returned by shop/:id
  variant_name?: string
  variant_image?: string
  color?: string | null
  size?: string | null
  value?: number | null
  unit_type?: { id: number; name: string; symbol: string } | null
}

interface ProductItem {
  id: number
  name?: string
  desc?: string
  image?: string
  product_id?: number
}

interface ShopCategory {
  id: number
  name_uz?: string
  name_ru?: string
  name?: string
}

interface EnrichedProduct extends ShopProductRaw {
  item?: ProductItem
  category?: ShopCategory
}

const PRODUCT_IMG = (img?: string) =>
  img ? `${BASE_URL}/static/product-items/${img}` : null

export default function ShopDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { lang } = useLang()
  const { addItem, items } = useCart()

  const [shop, setShop] = useState<Shop | null>(null)
  const [products, setProducts] = useState<EnrichedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [user, setUser] = useState<AuthUser | null>(() => authService.getUser())
  const [authOpen, setAuthOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set())
  const [activeCatId, setActiveCatId] = useState<number | null>(null)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [distanceKm, setDistanceKm] = useState<number | null>(null)
  const chipsWrapperRef = useRef<HTMLDivElement>(null)
  const [showAllCats, setShowAllCats] = useState(false)
  const [visibleChipCount, setVisibleChipCount] = useState<number | null>(null)

  const revealRef = useScrollReveal()

  // Silently get user location and calculate distance to shop
  useEffect(() => {
    setDistanceKm(null)
    if (!shop?.lat || !shop?.lon) return
    if (!navigator?.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const km = haversineKm(pos.coords.latitude, pos.coords.longitude, shop.lat!, shop.lon!)
        setDistanceKm(km)
      },
      () => {}, // silently ignore if denied / unavailable
      { timeout: 8000, maximumAge: 300_000, enableHighAccuracy: false },
    )
  }, [shop?.lat, shop?.lon]) // eslint-disable-line

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setProducts([])
    setSearch('')
    setActiveCatId(null)
    setMinPrice('')
    setMaxPrice('')
    axios.get(`${API_URL}/shop/${id}`)
      .then(async res => {
        try {
          const data = res.data
          setShop({
            id: data.id,
            name: data.name,
            image: data.image,
            address: data.address,
            lat: data.lat,
            lon: data.lon,
            region_id: data.region_id,
            delivery_amount: data.delivery_amount,
            yandex_delivery: data.yandex_delivery,
            market_delivery: data.market_delivery,
            created_at: data.created_at || data.createdAt,
          })

          // Fetch region name if available
          if (data.region_id) {
            axios.get(`${API_URL}/region/all`)
              .then(r => {
                const reg = (r.data as { id: number; name?: string }[]).find(re => re.id === data.region_id)
                if (reg) setShop(s => s ? { ...s, region: reg } : s)
              })
              .catch(() => {})
          }

          const rawProducts: ShopProductRaw[] = (data.products || []).filter(
            (p: ShopProductRaw) => p.work_status !== 'STOPPED' && p.price != null
          )

          // Parallel-fetch product items to get description (variant details now come from shop response)
          const enriched: EnrichedProduct[] = await Promise.all(
            rawProducts.map(async (sp): Promise<EnrichedProduct> => {
              if (!sp.product_item_id) return { ...sp }
              try {
                const itemRes = await axios.get(`${API_URL}/product-item/${sp.product_item_id}`)
                return { ...sp, item: itemRes.data as ProductItem }
              } catch {
                return { ...sp }
              }
            })
          )

          // Use category from shop response
          const enrichedWithCat: EnrichedProduct[] = enriched.map(e => ({
            ...e,
            category: (e as any).category ?? undefined,
          }))
          setProducts(enrichedWithCat)
        } catch {
          // data processing failed but shop loaded — just show empty products
          setProducts([])
        }
      })
      .catch(() => {
        toast.error(
          <div className="flex items-center gap-3 px-3 py-1">
            <span className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-bold text-slate-800">{lang === 'uz' ? "Do'kon topilmadi" : 'Магазин не найден'}</p>
              <p className="text-xs text-slate-400 mt-0.5">{lang === 'uz' ? 'Sahifa mavjud emas' : 'Страница не существует'}</p>
            </div>
          </div>,
          { icon: false, style: { padding: 0 } }
        )
        navigate('/shops')
      })
      .finally(() => setLoading(false))
  }, [id]) // eslint-disable-line

  const categories = useMemo(() => {
    const map = new Map<number, ShopCategory>()
    products.forEach(p => { if (p.category?.id) map.set(p.category.id, p.category) })
    return Array.from(map.values())
  }, [products])

  // Measure how many category chips fit in one row
  const measureChips = useCallback(() => {
    const wrap = chipsWrapperRef.current
    if (!wrap) return
    const chips = Array.from(wrap.querySelectorAll<HTMLElement>('[data-chip]'))
    if (chips.length === 0) return
    const toggleBtn = wrap.querySelector<HTMLElement>('[data-chip-toggle]')
    const reserved = (toggleBtn ? toggleBtn.offsetWidth : 130) + 32
    const wrapWidth = wrap.clientWidth - reserved
    let used = 0
    let count = 0
    const prevDisplay: string[] = chips.map(c => c.style.display)
    chips.forEach(c => { c.style.display = '' })
    for (const chip of chips) {
      const w = chip.offsetWidth + 8
      if (used + w > wrapWidth) break
      used += w
      count++
    }
    chips.forEach((c, i) => { c.style.display = prevDisplay[i] })
    if (count < 1) count = 1
    setVisibleChipCount(count)
  }, [])

  useLayoutEffect(() => {
    if (categories.length === 0) return
    measureChips()
    const onResize = () => measureChips()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [categories, lang, measureChips])

  const filtered = products.filter(p => {
    const name = p.item?.name ?? ''
    if (!name.toLowerCase().includes(search.toLowerCase())) return false
    if (activeCatId !== null && p.category?.id !== activeCatId) return false
    const price = p.price ?? 0
    if (minPrice !== '' && price < Number(minPrice.replace(/\s/g, ''))) return false
    if (maxPrice !== '' && price > Number(maxPrice.replace(/\s/g, ''))) return false
    return true
  })

  const addToCart = useCallback((sp: EnrichedProduct) => {
    if (!shop || sp.price == null) return
    const productName = sp.item?.name ?? (lang === 'uz' ? 'Mahsulot' : 'Товар')
    const shopName = shop.name ?? (lang === 'uz' ? "Do'kon" : 'Магазин')
    const imgSrc = PRODUCT_IMG(sp.item?.image)
    const finalPrice = sp.bonus_price != null && sp.bonus_price > 0 && sp.bonus_price < sp.price
      ? sp.bonus_price
      : sp.price!

    addItem({
      shopProductId: sp.id,
      productId: sp.item?.product_id ?? sp.product_item_id ?? 0,
      productName,
      productImage: sp.item?.image,
      shopId: shop.id,
      shopName,
      deliveryAmount: shop.delivery_amount,
      price: finalPrice,
      maxQty: sp.count || undefined,
    })

    setAddedIds(prev => new Set(prev).add(sp.id))
    setTimeout(() => setAddedIds(prev => {
      const s = new Set(prev); s.delete(sp.id); return s
    }), 1600)

    toast(
      <div className="flex items-center gap-3 px-4 py-3.5 w-full">
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100">
          {imgSrc
            ? <img src={imgSrc} alt={productName} className="w-full h-full object-cover" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
            : <div className="w-full h-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-slate-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
              </div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-4 h-4 rounded-full bg-[#00C48C] flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-2.5 h-2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </span>
            <p className="text-[13px] font-bold text-slate-800">
              {lang === 'uz' ? "Savatga qo'shildi!" : 'Добавлено в корзину!'}
            </p>
          </div>
          <p className="text-[11px] text-slate-500 truncate">{productName}</p>
          <p className="text-[11px] text-[#00C48C] font-semibold truncate">{shopName} · {sp.price!.toLocaleString()} {lang === 'uz' ? "so'm" : 'сум'}</p>
        </div>
      </div>,
      { icon: false, autoClose: 2500 }
    )
  }, [shop, addItem, lang])

  const inCart = (spId: number) => items.some(i => i.shopProductId === spId)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <Navbar
        onCartClick={() => setCartOpen(true)}
        onAuthClick={() => setAuthOpen(true)}
        user={user}
        onLogout={() => setUser(null)}
      />
      <div className="h-[76px] flex-shrink-0" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary transition-colors mb-6"
        >
          <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          {lang === 'uz' ? "Do'konlar" : 'Магазины'}
        </button>

        {/* Shop header */}
        {loading ? (
          <div className="mb-10 animate-pulse">
            <div className="flex flex-col sm:flex-row gap-6 mb-6">
              <div className="w-full sm:w-64 h-52 rounded-3xl bg-slate-200 dark:bg-slate-700 shrink-0" />
              <div className="flex-1 space-y-3 py-2">
                <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/5" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded-2xl" />)}
                </div>
              </div>
            </div>
            <div className="h-52 rounded-3xl bg-slate-200 dark:bg-slate-700" />
          </div>
        ) : shop ? (
          <div className="mb-10">

            {/* Top: image + basic info */}
            <div className="flex flex-col sm:flex-row gap-6 mb-6">

              {/* Shop image */}
              <div className="w-full sm:w-64 h-52 rounded-3xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-700 shadow-lg border border-slate-200/60 dark:border-slate-700">
                {shop.image
                  ? <img src={`${BASE_URL}/static/shops/${shop.image}`} alt={shop.name} className="w-full h-full object-cover" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                  : <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary/5 to-slate-100 dark:to-slate-700">
                      <svg className="w-14 h-14 text-slate-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
                      </svg>
                      <span className="text-xs text-slate-400">{lang === 'uz' ? "Rasm yo'q" : 'Нет фото'}</span>
                    </div>
                }
              </div>

              {/* Shop name + badges */}
              <div className="flex flex-col justify-between gap-4 flex-1 py-1">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight mb-2">
                    {shop.name || (lang === 'uz' ? "Do'kon" : 'Магазин')}
                  </h1>

                  {shop.address && (
                    <p className="flex items-start gap-1.5 text-sm text-slate-500 dark:text-slate-400 mb-3">
                      <svg className="w-4 h-4 text-primary mt-0.5 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                      </svg>
                      <span>{shop.address}</span>
                      {distanceKm !== null && (
                        <span className="ml-1.5 inline-flex items-center gap-1 bg-primary/10 text-primary text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0">
                          <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 12 3v0a2.25 2.25 0 0 1 2.25 2.25v.75m0 0h.75A2.25 2.25 0 0 1 17.25 8.25V12m0 0v4.5A2.25 2.25 0 0 1 15 18.75H9a2.25 2.25 0 0 1-2.25-2.25V12m10.5 0H6.75" />
                          </svg>
                          {formatKm(distanceKm)}
                        </span>
                      )}
                    </p>
                  )}

                  {/* Delivery + Yandex badges */}
                  <div className="flex flex-wrap gap-2">
                    {shop.market_delivery && (
                      <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full border border-primary/20">
                        <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                        </svg>
                        {lang === 'uz' ? 'Yetkazib berish' : 'Есть доставка'}
                        {shop.delivery_amount ? (
                          <span className="opacity-80">· {shop.delivery_amount.toLocaleString()} {lang === 'uz' ? "so'm" : 'сум'}</span>
                        ) : null}
                      </span>
                    )}
                    {shop.yandex_delivery && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border" style={{ background: 'rgba(255,204,0,0.12)', borderColor: 'rgba(255,188,0,0.35)', color: '#b38600' }}>
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                        Yandex Delivery
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Products count */}
                  <div className="flex flex-col gap-1.5 bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-1.5">
                      <span className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <svg className="w-3.5 h-3.5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                        </svg>
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">{lang === 'uz' ? 'Mahsulotlar' : 'Товары'}</span>
                    </div>
                    <p className="text-xl font-extrabold text-slate-800 dark:text-slate-200 leading-none">
                      {products.length > 0 ? products.length : '—'}
                    </p>
                    <p className="text-[10px] text-slate-400">{lang === 'uz' ? 'ta aktiv tovar' : 'активных'}</p>
                  </div>

                  {/* Region */}
                  <div className="flex flex-col gap-1.5 bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-1.5">
                      <span className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                        <svg className="w-3.5 h-3.5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                        </svg>
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">{lang === 'uz' ? 'Region' : 'Регион'}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">
                      {shop.region?.name || '—'}
                    </p>
                    <p className="text-[10px] text-slate-400">{lang === 'uz' ? 'joylashuv' : 'расположение'}</p>
                  </div>

                  {/* Join date */}
                  <div className="flex flex-col gap-1.5 bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-1.5">
                      <span className="w-7 h-7 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                        <svg className="w-3.5 h-3.5 text-violet-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                        </svg>
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">{lang === 'uz' ? 'Qo\u02BBshilgan' : 'Добавлен'}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">
                      {formatJoinDate(shop.created_at, lang) ?? '—'}
                    </p>
                    <p className="text-[10px] text-slate-400">{lang === 'uz' ? 'platformaga' : 'на платформу'}</p>
                  </div>

                  {/* Map link OR delivery price */}
                  <div
                    className={`flex flex-col gap-1.5 rounded-2xl px-4 py-3 border ${
                      shop.lat && shop.lon
                        ? 'bg-primary/5 border-primary/20 cursor-pointer hover:bg-primary/10 transition-colors group'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'
                    }`}
                    onClick={shop.lat && shop.lon ? () => document.getElementById('shop-map')?.scrollIntoView({ behavior: 'smooth' }) : undefined}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-7 h-7 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                        <svg className="w-3.5 h-3.5 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                        </svg>
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">{lang === 'uz' ? 'Xarita' : 'Карта'}</span>
                    </div>
                    {shop.lat && shop.lon ? (
                      <p className="text-sm font-bold text-primary leading-tight group-hover:underline">
                        {distanceKm !== null ? formatKm(distanceKm) : (lang === 'uz' ? "Ko'rish ↓" : 'Смотреть ↓')}
                      </p>
                    ) : (
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">—</p>
                    )}
                    <p className="text-[10px] text-slate-400">
                      {distanceKm !== null
                        ? (lang === 'uz' ? 'sizdan · Ko\'rish ↓' : 'от вас · Смотреть ↓')
                        : (lang === 'uz' ? 'lokatsiya' : 'местоположение')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Yandex map embed */}
            {shop.lat && shop.lon && (
              <div id="shop-map" className="rounded-3xl overflow-hidden shadow-lg border border-primary/10 dark:border-slate-700">
                <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2.5 flex items-center gap-3 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                    {shop.name || (lang === 'uz' ? "Do'kon" : 'Магазин')}
                  </span>
                  <button
                    onClick={() => window.open(`https://yandex.com/maps/?pt=${shop.lon},${shop.lat}&z=16&l=map&text=${encodeURIComponent(shop.name || '')}`, '_blank', 'noopener,noreferrer')}
                    className="ml-auto text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                  >
                    {lang === 'uz' ? 'Yandex Xaritada ochish' : 'Открыть в Яндекс.Картах'}
                    <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </button>
                </div>
                <iframe
                  src={`https://yandex.com/map-widget/v1/?ll=${shop.lon},${shop.lat}&z=16&pt=${shop.lon},${shop.lat},pm2grm1&l=map&text=${encodeURIComponent(shop.name || '')}`}
                  title="Shop location"
                  width="100%"
                  height="320"
                  frameBorder="0"
                  allowFullScreen
                  style={{ display: 'block', border: 'none' }}
                />
              </div>
            )}
          </div>
        ) : null}

        {/* ── Filters ── */}
        <div className="mb-6 space-y-3">

          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1 max-w-md">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={lang === 'uz' ? 'Mahsulot qidirish...' : 'Поиск товара...'}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-400 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                  </svg>
                </button>
              )}
            </div>

            {/* Min / Max price */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <input
                  type="number"
                  value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                  placeholder={lang === 'uz' ? 'Min narx' : 'Мин цена'}
                  className="w-32 pl-3 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <span className="text-slate-300 text-sm font-medium">—</span>
              <div className="relative">
                <input
                  type="number"
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  placeholder={lang === 'uz' ? 'Max narx' : 'Макс цена'}
                  className="w-32 pl-3 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              {(minPrice || maxPrice) && (
                <button
                  onClick={() => { setMinPrice(''); setMaxPrice('') }}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title={lang === 'uz' ? 'Narx filtrini tozalash' : 'Сбросить фильтр цен'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Category chips */}
          {!loading && categories.length > 0 && (
            <div
              ref={chipsWrapperRef}
              className={`flex items-center gap-2 pb-1 ${showAllCats ? 'flex-wrap' : 'flex-nowrap'}`}
            >
              <div className={`flex items-center gap-2 ${showAllCats ? 'flex-wrap' : 'flex-nowrap min-w-0 flex-1 overflow-hidden'}`}>
                <button
                  data-chip
                  onClick={() => setActiveCatId(null)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${
                    activeCatId === null
                      ? 'bg-primary text-white border-primary shadow-sm shadow-primary/30'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-primary/40 hover:text-primary'
                  }`}
                >
                  {lang === 'uz' ? 'Barchasi' : 'Все'}
                </button>
                {categories.map((cat, idx) => {
                  const isHidden = !showAllCats && visibleChipCount != null && idx + 1 >= visibleChipCount
                  return (
                    <button
                      key={cat.id}
                      data-chip
                      onClick={() => setActiveCatId(activeCatId === cat.id ? null : cat.id)}
                      style={isHidden ? { display: 'none' } : undefined}
                      className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${
                        activeCatId === cat.id
                          ? 'bg-primary text-white border-primary shadow-sm shadow-primary/30'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-primary/40 hover:text-primary'
                      }`}
                    >
                      {lang === 'uz'
                        ? (cat.name_uz || cat.name || '')
                        : (cat.name_ru || cat.name || '')}
                    </button>
                  )
                })}
              </div>
              {visibleChipCount != null && categories.length + 1 > visibleChipCount && (
                <button
                  data-chip-toggle
                  onClick={() => setShowAllCats(s => !s)}
                  className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-primary/30 text-primary hover:bg-primary hover:text-white transition-all duration-150 whitespace-nowrap"
                >
                  {showAllCats
                    ? (lang === 'uz' ? 'Kamroq' : 'Свернуть')
                    : (lang === 'uz' ? `Hammasi (${categories.length})` : `Все (${categories.length})`)}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Products grid */}
        <div ref={revealRef}>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
              {SKELETON.map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm animate-pulse">
                  <div className="w-full h-44 bg-slate-200 dark:bg-slate-700" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                    <div className="h-9 bg-slate-200 dark:bg-slate-700 rounded-xl w-full mt-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <svg className="w-14 h-14 mx-auto mb-4 opacity-30" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <p className="text-base font-medium">{products.length === 0 ? (lang === 'uz' ? "Do'konda mahsulot yo'q" : 'В магазине нет товаров') : (lang === 'uz' ? 'Mahsulot topilmadi' : 'Товаров не найдено')}</p>
              {(search || activeCatId !== null || minPrice || maxPrice) && (
                <button
                  onClick={() => { setSearch(''); setActiveCatId(null); setMinPrice(''); setMaxPrice('') }}
                  className="mt-3 text-primary text-sm hover:underline"
                >
                  {lang === 'uz' ? "Filtrlarni tozalash" : "Сбросить фильтры"}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
              {filtered.map((sp, i) => {
                const added = addedIds.has(sp.id)
                const alreadyInCart = inCart(sp.id)
                const imgSrc = PRODUCT_IMG(sp.item?.image)
                const name = sp.item?.name ?? (lang === 'uz' ? 'Mahsulot' : 'Товар')
                return (
                  <div
                    key={sp.id}
                    style={{ transitionDelay: `${i * 0.06}s` }}
                    className="reveal group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 border border-transparent dark:border-slate-700 hover:border-primary/20 flex flex-col"
                  >
                    {/* Image */}
                    <div className="relative w-full h-44 bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={name}
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
                      {/* Low stock badge */}
                      {sp.count > 0 && sp.count <= 5 && (
                        <span className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                          {lang === 'uz' ? `${sp.count} ta qoldi` : `Осталось ${sp.count}`}
                        </span>
                      )}
                      {/* Discount badge */}
                      {sp.price != null && sp.bonus_price != null && sp.bonus_price > 0 && sp.bonus_price < sp.price && (
                        <span className="absolute top-2 left-2 bg-gradient-to-r from-rose-500 to-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md">
                          -{Math.round(((sp.price - sp.bonus_price) / sp.price) * 100)}%
                        </span>
                      )}
                      {/* Sold count badge */}
                      {(sp.sold_count ?? 0) > 0 && !(sp.price != null && sp.bonus_price != null && sp.bonus_price > 0 && sp.bonus_price < sp.price) && (
                        <span className="absolute top-2 left-2 bg-green-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm backdrop-blur-sm">
                          ✓ {sp.sold_count} {lang === 'uz' ? 'sotilgan' : 'продано'}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-1">
                        {name}
                      </h3>
                      {sp.item?.desc && (
                        <p className="text-slate-400 dark:text-slate-500 text-xs line-clamp-1 mb-2">{sp.item.desc}</p>
                      )}
                      {/* Variant badges: unit/value, color, size */}
                      {(sp.unit_type || sp.color || sp.size) && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {sp.unit_type && sp.value != null && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400 border border-brand-200 dark:border-brand-500/20">
                              {sp.value} {sp.unit_type.symbol}
                            </span>
                          )}
                          {sp.unit_type && sp.value == null && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400 border border-brand-200 dark:border-brand-500/20">
                              {sp.unit_type.symbol}
                            </span>
                          )}
                          {sp.color && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                              <span className="w-4 h-4 rounded-full border-2 border-white dark:border-slate-600 shadow-sm flex-shrink-0 ring-1 ring-slate-200 dark:ring-slate-500" style={{ background: sp.color.startsWith('#') ? sp.color : '#94a3b8' }} />
                              {!sp.color.startsWith('#') && sp.color}
                            </span>
                          )}
                          {sp.size && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                              {sp.size}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="mt-auto">
                        {sp.price != null && (() => {
                          const hasDiscount = sp.bonus_price != null && sp.bonus_price > 0 && sp.bonus_price < sp.price
                          return (
                          <div className="mb-3">
                            {hasDiscount ? (
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-primary font-bold text-base">
                                  {sp.bonus_price!.toLocaleString()} <span className="text-xs font-semibold">{lang === 'uz' ? "so'm" : 'сум'}</span>
                                </p>
                                <p className="text-slate-400 text-xs line-through">
                                  {sp.price.toLocaleString()}
                                </p>
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                                  -{Math.round(((sp.price - sp.bonus_price!) / sp.price) * 100)}%
                                </span>
                              </div>
                            ) : (
                              <p className="text-primary font-bold text-base">
                                {sp.price.toLocaleString()} <span className="text-xs font-semibold">{lang === 'uz' ? "so'm" : 'сум'}</span>
                              </p>
                            )}
                          </div>
                          )
                        })()}
                        {/* Stock info */}
                        <div className="flex items-center gap-2 mb-2 text-[11px]">
                          <span className={`font-semibold ${sp.count > 5 ? 'text-green-600 dark:text-green-400' : sp.count > 0 ? 'text-orange-500' : 'text-red-500'}`}>
                            📦 {sp.count} {lang === 'uz' ? 'ta bor' : 'шт.'}
                          </span>
                          {(sp.sold_count ?? 0) > 0 && (
                            <span className="text-slate-400">
                              · {sp.sold_count} {lang === 'uz' ? 'sotilgan' : 'продано'}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => addToCart(sp)}
                          disabled={added}
                          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                            added
                              ? 'bg-primary/20 text-primary cursor-default'
                              : alreadyInCart
                              ? 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20'
                              : 'bg-primary text-white hover:bg-accent shadow-sm hover:shadow-md hover:shadow-primary/20'
                          }`}
                        >
                          {added ? (
                            <>
                              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                              </svg>
                              {lang === 'uz' ? "Qo'shildi" : 'Добавлено'}
                            </>
                          ) : alreadyInCart ? (
                            <>
                              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                              </svg>
                              {lang === 'uz' ? 'Savatda bor' : 'В корзине'}
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                              </svg>
                              {lang === 'uz' ? "Savatga qo'shish" : 'В корзину'}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
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
