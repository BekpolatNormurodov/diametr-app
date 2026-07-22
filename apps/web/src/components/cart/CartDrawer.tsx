import React, { useState, useEffect, useCallback } from 'react'
import { useCart } from '../../context/CartContext'
import { useLang } from '../../context/AppContext'
import { authService, BASE_URL } from '../../service/authService'

interface Props {
  open: boolean
  onClose: () => void
  onAuthRequired: () => void
  user?: { name?: string; phone?: string } | null
}

type Step = 'cart' | 'checkout' | 'done'
type PayMode = 'cash' | 'online'
type OnlineMethod = 'payme' | 'click' | 'uzum'
interface Coords { lat: number; lng: number }

const staticMap = (c: Coords) =>
  `https://static-maps.yandex.ru/1.x/?ll=${c.lng},${c.lat}&z=16&size=340,130&l=map&pt=${c.lng},${c.lat},pmrdm2&lang=uz_UZ`

export default function CartDrawer({ open, onClose, onAuthRequired, user }: Props) {
  const { items, removeItem, updateQty, clearCart, total, count } = useCart()
  const { lang } = useLang()
  const [step, setStep] = useState<Step>('cart')
  const [address, setAddress] = useState('')
  const [coords, setCoords] = useState<Coords | null>(null)
  const [locLoading, setLocLoading] = useState(false)
  const [payMode, setPayMode] = useState<PayMode>('cash')
  const [onlineMethod, setOnlineMethod] = useState<OnlineMethod>('payme')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [orderIds, setOrderIds] = useState<number[]>([])

  // Promo code
  const [promoInput, setPromoInput] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError] = useState('')
  const [promoSuccess, setPromoSuccess] = useState('')

  // Address modal
  const [mapModalOpen, setMapModalOpen] = useState(false)
  const [modalCoords, setModalCoords] = useState<Coords | null>(null)
  const [modalAddress, setModalAddress] = useState('')
  const [modalLocLoading, setModalLocLoading] = useState(false)
  // Delivery: har bir do'kon uchun bitta yetkazib berish narxi
  const totalDelivery = items.reduce((acc, item) => {
    if (!acc.seen.has(item.shopId)) {
      acc.seen.add(item.shopId)
      acc.sum += item.deliveryAmount ?? 0
    }
    return acc
  }, { seen: new Set<number>(), sum: 0 }).sum

  const discountedTotal = promoDiscount > 0
    ? Math.round(total - (total * promoDiscount) / 100)
    : total

  const grandTotal = discountedTotal + totalDelivery

  const fmtPrice = (n: number) =>
    n.toLocaleString('uz-UZ') + (lang === 'uz' ? " so'm" : ' sum')

  // GPS
  const getLocation = useCallback(() => {
    if (!navigator.geolocation) return
    setLocLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setCoords(c)
        if (!address.trim()) setAddress(`${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}`)
        setLocLoading(false)
      },
      () => { setLocLoading(false) },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }, [address])

  // No auto-GPS — user clicks the button voluntarily

  const detectModalGPS = useCallback(() => {
    if (!navigator.geolocation) return
    setModalLocLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setModalCoords(c)
        setModalAddress(`${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}`)
        setModalLocLoading(false)
      },
      () => setModalLocLoading(false),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }, [])

  useEffect(() => {
    if (mapModalOpen) {
      setModalCoords(coords)
      setModalAddress(address)
      if (!coords) detectModalGPS()
    }
  }, [mapModalOpen]) // eslint-disable-line

  const openAddrModal = () => setMapModalOpen(true)

  const confirmAddrModal = () => {
    if (modalAddress.trim()) {
      setAddress(modalAddress)
      setCoords(modalCoords)
    }
    setMapModalOpen(false)
  }

  // Apply promo
  const applyPromo = async () => {
    if (!promoInput.trim()) return
    setPromoLoading(true)
    setPromoError('')
    setPromoSuccess('')
    try {
      const res = await authService.apiFetch(
        `${BASE_URL}/api/v1/promo-code/validate/${promoInput.trim().toUpperCase()}`
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Xato')
      setPromoCode(promoInput.trim().toUpperCase())
      setPromoDiscount(data.discount)
      setPromoSuccess(lang === 'uz'
        ? `${data.discount}% chegirma qo'llandi!`
        : `Skidka ${data.discount}% qo'llandi!`)
    } catch (e) {
      const raw: string = (e as any).message || ''
      setPromoError(
        (!raw || raw === 'Failed to fetch' || raw.toLowerCase().includes('failed to fetch'))
          ? (lang === 'uz' ? "Internet bilan muammo" : 'Ошибка соединения')
          : raw || (lang === 'uz' ? 'Promo kod noto\'g\'ri' : 'Неверный промокод')
      )
      setPromoCode('')
      setPromoDiscount(0)
    } finally {
      setPromoLoading(false)
    }
  }

  const removePromo = () => {
    setPromoInput('')
    setPromoCode('')
    setPromoDiscount(0)
    setPromoError('')
    setPromoSuccess('')
  }

  // Submit order — one order per shop when cart has multiple shops
  const handleCheckout = async () => {
    if (!user) { onAuthRequired(); return }
    if (!address.trim()) {
      setError(lang === 'uz' ? 'Manzilni kiriting' : 'Manzilni kiriting')
      return
    }
    setError('')
    setLoading(true)

    // group cart items by shopId
    const byShop = items.reduce<Record<number, typeof items>>((acc, item) => {
      if (!acc[item.shopId]) acc[item.shopId] = []
      acc[item.shopId].push(item)
      return acc
    }, {})

    const paymentType = payMode === 'cash' ? 'cash' : onlineMethod
    const collectedIds: number[] = []
    let firstPayUrl: string | null = null

    try {
      for (const [shopIdStr, shopItems] of Object.entries(byShop)) {
        const shopId = Number(shopIdStr)
        const shopTotal = shopItems.reduce((s, i) => s + i.price * i.qty, 0)
        const shopDelivery = (shopItems[0]?.deliveryAmount ?? 0)
        const shopDiscount = promoDiscount > 0
          ? Math.round(shopTotal - (shopTotal * promoDiscount) / 100)
          : shopTotal
        const shopGrand = shopDiscount + shopDelivery

        const body = {
          shop_id: shopId,
          amount: shopGrand,
          products: shopItems.map(i => ({ shop_product_id: i.shopProductId, count: i.qty })),
          payment_type: paymentType,
          address: address.trim(),
          delivery_type: 'FIXED',
          source: (window as any).Telegram?.WebApp?.initData ? 'STORE_BOT' : 'SITE',
          ...(coords ? { lat: coords.lat, lon: coords.lng } : {}),
          ...(promoCode ? { promo_code: promoCode } : {}),
        }
        const res = await authService.apiFetch(`${BASE_URL}/api/v1/order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.message || `Error ${res.status}`)
        }
        const data = await res.json()
        const id = data.id ?? data.orderId ?? data.order_id ?? null
        if (id) collectedIds.push(Number(id))
        if (!firstPayUrl && data.paymentUrl) firstPayUrl = data.paymentUrl
      }

      setOrderIds(collectedIds)
      clearCart()
      setStep('done')
      if (firstPayUrl) window.open(firstPayUrl, '_blank', 'noopener,noreferrer')
    } catch (e) {
      const raw: string = (e as any).message || ''
      let msg = raw
      if (!raw || raw === 'Failed to fetch' || raw.toLowerCase().includes('network') || raw.toLowerCase().includes('failed to fetch')) {
        msg = lang === 'uz'
          ? "Internet bilan muammo. Iltimos aloqani tekshirib, qayta urinib ko'ring."
          : 'Ошибка соединения. Проверьте интернет и попробуйте снова.'
      } else if (/^(error\s*\d+|\d{3})/i.test(raw)) {
        msg = lang === 'uz' ? "Server xatosi. Biroz kutib, qayta urinib ko'ring." : 'Ошибка сервера. Попробуйте позже.'
      }
      setError(msg || (lang === 'uz' ? 'Xatolik yuz berdi' : 'Xatolik yuz berdi'))
    } finally {
      setLoading(false)
    }
  }

  const resetAndClose = () => {
    setStep('cart')
    setAddress('')
    setCoords(null)
    setPayMode('cash')
    setError('')
    setOrderIds([])
    setPromoInput('')
    setPromoCode('')
    setPromoDiscount(0)
    setPromoError('')
    setPromoSuccess('')
    setMapModalOpen(false)
    setModalCoords(null)
    setModalAddress('')
    onClose()
  }

  const checkoutLabel = () => {
    const price = ` -> ${fmtPrice(discountedTotal)}`
    if (payMode === 'cash')
      return (lang === 'uz' ? 'Buyurtma berish' : 'Buyurtma berish') + price
    const names = { payme: 'Payme', click: 'Click', uzum: 'Uzum' } as const
    return (lang === 'uz'
      ? `${names[onlineMethod]} orqali to'lash`
      : `${names[onlineMethod]} orqali to'lash`) + price
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-[200] transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={resetAndClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[23rem] bg-white dark:bg-slate-900 shadow-2xl z-[201] flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-primary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
            <h2 className="font-bold text-slate-800 dark:text-white text-base">
              {step === 'done'
                ? (lang === 'uz' ? 'Buyurtma berildi!' : 'Buyurtma berildi!')
                : step === 'checkout'
                  ? (lang === 'uz' ? "To'lov va yetkazish" : "To'lov va yetkazish")
                  : (lang === 'uz' ? 'Savatcha' : 'Savatcha')}
            </h2>
            {step === 'cart' && count > 0 && (
              <span className="bg-primary text-white text-xs font-bold rounded-full px-2 py-0.5">{count}</span>
            )}
          </div>
          <button onClick={resetAndClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-slate-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {/* Done */}
          {step === 'done' && (
            <div className="flex flex-col items-center justify-center h-full gap-5 px-6 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10 text-primary">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                  {lang === 'uz' ? 'Buyurtma qabul qilindi!' : 'Buyurtma qabul qilindi!'}
                </h3>
                {orderIds.length > 0 && (
                  <p className="text-primary font-semibold text-sm mt-1">
                    {orderIds.map(id => `#${id}`).join('  ·  ')}
                  </p>
                )}
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                  {lang === 'uz' ? "Tez orada siz bilan bog'lanamiz." : "Tez orada siz bilan bog'lanamiz."}
                </p>
              </div>
              <button onClick={resetAndClose} className="mt-2 px-8 py-3 rounded-2xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all">
                {lang === 'uz' ? 'Yopish' : 'Yopish'}
              </button>
            </div>
          )}

          {/* Checkout */}
          {step === 'checkout' && (
            <div className="p-5 space-y-5">

              {/* Order summary */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  {lang === 'uz' ? 'Buyurtma' : 'Buyurtma'}
                </p>
                {items.map(i => (
                  <div key={i.shopProductId} className="flex justify-between text-sm py-1 text-slate-700 dark:text-slate-300">
                    <span className="truncate mr-2">{lang === 'uz' ? i.productName : (i.productNameRu || i.productName)} x {i.qty}</span>
                    <span className="font-semibold whitespace-nowrap text-primary">{fmtPrice(i.price * i.qty)}</span>
                  </div>
                ))}
                <div className="border-t border-slate-200 dark:border-slate-600 mt-3 pt-3 space-y-1">
                  <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
                    <span>{lang === 'uz' ? 'Jami' : 'Jami'}</span>
                    <span>{fmtPrice(total)}</span>
                  </div>
                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                      <span>{`Chegirma (${promoDiscount}%)`}</span>
                      <span>-{fmtPrice(total - discountedTotal)}</span>
                    </div>
                  )}
                  {totalDelivery > 0 && (
                    <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
                      <span>{lang === 'uz' ? 'Yetkazib berish' : 'Доставка'}</span>
                      <span>+{fmtPrice(totalDelivery)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-slate-800 dark:text-white text-sm pt-1 border-t border-slate-200 dark:border-slate-600">
                    <span>{lang === 'uz' ? "To'lov summasi" : "To'lov summasi"}</span>
                    <span className="text-primary">{fmtPrice(grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Promo code */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Promokod
                </label>
                {promoCode ? (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-emerald-500 flex-shrink-0">
                      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{promoCode}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-500">{promoSuccess}</p>
                    </div>
                    <button onClick={removePromo} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError('') }}
                      onKeyDown={e => e.key === 'Enter' && applyPromo()}
                      placeholder="SALE20"
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 text-sm font-mono uppercase focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      onClick={applyPromo}
                      disabled={promoLoading || !promoInput.trim()}
                      className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {promoLoading
                        ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        : "Qo'llash"}
                    </button>
                  </div>
                )}
                {promoError && <p className="text-red-500 text-xs mt-1.5 px-1">{promoError}</p>}
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  {lang === 'uz' ? 'Yetkazish manzili' : 'Yetkazish manzili'}
                </label>

                {/* Map preview when GPS coords available */}
                {coords && (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 mb-2 shadow-sm">
                    <img
                      src={staticMap(coords)}
                      alt="location map"
                      className="w-full h-[130px] object-cover"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                    />
                    <div className="absolute bottom-2 left-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl px-3 py-1.5 flex items-center gap-1.5 shadow-md">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-primary flex-shrink-0">
                        <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-2.079 3.43-4.795 3.43-8.077 0-4.5-3.694-8.25-8.25-8.25S3.75 5.5 3.75 10c0 3.282 1.487 5.998 3.43 8.077a19.58 19.58 0 0 0 2.683 2.282c.328.228.665.442 1.144.742ZM12 13.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" clipRule="evenodd" />
                      </svg>
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-white">
                        {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Address text input — always visible */}
                <textarea
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Ko'cha, uy, kvartira..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                />

                {/* GPS detect button */}
                <button
                  onClick={getLocation}
                  disabled={locLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 mt-2 rounded-xl border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/5 transition-all disabled:opacity-60"
                >
                  {locLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      Aniqlanmoqda...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-2.079 3.43-4.795 3.43-8.077 0-4.5-3.694-8.25-8.25-8.25S3.75 5.5 3.75 10c0 3.282 1.487 5.998 3.43 8.077a19.58 19.58 0 0 0 2.683 2.282c.328.228.665.442 1.144.742ZM12 13.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" clipRule="evenodd" />
                      </svg>
                      {coords ? "Joylashuvni yangilash" : "Joylashuvni aniqlash"}
                    </>
                  )}
                </button>
              </div>

              {/* Payment */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
                  {lang === 'uz' ? "To'lov usuli" : "To'lov usuli"}
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                  <button
                    onClick={() => setPayMode('cash')}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${payMode === 'cash' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
                      <path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 14.625v-9.75ZM8.25 9.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0Z" clipRule="evenodd" />
                      <path d="M2.25 18a.75.75 0 0 0 0 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 0 0-.75-.75H2.25Z" />
                    </svg>
                    Naqd
                  </button>
                  <button
                    onClick={() => setPayMode('online')}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${payMode === 'online' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M4.5 3.75a3 3 0 0 0-3 3v.75h21v-.75a3 3 0 0 0-3-3h-15Z" />
                      <path fillRule="evenodd" d="M22.5 9.75h-21v7.5a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3v-7.5Zm-18 3.75a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5h-6a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z" clipRule="evenodd" />
                    </svg>
                    Online
                  </button>
                </div>

                {payMode === 'cash' && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-emerald-500 flex-shrink-0">
                      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                      Yetkazib beruvchiga naqd to'lanadi
                    </p>
                  </div>
                )}

                {payMode === 'online' && (
                  <div className="grid grid-cols-3 gap-2">
                    {/* Payme */}
                    <button
                      onClick={() => setOnlineMethod('payme')}
                      style={onlineMethod === 'payme' ? { borderColor: '#00BFFF' } : undefined}
                      className={`relative flex flex-col items-center justify-center gap-2 py-3.5 px-2 rounded-2xl border-2 transition-all duration-200 hover:scale-105 ${onlineMethod === 'payme' ? 'bg-[#00BFFF]/10 shadow-md' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-sm'}`}
                    >
                      {onlineMethod === 'payme' && (
                        <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-[#00BFFF] flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-2.5 h-2.5"><path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.208Z" clipRule="evenodd" /></svg>
                        </span>
                      )}
                      <div className="rounded-xl overflow-hidden flex items-center justify-center h-9">
                        <img src="/images/payme.png" alt="Payme" className="h-8 w-auto object-contain drop-shadow-sm" />
                      </div>
                      <span className={`text-[11px] font-bold leading-none ${onlineMethod === 'payme' ? 'text-[#00BFFF]' : 'text-slate-500 dark:text-slate-400'}`}>Payme</span>
                    </button>
                    {/* Click */}
                    <button
                      onClick={() => setOnlineMethod('click')}
                      style={onlineMethod === 'click' ? { borderColor: '#0056FD' } : undefined}
                      className={`relative flex flex-col items-center justify-center gap-2 py-3.5 px-2 rounded-2xl border-2 transition-all duration-200 hover:scale-105 ${onlineMethod === 'click' ? 'bg-[#0056FD]/10 shadow-md' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-sm'}`}
                    >
                      {onlineMethod === 'click' && (
                        <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-[#0056FD] flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-2.5 h-2.5"><path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.208Z" clipRule="evenodd" /></svg>
                        </span>
                      )}
                      <div className="rounded-xl overflow-hidden flex items-center justify-center h-9">
                        <img src="/images/click.png" alt="Click" className="h-8 w-auto object-contain drop-shadow-sm" />
                      </div>
                      <span className={`text-[11px] font-bold leading-none ${onlineMethod === 'click' ? 'text-[#0056FD]' : 'text-slate-500 dark:text-slate-400'}`}>Click</span>
                    </button>
                    {/* Uzum */}
                    <button
                      onClick={() => setOnlineMethod('uzum')}
                      style={onlineMethod === 'uzum' ? { borderColor: '#7000FF' } : undefined}
                      className={`relative flex flex-col items-center justify-center gap-2 py-3.5 px-2 rounded-2xl border-2 transition-all duration-200 hover:scale-105 ${onlineMethod === 'uzum' ? 'bg-[#7000FF]/10 shadow-md' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-sm'}`}
                    >
                      {onlineMethod === 'uzum' && (
                        <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-[#7000FF] flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-2.5 h-2.5"><path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.208Z" clipRule="evenodd" /></svg>
                        </span>
                      )}
                      <div className="rounded-xl overflow-hidden flex items-center justify-center h-9">
                        <img src="/images/uzum.png" alt="Uzum" className="h-8 w-auto object-contain drop-shadow-sm" />
                      </div>
                      <span className={`text-[11px] font-bold leading-none ${onlineMethod === 'uzum' ? 'text-[#7000FF]' : 'text-slate-500 dark:text-slate-400'}`}>Uzum</span>
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <p className="text-red-500 text-xs bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">{error}</p>
              )}
            </div>
          )}

          {/* Cart items */}
          {step === 'cart' && (
            <div className="p-4 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 opacity-30">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272" />
                  </svg>
                  <p className="text-sm font-medium">
                    {lang === 'uz' ? "Savatcha bo'sh" : "Savatcha bo'sh"}
                  </p>
                </div>
              ) : (
                items.map(item => (
                  <div key={item.shopProductId} className="flex gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0">
                      {item.productImage ? (
                        <img
                          src={`${BASE_URL}/static/products/${item.productImage}`}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm leading-snug line-clamp-1">
                        {lang === 'uz' ? item.productName : (item.productNameRu || item.productName)}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{item.shopName}</p>
                      <p className="text-primary font-bold text-sm mt-1">{fmtPrice(item.price * item.qty)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => updateQty(item.shopProductId, item.qty - 1)}
                          className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center hover:bg-primary/20 transition-colors text-slate-700 dark:text-slate-200 font-bold text-sm">-</button>
                        <span className="min-w-[20px] text-center text-sm font-bold text-slate-800 dark:text-slate-200">{item.qty}</span>
                        <button onClick={() => updateQty(item.shopProductId, item.qty + 1)}
                          disabled={item.maxQty != null && item.qty >= item.maxQty}
                          className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center hover:bg-primary/20 transition-colors text-slate-700 dark:text-slate-200 font-bold text-sm disabled:opacity-40">+</button>
                        {item.maxQty != null && <span className="text-xs text-slate-400 ml-1">/ {item.maxQty}</span>}
                      </div>
                    </div>
                    <button onClick={() => removeItem(item.shopProductId)}
                      className="self-start p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer - Cart */}
        {step === 'cart' && items.length > 0 && (
          <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500 dark:text-slate-400">{lang === 'uz' ? 'Mahsulotlar' : 'Mahsulotlar'}</span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{fmtPrice(total)}</span>
            </div>
            {totalDelivery > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500 dark:text-slate-400">{lang === 'uz' ? 'Yetkazib berish' : 'Доставка'}</span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">+{fmtPrice(totalDelivery)}</span>
              </div>
            )}
            <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-700 pt-2">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{lang === 'uz' ? 'Jami' : 'Jami'}</span>
              <span className="text-lg font-bold text-primary">{fmtPrice(grandTotal)}</span>
            </div>
            {!user ? (
              <button onClick={onAuthRequired}
                className="w-full py-3.5 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                </svg>
                {lang === 'uz' ? 'Buyurtma uchun kirish kerak' : 'Kirish kerak'}
              </button>
            ) : (
              <button onClick={() => setStep('checkout')}
                className="w-full py-3.5 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all">
                {lang === 'uz' ? 'Buyurtma berish' : 'Buyurtma berish'}
              </button>
            )}
          </div>
        )}

        {/* Footer - Checkout */}
        {step === 'checkout' && (
          <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <button
              onClick={handleCheckout}
              disabled={loading || !address.trim()}
              className="w-full py-3.5 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Yuborilmoqda...
                </>
              ) : checkoutLabel()}
            </button>
            <button
              onClick={() => { setStep('cart'); setError('') }}
              className="w-full py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:border-primary hover:text-primary transition-all"
            >
              Orqaga
            </button>
          </div>
        )}
      </div>
      {/* Address map modal */}
      {mapModalOpen && (
        <div className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMapModalOpen(false)}
          />
          {/* Modal panel */}
          <div className="relative w-full sm:max-w-sm bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 flex flex-col max-h-[90vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-primary">
                  <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-2.079 3.43-4.795 3.43-8.077 0-4.5-3.694-8.25-8.25-8.25S3.75 5.5 3.75 10c0 3.282 1.487 5.998 3.43 8.077a19.58 19.58 0 0 0 2.683 2.282c.328.228.665.442 1.144.742ZM12 13.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" clipRule="evenodd" />
                </svg>
                <h3 className="font-bold text-slate-800 dark:text-white text-base">
                  {lang === 'uz' ? 'Manzilni o\'zgartirish' : 'Manzilni o\'zgartirish'}
                </h3>
              </div>
              <button
                onClick={() => setMapModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-slate-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Modal body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Map preview */}
              {modalCoords ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                  <img
                    src={staticMap(modalCoords)}
                    alt="map"
                    className="w-full h-[160px] object-cover"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                  />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl px-3 py-1.5 flex items-center gap-1.5 shadow">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-primary flex-shrink-0">
                        <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-2.079 3.43-4.795 3.43-8.077 0-4.5-3.694-8.25-8.25-8.25S3.75 5.5 3.75 10c0 3.282 1.487 5.998 3.43 8.077a19.58 19.58 0 0 0 2.683 2.282c.328.228.665.442 1.144.742ZM12 13.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" clipRule="evenodd" />
                      </svg>
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-white">
                        {modalCoords.lat.toFixed(4)}, {modalCoords.lng.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[100px] rounded-2xl bg-slate-100 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 text-sm">
                  {modalLocLoading ? (
                    <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  ) : (
                    lang === 'uz' ? 'Joylashuv aniqlanmagan' : 'Joylashuv aniqlanmagan'
                  )}
                </div>
              )}
              {/* GPS button */}
              <button
                onClick={detectModalGPS}
                disabled={modalLocLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-primary/40 text-primary text-sm font-semibold hover:bg-primary/5 dark:hover:bg-primary/10 transition-all disabled:opacity-60"
              >
                {modalLocLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    {lang === 'uz' ? 'Aniqlanmoqda...' : 'Aniqlanmoqda...'}
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-2.079 3.43-4.795 3.43-8.077 0-4.5-3.694-8.25-8.25-8.25S3.75 5.5 3.75 10c0 3.282 1.487 5.998 3.43 8.077a19.58 19.58 0 0 0 2.683 2.282c.328.228.665.442 1.144.742ZM12 13.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" clipRule="evenodd" />
                    </svg>
                    {lang === 'uz' ? 'Mening joylashuvim' : 'Mening joylashuvim'}
                  </>
                )}
              </button>
              {/* Address text input */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  {lang === 'uz' ? 'Yoki manzilni yozing' : 'Yoki manzilni yozing'}
                </label>
                <textarea
                  value={modalAddress}
                  onChange={e => setModalAddress(e.target.value)}
                  placeholder="Ko'cha, uy, kvartira..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>
            </div>
            {/* Modal footer */}
            <div className="px-5 pb-5 pt-3 flex gap-3">
              <button
                onClick={() => setMapModalOpen(false)}
                className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:border-primary hover:text-primary transition-all"
              >
                {lang === 'uz' ? 'Bekor qilish' : 'Bekor qilish'}
              </button>
              <button
                onClick={confirmAddrModal}
                disabled={!modalAddress.trim()}
                className="flex-1 py-3 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {lang === 'uz' ? 'Tasdiqlash' : 'Tasdiqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}