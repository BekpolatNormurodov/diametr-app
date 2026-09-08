import {
  createPortal,
} from "react-dom";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const COLORS: Record<ToastType, { bar: string; bg: string; icon: string; ring: string }> = {
  success: {
    bar:  "bg-emerald-500",
    bg:   "bg-white dark:bg-gray-800",
    icon: "text-emerald-500",
    ring: "ring-emerald-100 dark:ring-emerald-500/20",
  },
  error: {
    bar:  "bg-red-500",
    bg:   "bg-white dark:bg-gray-800",
    icon: "text-red-500",
    ring: "ring-red-100 dark:ring-red-500/20",
  },
  warning: {
    bar:  "bg-amber-500",
    bg:   "bg-white dark:bg-gray-800",
    icon: "text-amber-500",
    ring: "ring-amber-100 dark:ring-amber-500/20",
  },
  info: {
    bar:  "bg-blue-500",
    bg:   "bg-white dark:bg-gray-800",
    icon: "text-blue-500",
    ring: "ring-blue-100 dark:ring-blue-500/20",
  },
};

const ICONS: Record<ToastType, React.ReactNode> = {
  success: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" clipRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
      />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" clipRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
      />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" clipRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
      />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" clipRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
      />
    </svg>
  ),
};

const LABEL: Record<ToastType, string> = {
  success: "Muvaffaqiyat",
  error:   "Xatolik",
  warning: "Ogohlantirish",
  info:    "Ma'lumot",
};

// ─── Single Toast Item ─────────────────────────────────────────────────────────
function ToastCard({
  item,
  onRemove,
}: {
  item: ToastItem;
  onRemove: (id: number) => void;
}) {
  const c = COLORS[item.type];
  const [progress, setProgress] = useState(100);
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const pausedRef = useRef(false);
  const startRef  = useRef(Date.now());
  const elapsedRef = useRef(0);

  // Slide-in on mount
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Progress bar countdown
  useEffect(() => {
    let raf: number;
    const tick = () => {
      if (!pausedRef.current) {
        elapsedRef.current += Date.now() - startRef.current;
        startRef.current = Date.now();
        const pct = Math.max(0, 100 - (elapsedRef.current / item.duration) * 100);
        setProgress(pct);
        if (pct <= 0) { dismiss(); return; }
      } else {
        startRef.current = Date.now();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const dismiss = useCallback(() => {
    setLeaving(true);
    setTimeout(() => onRemove(item.id), 280);
  }, [item.id, onRemove]);

  return (
    <div
      className={`
        relative flex items-start gap-3 w-[340px] max-w-[calc(100vw-32px)]
        rounded-xl ring-1 shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]
        overflow-hidden px-4 py-3.5 cursor-default select-none
        ${c.bg} ${c.ring}
        transition-all duration-280 ease-out
        ${visible && !leaving ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}
      `}
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; startRef.current = Date.now(); }}
    >
      {/* Left accent bar */}
      <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${c.bar}`} />

      {/* Icon */}
      <span className={`mt-0.5 flex-shrink-0 ${c.icon}`}>{ICONS[item.type]}</span>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 dark:text-white leading-none mb-1">
          {LABEL[item.type]}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-snug break-words">
          {item.message}
        </p>
      </div>

      {/* Close */}
      <button
        onClick={dismiss}
        className="flex-shrink-0 mt-0.5 w-5 h-5 flex items-center justify-center rounded-md
                   text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400
                   transition-colors"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
        </svg>
      </button>

      {/* Progress bar */}
      <span
        className={`absolute bottom-0 left-0 h-0.5 ${c.bar} transition-none rounded-b-xl`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface ToastCtxType {
  show: (type: ToastType, message: string, duration?: number) => void;
}

const ToastCtx = createContext<ToastCtxType | null>(null);

// Module-level singleton reference — usable outside React
let _singleton: ToastCtxType | null = null;

// ─── Provider ─────────────────────────────────────────────────────────────────
let _idCounter = 0;

export function DiametrToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const show = useCallback((type: ToastType, message: string, duration = 3500) => {
    const id = ++_idCounter;
    setItems((prev) => [...prev.slice(-4), { id, type, message, duration }]);
  }, []);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Register singleton
  useEffect(() => {
    _singleton = { show };
    return () => { _singleton = null; };
  }, [show]);

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      {createPortal(
        <div className="fixed top-4 right-4 z-[999999] flex flex-col gap-2.5 pointer-events-none">
          {items.map((item) => (
            <div key={item.id} className="pointer-events-auto">
              <ToastCard item={item} onRemove={remove} />
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastCtx.Provider>
  );
}

// ─── Imperative API (outside hooks) ───────────────────────────────────────────
export const toast = {
  success: (message: string) => _singleton?.show("success", message),
  error:   (message: string) => _singleton?.show("error",   message),
  warning: (message: string) => _singleton?.show("warning", message),
  info:    (message: string) => _singleton?.show("info",    message),
};

// ─── Hook (inside components) ─────────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be inside DiametrToastProvider");
  return ctx;
}
