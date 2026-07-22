import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useScrollReveal } from '../../../hooks/useScrollReveal'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../../../context/AppContext'

const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8888'
const API_URL = `${BASE_URL}/api/v1`

interface CategoryItem {
  id: number
  name?: string
  name_uz?: string
  name_ru?: string
  image?: string
}

const FALLBACK_EMOJI = "📦"

function formatCount(n: number): string {
  if (n === 0) return ''
  if (n >= 1000) return `${Math.floor(n / 1000)}K+`
  if (n >= 100) return `${Math.floor(n / 100) * 100}+`
  if (n >= 50) return `${Math.floor(n / 10) * 10}+`
  if (n >= 10) return `${Math.floor(n / 10) * 10}+`
  return `${n}+`
}

export default function CategoryGrid() {
  const { lang } = useLang()
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [productCounts, setProductCounts] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)
  const ref = useScrollReveal()
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      axios.get(`${API_URL}/category/all`),
      axios.get(`${API_URL}/product/all`),
    ])
      .then(([catRes, prodRes]) => {
        const catsRaw: CategoryItem[] = Array.isArray(catRes.data?.data ?? catRes.data) ? (catRes.data?.data ?? catRes.data) : []
        // Newest first
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
    if (lang === "ru") return cat.name_ru || cat.name_uz || cat.name || ""
    return cat.name_uz || cat.name_ru || cat.name || ""
  }

  return (
    <section id="CategoryGrid" ref={ref} className="w-full bg-white dark:bg-slate-900 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 reveal">
          <span className="inline-block bg-primary/10 text-primary font-semibold text-xs px-4 py-1.5 rounded-full mb-4">
            {lang === "uz" ? "Kategoriyalar" : "Категории"}
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            {lang === "uz" ? "Kategoriyalar" : "Категории"}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-base max-w-xl mx-auto">
            {lang === "uz"
              ? "Qurilish uchun zarur bo'lgan barcha materiallarni bir joydan toping"
              : "Найдите все необходимые материалы для строительства в одном месте"}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden animate-pulse border border-slate-100 dark:border-slate-700">
                <div className="h-32 sm:h-36 bg-slate-200 dark:bg-slate-700 w-full" />
                <div className="px-3 py-2.5 flex items-center gap-2">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded flex-1" />
                  <div className="w-3.5 h-3.5 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="text-center text-slate-400 py-8">
            {lang === "uz" ? "Kategoriyalar topilmadi" : "Категории не найдены"}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-5">
            {categories.slice(0, 8).map((cat) => {
              const count = productCounts[cat.id] || 0
              return (
              <div
                key={cat.id}
                onClick={() => navigate(`/category/${cat.id}`)}
                style={{ transitionDelay: `${(categories.indexOf(cat) % 8) * 0.06}s` }}
                className="reveal group relative flex flex-col bg-white dark:bg-slate-800 border border-primary/20 dark:border-slate-700 rounded-2xl overflow-hidden hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 cursor-pointer hover:-translate-y-1"
              >
                {/* Image area */}
                <div className="relative h-32 sm:h-36 bg-gradient-to-br from-primary/5 to-slate-100 dark:from-primary/10 dark:to-slate-700 overflow-hidden">
                  {cat.image ? (
                    <img
                      src={`${BASE_URL}/static/categories/${cat.image}`}
                      alt={getName(cat)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-5xl group-hover:scale-110 transition-transform duration-200">{FALLBACK_EMOJI}</span>
                    </div>
                  )}
                  {/* Count badge */}
                  {count > 0 && (
                    <span className="absolute top-2 right-2 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                      {formatCount(count)}
                    </span>
                  )}
                </div>

                {/* Name */}
                <div className="px-3 py-2.5 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {getName(cat)}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-slate-300 dark:text-slate-500 group-hover:text-primary flex-shrink-0 transition-colors">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </div>
              )
            })}
          </div>
        )}

        {!loading && categories.length > 0 && (
          <div className="text-center mt-10">
            <button
              onClick={() => navigate('/categories')}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-primary text-white font-semibold text-sm hover:bg-accent transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5"
            >
              {lang === "uz"
                ? (categories.length > 8 ? `Barcha ${categories.length} ta kategoriyani ko'rish` : "Barcha kategoriyalarni ko'rish")
                : (categories.length > 8 ? `Посмотреть все ${categories.length} категорий` : "Посмотреть все категории")}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

