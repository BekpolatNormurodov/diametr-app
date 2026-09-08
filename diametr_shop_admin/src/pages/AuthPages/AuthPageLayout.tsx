import React from "react";
import GridShape from "../../components/common/GridShape";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900 sm:p-0">
        {children}
        <div className="items-center hidden w-full h-full lg:w-1/2 bg-brand-950 dark:bg-white/5 lg:grid">
          <div className="relative flex items-center justify-center z-1">
            <GridShape />
            <div className="flex flex-col items-center max-w-xs">
              <img width={100} height={100} src="/images/logo.png" alt="Logo" className="mb-6 object-contain" style={{ filter: "brightness(0) invert(1) drop-shadow(0 0 12px rgba(0,196,140,0.8))" }} />
              <div className="mb-3 px-4 py-1.5 rounded-full bg-white/10 border border-white/20">
                <span className="text-xs font-semibold text-white/80 uppercase tracking-widest">Do'kon Admin Panel</span>
              </div>
              <h2 className="mb-2 text-xl font-bold text-white text-center">
                Diametr Do'kon Tizimi
              </h2>
              <p className="text-sm text-white/60 text-center">
                Buyurtmalar, tovarlar va to'lovlarni boshqaring
              </p>
            </div>
          </div>
        </div>
        <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
