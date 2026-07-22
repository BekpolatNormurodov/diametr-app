import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from "../../../assets/logo.png"
import { AuthUser } from '../../../service/authService'
import { useLang } from '../../../context/AppContext'
import { useCart } from '../../../context/CartContext'
import OrdersDrawer from '../../orders/OrdersDrawer'

function FlagUZ({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.67} viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 3, display: "block", flexShrink: 0 }}>
      <rect width="30" height="6.67" fill="#1EB2FF"/>
      <rect y="6.67" width="30" height="6.67" fill="#FFFFFF"/>
      <rect y="13.33" width="30" height="6.67" fill="#32CD32"/>
      <rect y="6.2" width="30" height="0.47" fill="#CE1126"/>
      <rect y="13.33" width="30" height="0.47" fill="#CE1126"/>
      {/* Crescent */}
      <circle cx="7" cy="3.33" r="2.1" fill="#FFFFFF"/>
      <circle cx="8.1" cy="3.33" r="1.65" fill="#1EB2FF"/>
      {/* 3 stars */}
      <polygon points="11.5,1.5 12,2.7 13.2,2.7 12.3,3.4 12.6,4.6 11.5,3.9 10.4,4.6 10.7,3.4 9.8,2.7 11,2.7" fill="#FFFFFF"/>
      <polygon points="13.8,1.5 14.3,2.7 15.5,2.7 14.6,3.4 14.9,4.6 13.8,3.9 12.7,4.6 13,3.4 12.1,2.7 13.3,2.7" fill="#FFFFFF"/>
      <polygon points="16.1,1.5 16.6,2.7 17.8,2.7 16.9,3.4 17.2,4.6 16.1,3.9 15,4.6 15.3,3.4 14.4,2.7 15.6,2.7" fill="#FFFFFF"/>
    </svg>
  )
}

function FlagRU({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.67} viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 3, display: "block", flexShrink: 0 }}>
      <rect width="30" height="6.67" fill="#FFFFFF"/>
      <rect y="6.67" width="30" height="6.67" fill="#0039A6"/>
      <rect y="13.33" width="30" height="6.67" fill="#D52B1E"/>
    </svg>
  )
}

const NAV_LINKS = [
  { title: "Bosh sahifa", titleRu: "Главная",      id: "Main" },
  { title: "Katalog",     titleRu: "Каталог",       id: "CategoryGrid" },
  { title: "Afzalliklar", titleRu: "Преимущества",  id: "Customer" },
  { title: "Savollar",    titleRu: "Вопросы",       id: "Questions" },
  { title: "Aloqa",       titleRu: "Контакты",      id: "Footer" },
]

const LANGS = [
  { code: "uz", label: "O'zbek", short: "UZ", Flag: FlagUZ },
  { code: "ru", label: "Русский", short: "RU", Flag: FlagRU },
]

