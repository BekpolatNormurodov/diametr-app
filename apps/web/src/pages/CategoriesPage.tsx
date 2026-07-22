import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/home/sections/navbar'
import Footer from '../components/home/sections/footer'
import AuthModal from '../components/auth/AuthModal'
import CartDrawer from '../components/cart/CartDrawer'
import { authService, AuthUser } from '../service/authService'
import { useLang } from '../context/AppContext'
import { useScrollReveal } from '../hooks/useScrollReveal'

const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8888'
const API_URL = `${BASE_URL}/api/v1`

interface CategoryItem {
  id: number
  name?: string
  name_uz?: string
  name_ru?: string
  image?: string
}

const FALLBACK_EMOJI = '📦'

function formatCount(n: number): string {
  if (n === 0) return ''
  if (n >= 1000) return `${Math.floor(n / 1000)}K+`
  if (n >= 100) return `${Math.floor(n / 100) * 100}+`
  if (n >= 10) return `${Math.floor(n / 10) * 10}+`
  return `${n}+`
}

const SKELETON = Array.from({ length: 12 })

export default function CategoriesPage() {
  const { lang } = useLang()
  const navigate = useNavigate()
  const ref = useScrollReveal()

  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [productCounts, setProductCounts] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [user, setUser] = useState<AuthUser | null>(() => authService.getUser())
  const [authOpen, setAuthOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)

  useEffect(() => {
    Promise.all([
      axios.get(`${API_URL}/category/all`),
      axios.get(`${API_URL}/product/all`),
    ])
      .then(([catRes, prodRes]) => {
        const catsRaw: CategoryItem[] = Array.isArray(catRes.data?.data ?? catRes.data) ? (catRes.data?.data ?? catRes.data) : []
        const cats = [...catsRaw].sort((a, b) => (b.id ?? 0) - (a.id ?? 0))
        const prods: Array<{ category?: { id: number } }> = Array.isArray(prodRes.data?.data ?? prodRes.data) ? (prodRes.data?.data ?? prodRes.data) : []
        const counts: Record<number, number> = {}
        prods.forEach(p => { if (p.category?.id) counts[p.category.id] = (counts[p.category.id] || 0) + 1 })
        setCategories(cats)
        setProductCounts(counts)
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false))
  }, [])

  const getName = (cat: CategoryItem) => {
    if (lang === 'ru') return cat.name_ru || cat.name_uz || cat.name || ''
    return cat.name_uz || cat.name_ru || cat.name || ''
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return categories
    return categories.filter(c =>
      [c.name_uz, c.name_ru, c.name].filter(Boolean).join(' ').toLowerCase().includes(q)
    )
  }, [categories, search])

  const totalProducts = useMemo(
    () => Object.values(productCounts).reduce((s, n) => s + n, 0),
    [productCounts]
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <Navbar
        user={user}
        onAuthClick={() => setAuthOpen(true)}
        onLogout={() => { authService.logout(); setUser(null) }}
        onCartClick={() => setCartOpen(true)}
      />
      <div className="h-[76px] flex-shrink-0" />

      <section ref={ref} className="w-full bg-white dark:bg-slate-900 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 reveal">
            <span className="inline-block bg-primary/10 text-primary font-semibold text-xs px-4 py-1.5 rounded-full mb-4">
              {lang === 'uz' ? 'Kategoriyalar' : 'Категории'}
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-3">
              {lang === 'uz' ? 'Barcha kategoriyalar' : 'Все категории'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base max-w-xl mx-auto">
              {lang === 'uz'
                ? `${categories.length} ta kategoriya · ${totalProducts.toLocaleString()}+ mahsulot`
                : `${categories.length} категорий · ${totalProducts.toLocaleString()}+ товаров`}
            </p>
          </div>

          {/* Search */}
          <div className="max-w-xl mx-auto mb-10 reveal">
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={lang === 'uz' ? 'Kategoriya qidirish...' : 'Поиск категории...'}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 flex items-center justify-center text-slate-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
              {SKELETON.map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden animate-pulse border border-slate-100 dark:border-slate-700">
                  <div className="h-32 sm:h-36 bg-slate-200 dark:bg-slate-700 w-full" />
                  <div className="px-3 py-2.5 flex items-center gap-2">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded flex-1" />
                    <div className="w-3.5 h-3.5 bg-slate-200 dark:bg-slate-700 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-slate-400 py-16">
              {lang === 'uz' ? 'Kategoriyalar topilmadi' : 'Категории не найдены'}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
              {filtered.map((cat, i) => {
                const count = productCounts[cat.id] || 0
                return (
                  <div
                    key={cat.id}
                    onClick={() => navigate(`/category/${cat.id}`)}
                    className="group relative flex flex-col bg-white dark:bg-slate-800 border border-primary/20 dark:border-slate-700 rounded-2xl overflow-hidden hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 cursor-pointer hover:-translate-y-1"
                  >
                    <div className="relative h-32 sm:h-36 bg-gradient-to-br from-primary/5 to-slate-100 dark:from-primary/10 dark:to-slate-700 overflow-hidden">
                      {cat.image ? (
                        <img
                          src={`${BASE_URL}/static/categories/${cat.image}`}
                          alt={getName(cat)}
                          width={228}
                          height={144}
                          loading={i < 4 ? 'eager' : 'lazy'}
                          fetchPriority={i < 4 ? 'high' : undefined}
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-5xl group-hover:scale-110 transition-transform duration-200">{FALLBACK_EMOJI}</span>
                        </div>
                      )}
                      {count > 0 && (
                        <span className="absolute top-2 right-2 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                          {formatCount(count)}
                        </span>
                      )}
                    </div>
                    <div className="px-3 py-2.5 flex items-center justify-between gap-2">
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-snug group-hover:text-primary transition-colors line-clamp-2">
                          {getName(cat)}
                        </span>
                        {count > 0 && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            {count} {lang === 'uz' ? 'ta mahsulot' : 'товаров'}
                          </span>
                        )}
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-slate-300 dark:text-slate-500 group-hover:text-primary flex-shrink-0 transition-colors">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

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
