import { Link } from "react-router";
import { useSidebar } from "../context/SidebarContext";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
import Moment from "moment";

function getSubBadge(expired?: string | null) {
  if (!expired) return null;
  const days = Math.ceil((new Date(expired).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0)  return { text: "Obuna tugagan", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
  if (days <= 7) return { text: `Obuna: ${days} kun`, cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" };
  return { text: `Obuna: ${Moment(expired).format("DD.MM.YY")}`, cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" };
}

const AppHeader: React.FC = () => {
  const { isMobileOpen, isExpanded, toggleSidebar, toggleMobileSidebar } = useSidebar();

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const user = JSON.parse(localStorage.getItem("user") ?? "null");
  const shopName = user?.shop?.name ?? user?.shopName ?? "Do'kon Admin";
  const subBadge = getSubBadge(user?.shop?.expired);

  return (
    <header className="sticky top-0 flex w-full bg-white border-gray-200 z-99999 dark:border-gray-800 dark:bg-gray-900 lg:border-b">
      <div className="flex items-center justify-between w-full px-4 py-3 lg:px-6 lg:py-4">
        {/* Left: hamburger + logo on mobile */}
        <div className="flex items-center gap-3">
          <button
            className="flex items-center justify-center w-10 h-10 text-gray-500 border border-gray-200 rounded-lg dark:border-gray-800 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
          >
            {isMobileOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z" fill="currentColor"/></svg>
            ) : (
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 1ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z" fill="currentColor"/></svg>
            )}
          </button>

          <Link to="/" className="lg:hidden">
            <img src="/images/logo.svg" alt="Diametr" width={120} className="dark:hidden" />
            <img src="/images/logo.svg" alt="Diametr" width={120} className="hidden dark:block" />
          </Link>
        </div>

        {/* Right: subscription badge, shop name, theme toggle, user */}
        <div className="flex items-center gap-3">
          {subBadge && (
            <Link to="/profile" className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-opacity hover:opacity-80 ${subBadge.cls}`}>
              {subBadge.text}
            </Link>
          )}
          <span className="hidden sm:block text-sm font-medium text-gray-600 dark:text-gray-300">
            🏪 {shopName}
          </span>
          <ThemeToggleButton />
          <ShopUserDropdown user={user} />
        </div>
      </div>
    </header>
  );
};

function ShopUserDropdown({ user }: { user: any }) {
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("shop_id");
    window.location.href = "/signin";
  };

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 text-sm font-semibold">
          {user?.fullname?.[0]?.toUpperCase() ?? "A"}
        </div>
        <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
          {user?.fullname ?? "Admin"}
        </span>
        <svg className="w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/>
        </svg>
      </button>

      {/* Dropdown */}
      <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-800 dark:text-white">{user?.fullname ?? "Admin"}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{user?.phone ?? ""}</p>
        </div>
        <div className="p-2">
          <a href="/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
            Profil
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"/></svg>
            Chiqish
          </button>
        </div>
      </div>
    </div>
  );
}

export default AppHeader;
