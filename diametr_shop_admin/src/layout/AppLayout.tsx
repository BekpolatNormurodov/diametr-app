import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet, useNavigate } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import { PrivateRoute } from "./PrivateRoute";
import { useCallback, useEffect, useState } from "react";
import axiosClient from "../service/axios.service";

const SubscriptionBanner: React.FC = () => {
  const [expired, setExpired] = useState(false);
  const navigate = useNavigate();

  const check = useCallback(async () => {
    try {
      const res = await axiosClient.get("/subscription/balance");
      const exp = res.data?.expired;
      if (exp) {
        const days = Math.ceil((new Date(exp).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        setExpired(days < 0);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { check(); }, [check]);

  if (!expired) return null;

  return (
    <div
      onClick={() => navigate("/subscription")}
      className="mx-4 mt-4 md:mx-6 md:mt-6 mb-0 rounded-xl border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-5 py-3.5 flex items-center gap-3 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
    >
      <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-red-700 dark:text-red-400">
          Obuna muddati tugagan — mahsulotlaringiz platformada ko'rsatilmaydi
        </p>
      </div>
      <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
};

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen xl:flex">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[280px]" : "lg:ml-[80px]"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AppHeader />
        <SubscriptionBanner />
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <PrivateRoute>
      <SidebarProvider>
        <LayoutContent />
      </SidebarProvider>
    </PrivateRoute>
  );
};

export default AppLayout;
