import Button from "../ui/button/Button";
import Select from "../form/Select";
import { DownloadIcon } from "../../icons";

interface TableToolbarProps {
  /** Search value controlled externally */
  search: string;
  onSearch: (v: string) => void;
  searchPlaceholder?: string;

  /** Show-count dropdown */
  showValue: string;
  onShowChange: (v: string) => void;

  /** Excel export */
  onExport?: () => void;

  /** Optional right-side action (e.g. "Yaratish" button) */
  action?: React.ReactNode;
}

const SHOW_OPTIONS = [
  { value: "10", label: "10" },
  { value: "20", label: "20" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
];

export default function TableToolbar({
  search,
  onSearch,
  searchPlaceholder = "Qidirish...",
  showValue,
  onShowChange,
  onExport,
  action,
}: TableToolbarProps) {
  return (
    <div className="px-4 py-3 flex flex-wrap gap-3 items-center justify-between border-b border-gray-100 dark:border-white/[0.05] bg-white dark:bg-transparent">
      {/* Left: search */}
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" clipRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
            />
          </svg>
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-9 pr-9 py-2 text-sm rounded-lg
                     border border-gray-200 dark:border-white/[0.08]
                     bg-gray-50 dark:bg-white/[0.05]
                     text-gray-700 dark:text-gray-200
                     placeholder:text-gray-400 dark:placeholder:text-gray-500
                     focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400
                     transition-colors"
        />
        {search && (
          <button
            onClick={() => onSearch("")}
            className="absolute inset-y-0 right-2.5 flex items-center text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 transition-colors"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
            </svg>
          </button>
        )}
      </div>

      {/* Right: show-count + export + action */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">Ko'rsatish</span>
          <Select
            options={SHOW_OPTIONS}
            defaultValue={showValue}
            onChange={onShowChange}
            className="w-20 text-sm"
          />
        </div>

        {onExport && (
          <Button
            size="sm"
            variant="outline"
            startIcon={<DownloadIcon className="size-4" />}
            onClick={onExport}
          >
            Excel
          </Button>
        )}

        {action}
      </div>
    </div>
  );
}
