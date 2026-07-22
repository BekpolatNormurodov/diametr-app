import React, { useEffect, useState, useCallback } from 'react'
import { authService, BASE_URL } from '../../service/authService'
import { useLang } from '../../context/AppContext'

interface OrderProduct {
  id: number
  count: number
  amount: number
  shop_product?: {
    product_item?: {
      product?: { name: string }
      name: string
    }
  }
}

interface Order {
  id: number
  status: string
  amount: number
  address?: string
  payment_type?: string
  discount_percent?: number
  discount_amount?: number
  createdAt: string
  shop?: { id: number; name: string; image?: string }
  products: OrderProduct[]
}

const STATUS_CONFIG: Record<string, { labelUz: string; labelRu: string; color: string; bg: string }> = {
  STARTED:   { labelUz: 'Yangi',       labelRu: 'Новый',       color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/20' },
  CONFIRMED: { labelUz: 'Tasdiqlandi', labelRu: 'Подтверждён', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  FINISHED:  { labelUz: 'Tugallandi',  labelRu: 'Завершён',    color: 'text-primary',                         bg: 'bg-primary/8' },
  CANCELED:  { labelUz: 'Bekor qilindi', labelRu: 'Отменён',   color: 'text-red-500 dark:text-red-400',       bg: 'bg-red-50 dark:bg-red-900/20' },
}

function fmtPrice(n?: number | null) {
  if (!n) return '0 so\'m'
  return n.toLocaleString('uz-UZ') + ' so\'m'
}

function fmtDate(iso: string, lang: string) {
  const d = new Date(iso)
  if (lang === 'uz') {
    return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

interface Props {
  open: boolean
  onClose: () => void
}

export default function OrdersDrawer({ open, onClose }: Props) {
  const { lang } = useLang()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await authService.apiFetch(`${BASE_URL}/api/v1/order/my`)
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.message || `Error ${res.status}`)
      }
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch (e) {
      setError((e as any).message || (lang === 'uz' ? 'Xatolik' : 'Ошибка'))
    } finally {
      setLoading(false)
    }
  }, [lang])

  useEffect(() => {
    if (open) fetchOrders()
  }, [open, fetchOrders])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [open, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:max-w-sm z-[310] bg-white dark:bg-slate-900 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-primary">
                <path d="M5.625 3.75a2.625 2.625 0 1 0 0 5.25h12.75a2.625 2.625 0 0 0 0-5.25H5.625ZM3.75 11.25a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5H3.75ZM3 15.75a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75ZM3.75 18.75a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H3.75Z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-slate-800 dark:text-white text-base leading-tight">
                {lang === 'uz' ? 'Mening buyurtmalarim' : 'Мои заказы'}
              </h2>
              {orders.length > 0 && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{orders.length} ta buyurtma</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchOrders} disabled={loading} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-primary disabled:opacity-40">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-slate-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900">
          {loading && orders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full" style={{ animation: 'spin 0.9s linear infinite', borderWidth: 3 }} />
              <p className="text-sm text-slate-400">{lang === 'uz' ? 'Yuklanmoqda...' : 'Загрузка...'}</p>
            </div>
          )}

          {error && (
            <div className="m-4 px-4 py-3 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && orders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-16 h-16 opacity-30">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
              </svg>
              <p className="text-sm font-medium">
                {lang === 'uz' ? "Hali buyurtmangiz yo'q" : 'Заказов пока нет'}
              </p>
            </div>
          )}

          {orders.length > 0 && (
            <div className="p-4 space-y-3">
              {orders.map(order => {
                const st = STATUS_CONFIG[order.status] ?? STATUS_CONFIG['STARTED']
                const isOpen = expanded === order.id
                return (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Order header */}
                    <button
                      className="w-full flex items-start gap-3 px-4 py-3.5 text-left"
                      onClick={() => setExpanded(isOpen ? null : order.id)}
                    >
                      {/* Shop logo */}
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex-shrink-0 overflow-hidden">
                        {order.shop?.image ? (
                          <img
                            src={`${BASE_URL}/static/shops/${order.shop.image}`}
                            alt={order.shop.name}
                            className="w-full h-full object-cover"
                            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-slate-400">
                              <path d="M5.223 2.25c-.497 0-.974.198-1.325.55l-1.3 1.298A3.75 3.75 0 0 0 7.5 9.75c.627.47 1.406.75 2.25.75.844 0 1.624-.28 2.25-.75.626.47 1.406.75 2.25.75.844 0 1.623-.28 2.25-.75a3.75 3.75 0 0 0 4.902-5.652l-1.3-1.299a1.875 1.875 0 0 0-1.325-.549H5.223Z" />
                              <path fillRule="evenodd" d="M3 20.25v-8.755c1.42.674 3.08.673 4.5 0A5.234 5.234 0 0 0 9.75 12c.804 0 1.568-.182 2.25-.506a5.234 5.234 0 0 0 2.25.506c.804 0 1.567-.182 2.25-.506 1.42.674 3.08.675 4.5.001v8.754a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 1-.75.75H3.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                            #{order.id} · {order.shop?.name ?? '—'}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${st.bg} ${st.color}`}>
                            {lang === 'uz' ? st.labelUz : st.labelRu}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-slate-400 dark:text-slate-500">{fmtDate(order.createdAt ?? (order as any).createdt ?? '', lang)}</span>
                          <span className="text-xs font-bold text-primary">{fmtPrice(order.amount)}</span>
                        </div>
                        {order.discount_amount ? (
                          <span className="text-[10px] text-emerald-500 font-semibold">
                            -{fmtPrice(order.discount_amount)} chegirma ({order.discount_percent}%)
                          </span>
                        ) : null}
                      </div>

                      {/* Expand chevron */}
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"
                        className={`w-4 h-4 text-slate-400 flex-shrink-0 mt-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>

                    {/* Expanded products list */}
                    {isOpen && (
                      <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-4 py-3 space-y-2">
                        {order.address && (
                          <div className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5">
                              <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-2.079 3.43-4.795 3.43-8.077 0-4.5-3.694-8.25-8.25-8.25S3.75 5.5 3.75 10c0 3.282 1.487 5.998 3.43 8.077a19.58 19.58 0 0 0 2.683 2.282c.328.228.665.442 1.144.742ZM12 13.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" clipRule="evenodd" />
                            </svg>
                            <span className="line-clamp-2">{order.address}</span>
                          </div>
                        )}
                        {order.products.map((p, i) => {
                          const name = p.shop_product?.product_item?.product?.name ?? '—'
                          const itemName = p.shop_product?.product_item?.name ?? ''
                          return (
                            <div key={p.id ?? i} className="flex items-center justify-between text-xs">
                              <span className="text-slate-600 dark:text-slate-300 truncate mr-2">
                                {name}{itemName ? ` · ${itemName}` : ''} × {p.count}
                              </span>
                              <span className="font-semibold text-slate-700 dark:text-slate-200 flex-shrink-0">
                                {fmtPrice(p.amount * p.count)}
                              </span>
                            </div>
                          )
                        })}
                        <div className="border-t border-slate-100 dark:border-slate-700 mt-2 pt-2 flex justify-between text-xs font-bold text-slate-800 dark:text-white">
                          <span>{lang === 'uz' ? "Jami to'landi" : 'Итого'}</span>
                          <span className="text-primary">{fmtPrice(order.amount)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
