import React, { useState, useCallback, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from "./sections/navbar"
import Main from "./sections/main"
import CategoryGrid from "./sections/categoryGrid"
import BannerSlider from "./sections/bannerSlider"
import Customer from "./sections/customer"
import Questions from "./sections/question"
import Writing from './sections/writing'
import Footer from './sections/footer'
import Shops from './sections/shops'
import GeoPermissionModal, { useGeoPermission } from '../common/GeoPermissionModal'
import AuthModal from '../auth/AuthModal'
import CartDrawer from '../cart/CartDrawer'
import { authService, AuthUser } from '../../service/authService'
import { useLang } from '../../context/AppContext'

export default function Home() {
  const { lang } = useLang()
  const location = useLocation()
  const [user, setUser] = useState<AuthUser | null>(() => authService.getUser())
  const [authOpen, setAuthOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const geo = useGeoPermission()

  useEffect(() => {
    const state = location.state as { scrollTo?: string } | null
    if (state?.scrollTo) {
      const id = state.scrollTo
      window.history.replaceState({}, '')
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      }, 150)
    }
  }, [location.state])

  const handleAuth = useCallback(() => {
    setUser(authService.getUser())
  }, [])

  const handleLogout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  useEffect(() => {
    const onUnauthorized = () => setUser(null)
    window.addEventListener('diametr:unauthorized', onUnauthorized)
    return () => window.removeEventListener('diametr:unauthorized', onUnauthorized)
  }, [])

  return (
    <div className="Home w-screen relative flex flex-col overflow-x-hidden bg-white dark:bg-slate-900 transition-colors duration-300">
      <Navbar
        user={user}
        onAuthClick={() => setAuthOpen(true)}
        onLogout={handleLogout}
        onCartClick={() => setCartOpen(true)}
      />
      <div className="h-[76px] flex-shrink-0" />
      <BannerSlider />
      <Main />
      <CategoryGrid />
      <Customer />
      <Shops />
      <Questions />
      <Writing />
      <Footer />

      {geo.show && (
        <GeoPermissionModal
          lang={lang}
          onClose={geo.close}
          onAllow={geo.allow}
        />
      )}

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuth={handleAuth}
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
