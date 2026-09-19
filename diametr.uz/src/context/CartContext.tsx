import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { BASE_URL } from '../service/authService'

export interface CartItem {
  shopProductId: number
  productId: number
  productName: string
  productNameRu?: string
  productImage?: string
  /** Human label of the variant (name, or value+unit / size / colour) */
  variantLabel?: string
  shopId: number
  shopName: string
  deliveryAmount?: number
  price: number
  qty: number
  maxQty?: number
  /** Set by revalidateCart: the stock row can no longer be ordered (deleted, sold out, shop blocked…) */
  unavailable?: boolean
}

export interface CartRevalidation {
  /** false when at least one line could not be checked (network / server error) */
  ok: boolean
  /** true when a price, delivery price, quantity limit or availability changed, or a line was dropped */
  changed: boolean
  /** the cart after applying the fresh data */
  items: CartItem[]
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'qty'> & { qty?: number }) => void
  removeItem: (shopProductId: number) => void
  updateQty: (shopProductId: number, qty: number) => void
  clearCart: () => void
  /** Re-reads every line from GET /shop-product/:id and patches the cart */
  revalidateCart: () => Promise<CartRevalidation>
  /** Sum of the orderable (not unavailable) lines */
  total: number
  /** Quantity of the orderable (not unavailable) lines */
  count: number
}

const CART_KEY = 'diametr_cart'
const API = `${BASE_URL}/api/v1`

const CartContext = createContext<CartContextType>({} as CartContextType)

const isPositiveInt = (v: unknown): v is number =>
  typeof v === 'number' && isFinite(v) && v > 0 && Math.floor(v) === v

const toNum = (v: unknown): number | null => {
  if (v == null || v === '') return null
  const n = Number(v)
  return isFinite(n) ? n : null
}

/** Shared price rule: the discount counts only when 0 < bonus_price < price */
export const effectivePrice = (price?: number | null, bonus?: number | null): number | null => {
  if (price == null) return null
  return bonus != null && bonus > 0 && bonus < price ? bonus : price
}

/** Readable variant label: its name, else "value unit · size · colour" (hex colours skipped) */
export function variantLabelOf(v?: {
  name?: string | null
  value?: number | string | null
  unit_type?: { symbol?: string | null } | null
  size?: string | null
  color?: string | null
} | null): string | undefined {
  if (!v) return undefined
  const name = (v.name ?? '').toString().trim()
  if (name) return name
  const parts: string[] = []
  if (v.value != null && String(v.value) !== '') {
    const symbol = v.unit_type?.symbol
    parts.push(symbol ? `${v.value} ${symbol}` : String(v.value))
  }
  if (v.size) parts.push(String(v.size))
  if (v.color && !String(v.color).startsWith('#')) parts.push(String(v.color))
  return parts.length ? parts.join(' · ') : undefined
}

/** Reads the saved cart, dropping malformed lines and duplicates */
function parseCart(raw: string | null): CartItem[] {
  if (!raw) return []
  try {
    const data = JSON.parse(raw)
    if (!Array.isArray(data)) return []
    const seen = new Set<number>()
    return data.filter((i: any) => {
      if (!i || typeof i !== 'object') return false
      if (!isPositiveInt(i.shopProductId) || seen.has(i.shopProductId)) return false
      if (typeof i.price !== 'number' || !isFinite(i.price) || !isPositiveInt(i.qty)) return false
      if (typeof i.shopId !== 'number') return false
      seen.add(i.shopProductId)
      return true
    }).map((i: CartItem) => (
      // A line without a real shop (orphan stock row) can never be ordered
      i.shopId > 0 || i.unavailable ? i : { ...i, unavailable: true }
    ))
  } catch {
    return []
  }
}

type LineCheck =
  | { kind: 'gone' }
  | { kind: 'error' }
  | { kind: 'row'; row: any }

const LINE_CHECK_TIMEOUT_MS = 15000

