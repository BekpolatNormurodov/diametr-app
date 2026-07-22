import React from 'react'

interface StoreFilterProps {
  tab: 'categories' | 'shops'
  lang: string
  filterMinPrice: string
  filterMaxPrice: string
  setFilterMinPrice: (v: string) => void
  setFilterMaxPrice: (v: string) => void
  filterMinKm: string
  filterMaxKm: string
  setFilterMinKm: (v: string) => void
  setFilterMaxKm: (v: string) => void
  userCoords: { lat: number; lon: number } | null
  hasFilter: boolean
  resetAll: () => void
  // shops region multi-select
  regions?: string[]
  filterShopRegions?: string[]
  setFilterShopRegions?: (v: string[]) => void
}

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
  </svg>
)

function NumInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  const fmt = (v: string) => {
    const r = v.replace(/\D/g, '')
    return r ? r.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''
  }
  return (
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={e => onChange(fmt(e.target.value))}
        placeholder={placeholder}
        className="w-24 pl-2.5 pr-6 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-400"
        >
          <XIcon />
        </button>
      )}
    </div>
  )
}

export default function StoreFilter({
  tab,
  lang,
  filterMinPrice,
  filterMaxPrice,
  setFilterMinPrice,
  setFilterMaxPrice,
  filterMinKm,
  filterMaxKm,
  setFilterMinKm,
  setFilterMaxKm,
  userCoords,
  hasFilter,
  resetAll,
  regions = [],
  filterShopRegions = [],
  setFilterShopRegions,
}: StoreFilterProps) {
  const toggleRegion = (r: string) => {
    if (!setFilterShopRegions) return
    setFilterShopRegions(
      filterShopRegions.includes(r)
        ? filterShopRegions.filter(x => x !== r)
        : [...filterShopRegions, r]
    )
  }

  return (
    <div className="flex flex-col gap-0 py-2">
      {/* Row: distance / price inputs + reset */}
      <div className="flex items-center gap-2 flex-wrap py-1">
        {/* Shops: km range */}
        {tab === 'shops' && (
          <>
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
              {lang === 'ru' ? 'Расстояние:' : 'Masofa:'}
            </span>
            <NumInput value={filterMinKm} onChange={setFilterMinKm} placeholder={lang === 'ru' ? 'Мин' : 'Min'} />
            <span className="text-slate-300 text-xs">—</span>
            <NumInput value={filterMaxKm} onChange={setFilterMaxKm} placeholder={lang === 'ru' ? 'Макс' : 'Max'} />
            <span className="text-xs text-slate-500 font-medium">km</span>
            {!userCoords && (filterMinKm || filterMaxKm) && (
              <span className="text-[10px] text-amber-400">
                {lang === 'ru' ? '(нужна геолокация)' : '(joylashuv kerak)'}
              </span>
            )}
          </>
        )}

        {/* Categories: price range */}
        {tab === 'categories' && (
          <>
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
              {lang === 'ru' ? 'Цена:' : 'Narx:'}
            </span>
            <NumInput value={filterMinPrice} onChange={setFilterMinPrice} placeholder={lang === 'ru' ? 'Мин' : 'Min'} />
            <span className="text-slate-300 text-xs">—</span>
            <NumInput value={filterMaxPrice} onChange={setFilterMaxPrice} placeholder={lang === 'ru' ? 'Макс' : 'Max'} />
            <span className="text-xs text-slate-500 font-medium">{lang === 'ru' ? 'сум' : "so'm"}</span>
          </>
        )}

        {/* Reset */}
        {hasFilter && (
          <button
            onClick={resetAll}
            className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 text-xs font-semibold transition-all ml-1"
          >
            <XIcon />
            {lang === 'ru' ? 'Сбросить' : 'Tozalash'}
          </button>
        )}
      </div>

      {/* Row: region chips (shops only) */}
      {tab === 'shops' && regions.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap py-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap flex-shrink-0">
            {lang === 'ru' ? 'Регион:' : 'Region:'}
          </span>
          {regions.map(r => {
            const active = filterShopRegions.includes(r)
            return (
              <button
                key={r}
                onClick={() => toggleRegion(r)}
                className={`flex items-center gap-1 h-7 px-3 rounded-full text-xs font-semibold border transition-all duration-150 select-none ${
                  active
                    ? 'bg-primary text-white border-primary shadow-sm shadow-primary/30'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary/60 hover:text-primary hover:bg-primary/5'
                }`}
              >
                {active && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-2.5 h-2.5 flex-shrink-0">
                    <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                  </svg>
                )}
                {r}
              </button>
            )
          })}
          {filterShopRegions.length > 0 && (
            <button
              onClick={() => setFilterShopRegions && setFilterShopRegions([])}
              className="flex items-center gap-1 h-7 px-2.5 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-900/20 text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-600 transition-all"
            >
              <XIcon />
              {lang === 'ru' ? 'Сбросить' : 'Tozalash'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
