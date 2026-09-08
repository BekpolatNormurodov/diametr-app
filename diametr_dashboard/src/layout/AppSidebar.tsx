import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";

import {
  BoxCubeIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  PieChartIcon,
  UserCircleIcon,
  ShootingStarIcon,
  CardIcon,
  ShopIcon,
  CategoryIcon,
  NewsIcon,
  ServiceIcon,
  WorkerIcon,
  AdIcon,
  LocationsIcon,
  SaleIcon,
  CopyIcon,
  GroupIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import SidebarWidget from "./SidebarWidget";

interface NavItem {
  name: string;
  icon: React.ReactNode;
  path: string;
}

interface SidebarGroup {
  label: string;
  key: string;
  items: NavItem[];
}

const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    label: "Asosiy",
    key: "main",
    items: [
      { icon: <GridIcon />,      name: "Dashboard",  path: "/" },
      { icon: <PieChartIcon />,  name: "Analitika",  path: "/analytics" },
    ],
  },
  {
    label: "Katalog",
    key: "catalog",
    items: [
      { icon: <CategoryIcon />, name: "Kategoriyalar",    path: "/categories" },
      { icon: <BoxCubeIcon />,  name: "Mahsulotlar",     path: "/products" },
    ],
  },
  {
    label: "Do'konlar",
    key: "shops",
    items: [
      { icon: <LocationsIcon />,  name: "Regionlar",         path: "/regions" },
      { icon: <ShopIcon />,       name: "Do'konlar",         path: "/shops" },
      { icon: <UserCircleIcon />, name: "Do'kon Adminlari",  path: "/admins" },
    ],
  },
  {
    label: "Xizmatlar",
    key: "services",
    items: [
      { icon: <ServiceIcon />, name: "Xizmatlar", path: "/services" },
      { icon: <WorkerIcon />,  name: "Ustalar",   path: "/workers" },
    ],
  },
  {
    label: "Sotish",
    key: "sales",
    items: [
      { icon: <SaleIcon />,  name: "Buyurtmalar",  path: "/sales" },
      { icon: <CardIcon />,  name: "To'lovlar",    path: "/payments" },
      { icon: <CopyIcon />,  name: "Promo Kodlar", path: "/promo-codes" },
    ],
  },
  {
    label: "Kontent",
    key: "content",
    items: [
      { icon: <NewsIcon />, name: "Yangiliklar", path: "/news" },
      { icon: <AdIcon />,   name: "Reklamalar",  path: "/ads" },
    ],
  },
  {
    label: "Boshqaruv",
    key: "management",
    items: [
      { icon: <GroupIcon />, name: "Foydalanuvchilar", path: "/users" },
      { icon: <CardIcon />,  name: "Obunalar",         path: "/subscriptions" },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  // All groups open by default
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(SIDEBAR_GROUPS.map((g) => g.key))
  );

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const showText = isExpanded || isHovered || isMobileOpen;

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
        ${isExpanded || isMobileOpen ? "w-[310px]" : isHovered ? "w-[310px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div className={`py-6 flex ${!showText ? "lg:justify-center" : "justify-start"}`}>
        <Link to="/">
          <div
            className="relative flex items-center justify-center overflow-hidden flex-shrink-0"
            style={{
              width: showText ? 52 : 46,
              height: showText ? 52 : 46,
              background: 'linear-gradient(140deg, rgba(0,196,140,0.18) 0%, rgba(0,20,12,0.96) 100%)',
              boxShadow: '0 0 0 1.5px rgba(0,196,140,0.30), 0 0 24px 4px rgba(0,196,140,0.16), 0 4px 16px rgba(0,0,0,0.35)',
              borderRadius: 14,
              transition: 'width 0.3s, height 0.3s',
            }}
          >
            {/* Corner shine */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, transparent 45%)', borderRadius: 14 }} />
            {/* Shimmer sweep */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(108deg, transparent 15%, rgba(255,255,255,0.30) 48%, rgba(200,255,240,0.15) 52%, transparent 85%)', animation: 'splashShimmer 2.8s 0.4s ease-in-out infinite', borderRadius: 14, zIndex: 3 }} />
            <img
              src="/images/logo.png"
              alt="Diametr"
              className="object-contain"
              style={{ width: showText ? 34 : 28, height: showText ? 34 : 28, filter: 'brightness(0) invert(1) drop-shadow(0 0 6px rgba(0,196,140,0.8))', position: 'relative', zIndex: 4, transition: 'width 0.3s, height 0.3s' }}
            />
          </div>
        </Link>
      </div>

      {/* Nav */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar flex-1">
        <nav className="mb-6">
          {/* Section header in collapsed mode */}
          {!showText && (
            <div className="flex justify-center mb-4">
              <HorizontaLDots className="size-8 text-gray-400" />
            </div>
          )}

          <div className="flex flex-col gap-1">
            {SIDEBAR_GROUPS.map((group) => {
              const isOpen = openGroups.has(group.key);
              return (
                <div key={group.key}>
                  {/* Group header вЂ” only in expanded mode */}
                  {showText && (
                    <button
                      onClick={() => toggleGroup(group.key)}
                      className="w-full flex items-center justify-between px-4 py-[11px] mt-2 mb-0.5
                                 text-[17px] font-semibold tracking-wider uppercase
                                 text-gray-400 dark:text-gray-500
                                 hover:text-gray-600 dark:hover:text-gray-400
                                 transition-colors group"
                    >
                      <span>{group.label}</span>
                      <ChevronDownIcon
                        className={`w-5 h-5 transition-transform duration-200 ${isOpen ? "" : "-rotate-90"}`}
                      />
                    </button>
                  )}

                  {/* Items */}
                  <div
                    className="overflow-hidden transition-all duration-250 ease-in-out"
                    style={{
                      maxHeight: !showText ? "999px" : isOpen ? "999px" : "0px",
                    }}
                  >
                    <ul className="flex flex-col gap-0.5">
                      {group.items.map((item) => {
                        const active = isActive(item.path);
                        return (
                          <li key={item.path}>
                            <Link
                              to={item.path}
                              className={`flex items-center gap-3 px-3 py-[9px] rounded-xl text-[14px] font-medium transition-all duration-150
                                ${!showText ? "lg:justify-center" : ""}
                                ${active
                                  ? "bg-brand-500/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-gray-200"
                                }`}
                            >
                              <span
                                className={`flex-shrink-0 w-[22px] h-[22px] flex items-center justify-center [&>svg]:w-full [&>svg]:h-full
                                  ${active ? "text-brand-500 dark:text-brand-400" : "text-gray-500 dark:text-gray-400"}`}
                              >
                                {item.icon}
                              </span>
                              {showText && <span>{item.name}</span>}
                              {active && showText && (
                                <span className="ml-auto w-2 h-2 rounded-full bg-brand-500" />
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </nav>

        {showText && <SidebarWidget />}
      </div>
    </aside>
  );
};

export default AppSidebar;

