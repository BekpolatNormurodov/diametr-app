import React, { createContext, useContext, useState, useEffect } from 'react'

export interface CartItem {
  shopProductId: number
  productId: number
  productName: string
  productNameRu?: string
  productImage?: string
  shopId: number
  shopName: string
  deliveryAmount?: number
  price: number
  qty: number
  maxQty?: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'qty'> & { qty?: number }) => void
  removeItem: (shopProductId: number) => void
  updateQty: (shopProductId: number, qty: number) => void
  clearCart: () => void
  total: number
  count: number
}

const CartContext = createContext<CartContextType>({} as CartContextType)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('diametr_cart')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem('diametr_cart', JSON.stringify(items))
  }, [items])

  const addItem = (item: Omit<CartItem, 'qty'> & { qty?: number }) => {
    const qty = item.qty ?? 1
    setItems(prev => {
      const existing = prev.find(i => i.shopProductId === item.shopProductId)
      if (existing) {
        const max = existing.maxQty ?? 9999
        return prev.map(i =>
          i.shopProductId === item.shopProductId
            ? { ...i, qty: Math.min(i.qty + qty, max) }
            : i
        )
      }
      return [...prev, { ...item, qty }]
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

  const total = items.reduce((s, i) => s + i.price * i.qty, 0)
  const count = items.reduce((s, i) => s + i.qty, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
