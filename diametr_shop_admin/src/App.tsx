import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import { DiametrToastProvider } from "./components/ui/toast";
import OrdersPage from "./pages/shop/Orders";
import ShopProductsPage from "./pages/shop/ShopProducts";
import PaymentsPage from "./pages/shop/Payments";
import PromoCodesPage from "./pages/shop/PromoCodes";
import ProfilePage from "./pages/shop/Profile";
import SubscriptionPage from "./pages/shop/Subscription";
import { PrivateRoute } from "./layout/PrivateRoute";
import SplashScreen from "./components/common/SplashScreen";
import { useState, useCallback } from "react";
import { useLocation } from "react-router";

function SplashWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [done, setDone] = useState(false);
  const handleDone = useCallback(() => setDone(true), []);
  const isHome = location.pathname === "/";
  if (!isHome || done) return <>{children}</>;
  return <SplashScreen onDone={handleDone} />;
}

export default function App() {
  return (
    <DiametrToastProvider>
      <Router basename="/">
        <SplashWrapper>
          <ScrollToTop />
          <Routes>
            {/* Protected Shop Admin Layout */}
            <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
              <Route path="/" element={<Home />} />
              <Route path="/shop-products" element={<ShopProductsPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/promo-codes" element={<PromoCodesPage />} />
              <Route path="/subscription" element={<SubscriptionPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Auth */}
            <Route path="/signin" element={<SignIn />} />

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SplashWrapper>
      </Router>
    </DiametrToastProvider>
  );
}
