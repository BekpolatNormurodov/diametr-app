import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "../../icons";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  defaultValue?: string;
  value?: string;
}

const Select: React.FC<SelectProps> = ({
  options,
  placeholder,
  onChange,
  className = "",
  defaultValue = "",
  value,
}) => {
  const [selectedValue, setSelectedValue] = useState<string>(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const controlled = value !== undefined;
  const displayValue = controlled ? value : selectedValue;

  useEffect(() => { if (!controlled) setSelectedValue(defaultValue); }, [defaultValue, controlled]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const filtered = search.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const selectedLabel = options.find((o) => o.value === displayValue)?.label;

  const handleSelect = (val: string) => {
    if (!controlled) setSelectedValue(val);
    onChange(val);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`h-11 w-full flex items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-800 dark:focus:border-brand-600 ${
          displayValue
            ? "text-gray-800 dark:text-white/90"
            : "text-gray-400 dark:text-gray-500"
        }`}
      >
        <span className="truncate">
          {selectedLabel ?? placeholder ?? "Tanlang..."}
        </span>
        <ChevronDownIcon
          className={`w-5 h-5 text-gray-500 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <div className="relative">
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Qidirish..."
                className="w-full h-9 pl-8 pr-3 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">
                Topilmadi
              </div>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors ${
                    option.value === displayValue
                      ? "bg-brand-50 text-brand-700 font-medium dark:bg-brand-900/20 dark:text-brand-400"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50"
                  }`}
                >
                  {option.value === displayValue && (
                    <svg className="w-4 h-4 shrink-0 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  <span className={option.value === displayValue ? "" : "pl-6"}>
                    {option.label}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Select;