async function fetchLine(id: number): Promise<LineCheck> {
  // A stalled request must not leave the cart stuck on "Tekshirilmoqda..."
  // (revalidations are de-duplicated, so one hung call would block checkout)
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timer = controller ? window.setTimeout(() => controller.abort(), LINE_CHECK_TIMEOUT_MS) : 0
  try {
    // no-store: skip the browser cache and (via the Cache-Control request header
    // the browser adds) nginx's API cache, without a CORS preflight
    const res = await fetch(`${API}/shop-product/${id}`, {
      cache: 'no-store',
      ...(controller ? { signal: controller.signal } : {}),
    })
    if (res.status === 404 || res.status === 410) return { kind: 'gone' }
    if (!res.ok) return { kind: 'error' }
    const body = await res.json()
    const row = body && body.id == null && body.data ? body.data : body
    if (!row || typeof row !== 'object' || Number(row.id) !== id) return { kind: 'error' }
    return { kind: 'row', row }
  } catch {
    return { kind: 'error' }
  } finally {
    if (timer) window.clearTimeout(timer)
  }
}

const isWorking = (status: unknown) => status == null || status === 'WORKING'

/** Applies fresh stock rows to a cart. Pure — used both for state and for the returned snapshot. */
function applyChecks(list: CartItem[], checks: Map<number, LineCheck>): { items: CartItem[]; changed: boolean } {
  let changed = false
  const out: CartItem[] = []

  list.forEach(item => {
    const check = checks.get(item.shopProductId)
    if (!check || check.kind === 'error') {
      out.push(item)
      return
    }
    if (check.kind === 'gone') {
      if (!item.unavailable) changed = true
      out.push(item.unavailable ? item : { ...item, unavailable: true })
      return
    }

    const row = check.row
    const pi = row.product_item && typeof row.product_item === 'object' ? row.product_item : null
    const product = pi && pi.product && typeof pi.product === 'object' ? pi.product : null
    const shop = row.shop && typeof row.shop === 'object' ? row.shop : null

    // Legacy line saved before the shop_product_id fix: its id pointed at a PRODUCT,
    // so the row it resolves to belongs to another shop / product. Drop it.
    const rowShopId = toNum(row.shop_id ?? (shop ? shop.id : null))
    const rowProductId = toNum(product ? product.id : pi ? pi.product_id : null)
    const rowVariantId = toNum(row.product_item_id ?? (pi ? pi.id : null))
    if (rowShopId != null && item.shopId > 0 && rowShopId !== item.shopId) {
      changed = true
      return
    }
    if (rowProductId != null && item.productId > 0 && item.productId !== rowProductId && item.productId !== rowVariantId) {
      changed = true
      return
    }

    const price = toNum(row.price)
    const bonus = toNum(row.bonus_price)
    const eff = typeof row.effective_price === 'number' ? row.effective_price : effectivePrice(price, bonus)
    const stock = Math.max(0, Math.floor(toNum(row.count) ?? 0))
    // A line saved without a real shop (orphan stock row) stays unorderable even if
    // the row was later given a shop — the customer never picked that shop.
    const available = item.shopId > 0 && eff != null && stock > 0 && (
      typeof row.available === 'boolean'
        ? row.available
        : row.work_status === 'WORKING' &&
          row.shop_id != null &&
          isWorking(pi ? pi.work_status : null) &&
          isWorking(product ? product.work_status : null) &&
          isWorking(shop ? shop.work_status : null)
    )

    const next: CartItem = { ...item }
    if (shop && shop.name) next.shopName = shop.name
    if (product) {
      const uz = product.name_uz || product.name || product.name_ru
      if (uz) next.productName = uz
      if (product.name_ru) next.productNameRu = product.name_ru
      // The product photo is authoritative (older lines stored a variant photo,
      // which the cart can't load from the products folder)
      if ('image' in product) next.productImage = product.image || undefined
    }
    const label = variantLabelOf(pi)
    if (label) next.variantLabel = label

    if (!available) {
      if (!item.unavailable) changed = true
      next.unavailable = true
      out.push(next)
      return
    }

    if (item.unavailable) {
      changed = true
      delete next.unavailable
    }
    if (eff !== item.price) {
      changed = true
      next.price = eff as number
    }
    if (shop) {
      const delivery = toNum(shop.delivery_amount) ?? 0
      if (delivery !== (item.deliveryAmount ?? 0)) changed = true
      next.deliveryAmount = delivery
    }
    next.maxQty = stock
    if (item.qty > stock) {
      changed = true
      next.qty = stock
    }
    out.push(next)
  })

  return { items: out, changed }
}

