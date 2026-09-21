import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useScrollReveal } from '../../../hooks/useScrollReveal'
import { useLang } from '../../../context/AppContext'
import { searchKey, buildSearchKeys, matchesSearch } from '../../../utils/searchKey'
import { productImageUrl } from '../../../utils/productImage'

const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8888'
const API_URL = `${BASE_URL}/api/v1`

interface Product {
  id: number
  name?: string
  name_uz?: string
  name_ru?: string
  image?: string
  desc?: string
  type?: string
  items?: Array<{ name?: string; name_uz?: string; name_ru?: string; desc?: string; image?: string }>
  category?: { id?: number; name_uz?: string; name_ru?: string; name?: string; image?: string }
}

interface Category {
  id: number
  name?: string
  name_uz?: string
  name_ru?: string
}

const SKELETON = Array.from({ length: 8 })

export default function ProductMarketplace() {
  const { lang } = useLang()
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCatId, setActiveCatId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const ref = useScrollReveal()

  useEffect(() => {
    axios.get(`${API_URL}/category/all`)
      .then(res => {
        const d = res.data?.data ?? res.data
        setCategories(Array.isArray(d) ? d : [])
      })
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    axios.get(`${API_URL}/product/all`)
      .then(res => {
        const d = res.data?.data ?? res.data
        setProducts(Array.isArray(d) ? d : [])
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

  const getName = (p: Product) =>
    lang === 'ru' ? p.name_ru || p.name_uz || p.name || '' : p.name_uz || p.name_ru || p.name || ''

  const getCat = (p: Product) =>
    lang === 'ru'
      ? p.category?.name_ru || p.category?.name_uz || p.category?.name || ''
      : p.category?.name_uz || p.category?.name_ru || p.category?.name || ''

  const getCatName = (c: Category) =>
    lang === 'ru' ? c.name_ru || c.name_uz || c.name || '' : c.name_uz || c.name_ru || c.name || ''

  // Match the product's names AND its variant names — e.g. "seyf" is a variant
  // of "Xavfsizlik tizimlari", so searching the product name alone missed it.
  // Keys are Latin/Cyrillic-normalized (searchKey) and built once per list.
  const productKeys = useMemo(() => buildSearchKeys(products, p => [
    p.name, p.name_uz, p.name_ru, p.desc,
    ...(p.items ?? []).flatMap(it => [it.name, it.name_uz, it.name_ru, it.desc]),
  ]), [products])
  const q = searchKey(search)

  const filtered = products.filter(p => {
    // Landing-page catalog PREVIEW stays buyable-only so it doesn't flood the
    // home page with hundreds of "coming soon" cards. The full browse (with
    // coming-soon items) lives on CategoryPage; every category still gets a chip.
    // A search, though, must find them too (shown with the "Qo'shilmoqda" badge).
    if (!(p.items ?? []).length && q === '') return false
    const matchCat = activeCatId === null || p.category?.id === activeCatId
    const matchSearch = matchesSearch(productKeys.get(p), q)
    return matchCat && matchSearch
  })

  // Build the chips from every category a product is linked to (variantless
  // "coming soon" products are shown too now, so any category with ANY product
  // gets a navigable chip). Fall back to /category/all if none carried one.
  const catMap = new Map<number, Category>()
  products.forEach(p => {
    const c = p.category
    if (c?.id != null && !catMap.has(c.id)) {
      catMap.set(c.id, { id: c.id, name: c.name, name_uz: c.name_uz, name_ru: c.name_ru })
    }
  })
  const visibleCategories = catMap.size > 0 ? Array.from(catMap.values()) : categories

  return (
    <section id="Products" ref={ref} className="w-full bg-slate-50 dark:bg-slate-900 py-20 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10 reveal">
          <span className="inline-block bg-primary/10 text-primary font-semibold text-xs px-4 py-1.5 rounded-full mb-4">
            {lang === 'uz' ? 'Mahsulotlar' : 'Товары'}
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            {lang === 'uz' ? "Mahsulotlar katalogi" : "Каталог товаров"}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-base max-w-xl mx-auto">
            {lang === 'uz'
              ? "O'zingizga kerakli qurilish materialini toping"
              : "Найдите нужный строительный материал"}
          </p>
        </div>

        {/* Category filter chips */}
        {visibleCategories.length > 0 && (
          <div className="reveal reveal-delay-1 flex flex-wrap gap-2 justify-center mb-8">
            <button
              onClick={() => setActiveCatId(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                activeCatId === null
                  ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary hover:text-primary'
              }`}
            >
              {lang === 'uz' ? 'Hammasi' : 'Все'}
            </button>
            {visibleCategories.map(c => (
              <button
                key={c.id}
                onClick={() => navigate(`/category/${c.id}`)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                  activeCatId === c.id
                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary hover:text-primary'
                }`}
              >
                {getCatName(c)}
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="reveal reveal-delay-1 max-w-lg mx-auto mb-10">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={lang === 'uz' ? "Mahsulot qidirish..." : "Поиск товара..."}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-primary/30 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-200 placeholder-slate-400 text-sm transition-all"
            />
          </div>
        </div>

        {/* Grid */}
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
          <div className="text-center py-16 text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-40" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <p className="font-medium">{lang === 'uz' ? "Mahsulot topilmadi" : "Товар не найден"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {filtered.map((p, i) => (
              <div
                key={p.id}
                onClick={() => p.category?.id && navigate(`/category/${p.category.id}`)}
                className={`reveal reveal-delay-${Math.min((i % 4) + 1, 6)} group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 border border-slate-100 dark:border-slate-700/50 hover:border-primary/20 dark:hover:border-primary/30 cursor-pointer`}
              >
                {/* Image */}
                <div className="relative w-full h-44 bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  {(() => {
                    const src = productImageUrl(p)
                    return src ? (
                    <img
                      src={src}
                      alt={getName(p)}
                      width={288}
                      height={176}
                      decoding="async"
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={e => { (e.currentTarget as HTMLImageElement).src = '' ; (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                    />
                    ) : null
                  })()}
                  {!productImageUrl(p) && (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-slate-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                      </svg>
                    </div>
                  )}
                  {getCat(p) && (
                    <span className="absolute top-2 left-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-primary text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                      {getCat(p)}
                    </span>
                  )}
                  {!(p.items ?? []).length && (
                    <span className="absolute bottom-2 left-2 bg-slate-800/80 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm backdrop-blur-sm">
                      {lang === 'uz' ? "Qo'shilmoqda" : 'Добавляется'}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {getName(p) || (lang === 'uz' ? "Nomi yo'q" : "Без названия")}
                  </h3>
                  {p.desc && (
                    <p className="text-slate-400 text-xs mt-1 line-clamp-1">{p.desc}</p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
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
            ))}
          </div>
        )}

        {/* Show more hint */}
        {!loading && filtered.length > 0 && (
          <div className="text-center mt-10 reveal">
            <p className="text-slate-400 text-sm">
              {lang === 'uz'
                ? `${filtered.length} ta mahsulot topildi`
                : `Найдено ${filtered.length} товаров`}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
