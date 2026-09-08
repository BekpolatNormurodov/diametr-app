import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import { DiametrToastProvider } from "./components/ui/toast";
import ShopsPage from "./pages/diametr/Shops";
import UsersPage from "./pages/diametr/Users";
import AdminsPage from "./pages/diametr/Admins";
import RegionsPage from "./pages/diametr/Regions";
import PaymentsPage from "./pages/diametr/Payments";
import SalesPage from "./pages/diametr/Sales";
import CategorysPage from "./pages/diametr/Categories";
import ServicesPage from "./pages/diametr/Services";
import NewsPage from "./pages/diametr/News";
import AdsPage from "./pages/diametr/Ads";
import WorkersPage from "./pages/diametr/Workers";
import ProductsPage from "./pages/diametr/Products";
import PromoCodesPage from "./pages/diametr/PromoCodes";
import AnalyticsPage from "./pages/diametr/Analytics";
import UnitTypesPage from "./pages/diametr/UnitTypes";
import SubscriptionsPage from "./pages/diametr/Subscriptions";
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
            {/* Protected Dashboard Layout */}
            <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
              <Route path="/" element={<Home />} />
              <Route path="/shops" element={<ShopsPage />} />
              <Route path="/categories" element={<CategorysPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/ads" element={<AdsPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/workers" element={<WorkersPage />} />
              <Route path="/regions" element={<RegionsPage />} />
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/promo-codes" element={<PromoCodesPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/unit-types" element={<UnitTypesPage />} />
              <Route path="/subscriptions" element={<SubscriptionsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/admins" element={<AdminsPage />} />
              <Route path="/profile" element={<UserProfiles />} />
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