function LangDropdown({ lang, onLangChange }: { lang: "uz" | "ru"; onLangChange?: (l: "uz" | "ru") => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = LANGS.find(l => l.code === lang)!

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-primary/30 bg-white dark:bg-slate-800 dark:border-slate-600 hover:bg-primary/5 dark:hover:bg-slate-700 hover:border-primary dark:hover:border-primary transition-all duration-200 shadow-sm group"
      >
        <current.Flag size={22} />
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-primary">{current.short}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
          strokeWidth={2.5} stroke="currentColor"
          className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-400 group-hover:text-primary transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Dropdown */}
      <div
        className={`absolute right-0 mt-2 w-44 bg-white dark:bg-slate-800 dark:border-slate-700 rounded-2xl shadow-xl border border-primary/20 overflow-hidden transition-all duration-200 origin-top-right z-50 ${
          open ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
        }`}
        style={{ transform: open ? "scale(1) translateY(0)" : "scale(0.95) translateY(-8px)" }}
      >
        <div className="p-1.5">
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => { onLangChange?.(l.code as "uz" | "ru"); setOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                lang === l.code
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-700 dark:text-slate-200 hover:bg-primary/5 dark:hover:bg-primary/10 hover:text-primary"
              }`}
            >
              <l.Flag size={26} />
              <div className="flex flex-col items-start">
                <span className="font-semibold text-xs leading-tight">{l.short}</span>
                <span className={`text-xs leading-tight ${lang === l.code ? "text-white/70" : "text-slate-400 dark:text-slate-500"}`}>{l.label}</span>
              </div>
              {lang === l.code && (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 ml-auto">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Navbar({ onAuthClick, user, onLogout, onCartClick }: {
  onAuthClick?: () => void
  user?: AuthUser | null
  onLogout?: () => void
  onCartClick?: () => void
}) {
  const { lang, setLang, theme, toggleTheme } = useLang()
  const { count: cartCount } = useCart()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [ordersOpen, setOrdersOpen] = useState(false)
  const [logoutConfirm, setLogoutConfirm] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const scrollTo = (id: string) => {
    setMenuOpen(false)
    if (window.location.pathname !== '/') {
      navigate('/', { state: { scrollTo: id } })
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <>
    <header className="w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm fixed top-0 left-0 right-0 z-50 shadow-sm border-b border-primary/20 dark:border-primary/10 transition-colors duration-300">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Logo card */}
        <div
          className="relative flex items-center justify-center cursor-pointer overflow-hidden flex-shrink-0"
          onClick={() => navigate('/')}
          style={{
            width: 52, height: 52,
            background: 'linear-gradient(140deg, rgba(0,196,140,0.18) 0%, rgba(0,20,12,0.96) 100%)',
            boxShadow: '0 0 0 1.5px rgba(0,196,140,0.30), 0 0 24px 4px rgba(0,196,140,0.16), 0 4px 16px rgba(0,0,0,0.35)',
            borderRadius: 14,
          }}
        >
          {/* Corner shine */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, transparent 45%)',
            borderRadius: 14,
          }} />
          {/* Shimmer sweep */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'linear-gradient(108deg, transparent 15%, rgba(255,255,255,0.30) 48%, rgba(200,255,240,0.15) 52%, transparent 85%)',
            animation: 'splashShimmer 2.8s 0.4s ease-in-out infinite',
            borderRadius: 14,
            zIndex: 3,
          }} />
          <img
            src={logo}
            alt="Diametr"
            className="object-contain"
            style={{ width: 32, height: 32, filter: 'brightness(0) invert(1) drop-shadow(0 0 6px rgba(0,196,140,0.8))', position: 'relative', zIndex: 4 }}
          />
        </div>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map(link => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10 rounded-lg transition-all duration-200 text-sm"
            >
              {lang === "uz" ? link.title : link.titleRu}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Language dropdown (desktop) */}
          <div className="hidden sm:block">
            <LangDropdown lang={lang} onLangChange={setLang} />
          </div>

          {/* Search button */}
          <button
            onClick={() => navigate('/category/all', { state: { focusSearch: true } })}
            className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary bg-white dark:bg-slate-800 hover:bg-primary/5 dark:hover:bg-primary/10 text-slate-500 dark:text-slate-300 hover:text-primary transition-all duration-200 shadow-sm"
            title={lang === 'uz' ? 'Qidirish' : 'Поиск'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </button>

          {/* Cart button */}
          <button
            onClick={onCartClick}
            className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary bg-white dark:bg-slate-800 hover:bg-primary/5 dark:hover:bg-primary/10 text-slate-500 dark:text-slate-300 hover:text-primary transition-all duration-200 shadow-sm"
            title={lang === 'uz' ? 'Savatcha' : 'Корзина'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary bg-white dark:bg-slate-800 hover:bg-primary/5 dark:hover:bg-primary/10 text-slate-500 dark:text-slate-300 hover:text-primary transition-all duration-200 shadow-sm"
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
              </svg>
            )}
          </button>

          {/* Auth button / Profile */}
          {user ? (
            <div ref={profileRef} className="hidden sm:block relative">
              <button
                onClick={() => setProfileOpen(o => !o)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-primary/30 bg-white dark:bg-slate-800 dark:border-slate-600 hover:bg-primary/5 dark:hover:bg-primary/10 hover:border-primary dark:hover:border-primary transition-all duration-200 shadow-sm group"
              >
                <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-primary flex-shrink-0">
                  {user.name ? (
                    <span className="font-bold text-sm">{user.name.charAt(0).toUpperCase()}</span>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-primary max-w-[120px] truncate">
                  {user.name || user.phone}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"
                  className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-primary transition-transform duration-200 flex-shrink-0 ${profileOpen ? 'rotate-180' : ''}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-primary/20 dark:border-slate-700 overflow-hidden z-50 p-1.5">
                  <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-700 mb-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                      {user.name || (lang === 'uz' ? 'Profil' : 'Профиль')}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{user.phone}</p>
                  </div>
                  <button
                    onClick={() => { setOrdersOpen(true); setProfileOpen(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-primary/5 dark:hover:bg-primary/10 hover:text-primary rounded-xl transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-primary">
                      <path d="M5.625 3.75a2.625 2.625 0 1 0 0 5.25h12.75a2.625 2.625 0 0 0 0-5.25H5.625ZM3.75 11.25a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5H3.75ZM3 15.75a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75ZM3.75 18.75a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H3.75Z" />
                    </svg>
                    {lang === 'uz' ? 'Buyurtmalarim' : 'Мои заказы'}
                  </button>
                  <button
                    onClick={() => { setLogoutConfirm(true); setProfileOpen(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                    </svg>
                    {lang === 'uz' ? 'Chiqish' : 'Выйти'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onAuthClick}
              className="hidden sm:flex items-center gap-2 bg-primary hover:bg-accent text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
              {lang === "uz" ? "Kirish" : "Войти"}
            </button>
          )}

          {/* Mobile hamburger */}
          <button className="lg:hidden p-2 rounded-lg hover:bg-primary/5 transition-colors" onClick={() => setMenuOpen(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-primary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className={`lg:hidden fixed inset-0 z-[60] transition-all duration-300 ${menuOpen ? "visible" : "invisible"}`}
        style={{ height: '100dvh' }}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${menuOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setMenuOpen(false)}
        />

        {/* Drawer */}
        <div
          className={`absolute top-0 right-0 w-full sm:w-80 bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden transition-transform duration-300 ${menuOpen ? "translate-x-0" : "translate-x-full"}`}
          style={{ height: '100dvh' }}
        >
          <div className="flex justify-between items-center px-5 pt-3 pb-3 border-b border-primary/20 dark:border-primary/10">
            {/* Logo card — same as navbar */}
            <div
              className="relative flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{
                width: 44, height: 44,
                background: 'linear-gradient(140deg, rgba(0,196,140,0.18) 0%, rgba(0,20,12,0.96) 100%)',
                boxShadow: '0 0 0 1.5px rgba(0,196,140,0.30), 0 0 16px 3px rgba(0,196,140,0.16), 0 4px 12px rgba(0,0,0,0.30)',
                borderRadius: 12,
              }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, transparent 45%)', borderRadius: 12 }} />
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(108deg, transparent 15%, rgba(255,255,255,0.30) 48%, rgba(200,255,240,0.15) 52%, transparent 85%)', animation: 'splashShimmer 2.8s 0.4s ease-in-out infinite', borderRadius: 12, zIndex: 3 }} />
              <img src={logo} alt="Diametr" className="object-contain" style={{ width: 26, height: 26, filter: 'brightness(0) invert(1) drop-shadow(0 0 6px rgba(0,196,140,0.8))', position: 'relative', zIndex: 4 }} />
            </div>
            <button onClick={() => setMenuOpen(false)} className="p-2 rounded-xl hover:bg-primary/5 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-primary">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Nav links — scrollable middle */}
          <div className="overflow-y-auto px-4 pt-2 pb-1 bg-white dark:bg-slate-900">
            <div className="grid grid-cols-2 gap-1">
            {NAV_LINKS.map(link => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="text-left px-3 py-2 text-slate-700 dark:text-slate-200 font-medium hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10 rounded-xl text-sm transition-all"
              >
                {lang === "uz" ? link.title : link.titleRu}
              </button>
            ))}
            </div>
          </div>

          {/* Bottom panel — always pinned at bottom */}
          <div className="flex-shrink-0 px-4 pb-4 pt-3 border-t border-primary/10 dark:border-primary/10 flex flex-col gap-2 bg-white dark:bg-slate-900">
            {/* Language selector */}
            <div className="flex gap-2">
              {LANGS.map(l => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code as "uz" | "ru")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-xl border transition-all ${
                    lang === l.code
                      ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-primary hover:text-primary"
                  }`}
                >
                  <l.Flag size={22} />
                  <span>{l.short}</span>
                </button>
              ))}
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-200 hover:border-primary hover:text-primary transition-all text-sm font-semibold"
            >
              {theme === 'dark' ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                  </svg>
                  {lang === 'uz' ? "Yorug' rejim" : 'Светлая тема'}
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                  </svg>
                  {lang === 'uz' ? "Qorong' rejim" : 'Тёмная тема'}
                </>
              )}
            </button>

            {/* User / Login */}
            {user ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/20">
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary flex-shrink-0">
                  {user.name ? (
                    <span className="font-bold text-sm">{user.name.charAt(0).toUpperCase()}</span>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{user.name || (lang === 'uz' ? 'Profil' : 'Профиль')}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user.phone}</p>
                </div>
                <button
                  onClick={() => { setOrdersOpen(true); setMenuOpen(false) }}
                  className="text-xs text-primary font-semibold px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors flex-shrink-0"
                >
                  {lang === 'uz' ? 'Buyurtmalar' : 'Заказы'}
                </button>
                <button
                  onClick={() => { setLogoutConfirm(true); setMenuOpen(false) }}
                  className="text-xs text-red-400 hover:text-red-600 font-semibold px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex-shrink-0"
                >
                  {lang === 'uz' ? 'Chiqish' : 'Выйти'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => { onAuthClick?.(); setMenuOpen(false) }}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-2.5 rounded-xl hover:bg-accent transition-all text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                </svg>
                {lang === 'uz' ? 'Kirish' : 'Войти'}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>

    <OrdersDrawer open={ordersOpen} onClose={() => setOrdersOpen(false)} />

    {/* Logout confirmation modal */}
    {logoutConfirm && (
      <div className="fixed inset-0 z-[400] flex items-center justify-center px-4" onClick={() => setLogoutConfirm(false)}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div
          className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-xs flex flex-col gap-4"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-red-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white text-base">
              {lang === 'uz' ? 'Chiqishni tasdiqlang' : 'Подтвердите выход'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {lang === 'uz' ? 'Rostdan ham chiqmoqchimisiz?' : 'Вы действительно хотите выйти?'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setLogoutConfirm(false)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              {lang === 'uz' ? 'Bekor' : 'Отмена'}
            </button>
            <button
              onClick={() => { onLogout?.(); setLogoutConfirm(false) }}
              className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors"
            >
              {lang === 'uz' ? 'Ha, chiqish' : 'Да, выйти'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

