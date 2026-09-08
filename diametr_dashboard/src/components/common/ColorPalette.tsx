import { useState } from "react";
import Label from "../form/Label";
import { COLOR_PALETTE } from "./colorPaletteData";

interface ColorPaletteProps {
  label?: string;
  value: string;
  onChange: (hex: string) => void;
  onClear?: () => void;
  defaultOpen?: boolean;
}

const COLOR_GROUPS: { label: string; colors: typeof COLOR_PALETTE }[] = (() => {
  const groups: Record<string, typeof COLOR_PALETTE> = {};
  const groupNames: Record<string, string> = {};
  let currentGroup = "";
  // Build groups from comments in the data order
  const allHexes = COLOR_PALETTE.map(c => c.hex);
  // Pre-defined groups based on the palette data
  const groupDefs = [
    { label: "Qizillar", from: 0, to: 5 },
    { label: "Pushtilar", from: 5, to: 8 },
    { label: "Zangorilar", from: 8, to: 11 },
    { label: "Sariqlar", from: 11, to: 16 },
    { label: "Yashillar", from: 16, to: 22 },
    { label: "Havoranglar", from: 22, to: 25 },
    { label: "Ko'klar", from: 25, to: 32 },
    { label: "Binafshalar", from: 32, to: 36 },
    { label: "Jigarranglar", from: 36, to: 40 },
    { label: "Kulranglar", from: 40, to: 44 },
    { label: "Asosiylar", from: 44, to: COLOR_PALETTE.length },
  ];
  return groupDefs.map(g => ({
    label: g.label,
    colors: COLOR_PALETTE.slice(g.from, g.to),
  }));
})();

export default function ColorPalette({ label = "Rang", value, onChange, onClear, defaultOpen = false }: ColorPaletteProps) {
  const [expanded, setExpanded] = useState(defaultOpen);
  const selected = COLOR_PALETTE.find((c) => c.hex.toLowerCase() === value?.toLowerCase());

  return (
    <div className="lg:col-span-2">
      <div className="flex items-center justify-between mb-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-2">
          {value && (
            <>
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                <span
                  className="w-5 h-5 rounded-md border-2 border-white dark:border-gray-700 shadow-sm ring-1 ring-gray-200 dark:ring-gray-600"
                  style={{ background: value }}
                />
                <span className="text-gray-700 dark:text-gray-200">{selected?.name ?? value}</span>
              </span>
              {onClear && (
                <button
                  type="button"
                  onClick={onClear}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Rangni tozalash"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                  </svg>
                </button>
              )}
            </>
          )}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              expanded
                ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400"
                : "text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20"
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="4" />
            </svg>
            {expanded ? "Yopish" : value ? "O'zgartirish" : "Tanlash"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 shadow-lg overflow-hidden"
          style={{ animation: "colorFadeIn 0.2s ease" }}
        >
          <div className="max-h-[280px] overflow-y-auto p-3 space-y-3">
            {COLOR_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5 px-0.5">
                  {group.label}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {group.colors.map((c) => {
                    const isSelected = value?.toLowerCase() === c.hex.toLowerCase();
                    const isLight = c.hex.toUpperCase() === "#FFFFFF" || c.hex === "#FDE047" || c.hex === "#FACC15" || c.hex === "#FCD34D" || c.hex === "#FFFDD0" || c.hex === "#D1D5DB" || c.hex === "#9CA3AF" || c.hex === "#C0C0C0" || c.hex === "#F5F5DC";
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => { onChange(c.hex); setExpanded(false); }}
                        title={c.name}
                        className={`group relative w-8 h-8 rounded-lg transition-all duration-150 ${
                          isSelected
                            ? "ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-gray-800 scale-110 z-10"
                            : "hover:scale-110 hover:z-10 hover:shadow-md"
                        }`}
                        style={{
                          background: c.hex,
                          border: isLight ? "1.5px solid #e5e7eb" : "1.5px solid transparent",
                        }}
                      >
                        {isSelected && (
                          <svg className="absolute inset-0 m-auto w-4 h-4 drop-shadow" viewBox="0 0 20 20" fill={isLight ? "#000" : "#fff"}>
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-30 shadow-lg">
                          {c.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <style>{`
            @keyframes colorFadeIn {
              from { opacity: 0; transform: translateY(-4px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