/** Copies only the defined fields of `patch` over `base` */
function mergeDefined(base: CartItem, patch: Partial<CartItem>): CartItem {
  const out: any = { ...base }
  Object.keys(patch).forEach(key => {
    const value = (patch as any)[key]
    if (value !== undefined) out[key] = value
  })
  return out as CartItem
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      return parseCart(localStorage.getItem(CART_KEY))
    } catch {
      return []
    }
  })
  const itemsRef = useRef(items)
  itemsRef.current = items
  const lastSavedRef = useRef<string | null>(null)
  const inFlightRef = useRef<Promise<CartRevalidation> | null>(null)

  useEffect(() => {
    const json = JSON.stringify(items)
    if (json === lastSavedRef.current) return
    lastSavedRef.current = json
    try {
      localStorage.setItem(CART_KEY, json)
    } catch {
      // storage full / unavailable — the in-memory cart still works
    }
  }, [items])

  // Keep every open tab on the same cart (another tab added, ordered or cleared)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== null && e.key !== CART_KEY) return
      lastSavedRef.current = e.newValue
      setItems(parseCart(e.key === null ? null : e.newValue))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const addItem = (item: Omit<CartItem, 'qty'> & { qty?: number }) => {
    const { qty: addQty, ...fresh } = item
    const qty = addQty ?? 1
    // Out of stock, or a stock row without a real shop — can't be ordered
    if (fresh.maxQty != null && fresh.maxQty <= 0) return
    if (!(fresh.shopId > 0) || !(fresh.shopProductId > 0) || !(qty > 0)) return
    setItems(prev => {
      const existing = prev.find(i => i.shopProductId === fresh.shopProductId)
      if (existing) {
        // The page just loaded this row, so take its price / stock / delivery too
        return prev.map(i => {
          if (i.shopProductId !== fresh.shopProductId) return i
          const merged = mergeDefined(i, fresh)
          delete merged.unavailable
          merged.qty = Math.min(i.qty + qty, fresh.maxQty ?? i.maxQty ?? 9999)
          return merged
        })
      }
      return [...prev, { ...fresh, qty: Math.min(qty, fresh.maxQty ?? 9999) }]
    })
  }

  const removeItem = (shopProductId: number) =>
    setItems(prev => prev.filter(i => i.shopProductId !== shopProductId))

  const updateQty = (shopProductId: number, qty: number) =>
    setItems(prev =>
      qty <= 0
        ? prev.filter(i => i.shopProductId !== shopProductId)
        : prev.map(i =>
            i.shopProductId === shopProductId
              ? { ...i, qty: Math.min(qty, i.maxQty ?? 9999) }
              : i
          )
    )

  const clearCart = () => setItems([])

  const revalidateCart = useCallback((): Promise<CartRevalidation> => {
    if (inFlightRef.current) return inFlightRef.current
    const run = async (): Promise<CartRevalidation> => {
      const snapshot = itemsRef.current
      if (snapshot.length === 0) return { ok: true, changed: false, items: snapshot }
      const ids = Array.from(new Set(snapshot.map(i => i.shopProductId)))
      const results = await Promise.all(ids.map(id => fetchLine(id)))
      const checks = new Map<number, LineCheck>()
      ids.forEach((id, idx) => checks.set(id, results[idx]))
      const ok = results.every(r => r.kind !== 'error')
      const applied = applyChecks(itemsRef.current, checks)
      setItems(prev => applyChecks(prev, checks).items)
      return { ok, changed: applied.changed, items: applied.items }
    }
    const promise = run().then(
      result => { inFlightRef.current = null; return result },
      () => { inFlightRef.current = null; return { ok: false, changed: false, items: itemsRef.current } }
    )
    inFlightRef.current = promise
    return promise
  }, [])

  const orderable = items.filter(i => !i.unavailable)
  const total = orderable.reduce((s, i) => s + i.price * i.qty, 0)
  const count = orderable.reduce((s, i) => s + i.qty, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, revalidateCart, total, count }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
