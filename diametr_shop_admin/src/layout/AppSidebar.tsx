import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  GridIcon,
  BoxCubeIcon,
  SaleIcon,
  CardIcon,
  CopyIcon,
  UserCircleIcon,
  CalenderIcon,
  ChevronDownIcon,
  HorizontaLDots,
  ShopIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";

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
      { icon: <GridIcon />, name: "Dashboard", path: "/" },
    ],
  },
  {
    label: "Do'kon",
    key: "shop",
    items: [
      { icon: <ShopIcon />,  name: "Tovarlar",  path: "/shop-products" },
    ],
  },
  {
    label: "Savdo",
    key: "sales",
    items: [
      { icon: <SaleIcon />,  name: "Buyurtmalar", path: "/orders" },
      { icon: <CardIcon />,  name: "To'lovlar",   path: "/payments" },
      { icon: <CopyIcon />,  name: "Promo Kodlar", path: "/promo-codes" },
    ],
  },
  {
    label: "Profil",
    key: "profile",
    items: [
      { icon: <CalenderIcon />, name: "Obuna holati", path: "/subscription" },
      { icon: <UserCircleIcon />, name: "Sozlamalar", path: "/profile" },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

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
        ${isExpanded || isMobileOpen ? "w-[280px]" : isHovered ? "w-[280px]" : "w-[80px]"}
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
              background: "linear-gradient(140deg, rgba(0,196,140,0.18) 0%, rgba(0,20,12,0.96) 100%)",
              boxShadow: "0 0 0 1.5px rgba(0,196,140,0.30), 0 0 24px 4px rgba(0,196,140,0.16), 0 4px 16px rgba(0,0,0,0.35)",
              borderRadius: 14,
              transition: "width 0.3s, height 0.3s",
            }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, transparent 45%)", borderRadius: 14 }} />
            <img
              src="/images/logo.png"
              alt="Diametr"
              className="object-contain"
              style={{ width: showText ? 34 : 28, height: showText ? 34 : 28, filter: "brightness(0) invert(1) drop-shadow(0 0 6px rgba(0,196,140,0.8))", position: "relative", zIndex: 4, transition: "width 0.3s, height 0.3s" }}
            />
          </div>
          {showText && (
            <div className="ml-3 hidden lg:flex flex-col" style={{ display: "none" }} />
          )}
        </Link>
        {showText && (
          <div className="ml-3 flex flex-col justify-center">
            <span className="text-sm font-semibold text-gray-800 dark:text-white leading-tight">Diametr</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">Do'kon Admin</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar flex-1">
        <nav className="mb-6">
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
                  {showText && (
                    <button
                      onClick={() => toggleGroup(group.key)}
                      className="w-full flex items-center justify-between px-4 py-[11px] mt-2 mb-0.5 text-[11px] font-semibold tracking-wider uppercase text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                    >
                      <span>{group.label}</span>
                      <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "" : "-rotate-90"}`} />
                    </button>
                  )}
                  <div
                    className="overflow-hidden transition-all duration-250 ease-in-out"
                    style={{ maxHeight: !showText ? "999px" : isOpen ? "999px" : "0px" }}
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
                              <span className={`flex-shrink-0 w-[22px] h-[22px] flex items-center justify-center [&>svg]:w-full [&>svg]:h-full ${active ? "text-brand-500 dark:text-brand-400" : "text-gray-500 dark:text-gray-400"}`}>
                                {item.icon}
                              </span>
                              {showText && <span>{item.name}</span>}
                              {active && showText && <span className="ml-auto w-2 h-2 rounded-full bg-brand-500" />}
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
      </div>
    </aside>
  );
};

export default AppSidebar;
