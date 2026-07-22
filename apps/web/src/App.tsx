
import './App.css';
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Home from './components/home/Home';
import NotFound from './components/404/notFound';
import CategoryPage from './pages/CategoryPage';
import CategoriesPage from './pages/CategoriesPage';
import ShopsPage from './pages/ShopsPage';
import ShopDetailPage from './pages/ShopDetailPage';
import StorePage from './pages/StorePage';
import { AppProvider } from './context/AppContext';
import { CartProvider } from './context/CartContext';
import { ToastContainer, Zoom } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SplashScreen from './components/common/SplashScreen';

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior }) }, [pathname])
  return null
}

function SplashWrapper({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  // Splash only on the home page ("/")
  const shouldSplash = pathname === '/'
  const [done, setDone] = useState(!shouldSplash)
  const handleDone = useCallback(() => {
    setDone(true)
  }, [])
  return (
    <>
      {shouldSplash && !done && <SplashScreen onDone={handleDone} />}
      {children}
    </>
  )
}

// Page transitions (opacity only — using `x`/translate would create a CSS
// `transform` on the wrapper, which makes any descendant `position: fixed`
// element (modals, drawers, toasts) get positioned relative to the wrapper
// instead of the viewport. Keep this fade-only to avoid that pitfall.)
const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
}
const pageTransition = { duration: 0.25, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }

function PageWrap({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageTransition}
      style={{ minHeight: '100vh' }}
    >
      {children}
    </motion.div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/">
          <Route index element={<PageWrap><Home /></PageWrap>} />
          <Route path="store" element={<PageWrap><StorePage /></PageWrap>} />
          <Route path="category/:id" element={<PageWrap><CategoryPage /></PageWrap>} />
          <Route path="categories" element={<PageWrap><CategoriesPage /></PageWrap>} />
          <Route path="shops" element={<PageWrap><ShopsPage /></PageWrap>} />
          <Route path="shop/:id" element={<PageWrap><ShopDetailPage /></PageWrap>} />
          <Route path="*" element={<PageWrap><NotFound /></PageWrap>} />
        </Route>
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  return (
    <AppProvider>
      <CartProvider>
        <BrowserRouter>
          <ScrollToTop />
          <SplashWrapper>
            <AnimatedRoutes />
          </SplashWrapper>
        </BrowserRouter>
      </CartProvider>
      <ToastContainer
        position="bottom-right"
        autoClose={2000}
        hideProgressBar
        newestOnTop
        closeOnClick
        pauseOnHover={false}
        pauseOnFocusLoss={false}
        draggable
        closeButton
        limit={4}
        transition={Zoom}
      />
    </AppProvider>
  );
}

export default App;
