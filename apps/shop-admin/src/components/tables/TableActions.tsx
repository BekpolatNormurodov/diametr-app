import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { EditIcon, DeleteIcon } from "../../icons";

interface TableActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  editLabel?: string;
  deleteLabel?: string;
  confirmTitle?: string;
  confirmDesc?: string;
  extraActions?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    color?: "blue" | "green" | "red" | "orange";
  }[];
}

/* ── Reusable confirm portal ─────────────────────────────── */
export function ConfirmDeleteModal({
  title,
  desc,
  onConfirm,
  onCancel,
}: {
  title: string;
  desc: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onCancel]);

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      style={{ animation: "dmfadein 0.18s ease both" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-gray-800 shadow-2xl
                   border border-gray-100 dark:border-white/[0.08]
                   p-6 text-center"
        style={{ animation: "dmslideup 0.2s ease both" }}
      >
        {/* Icon */}
        <div className="mx-auto mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20">
            <svg
              width="22" height="22" viewBox="0 0 24 24" fill="none"
              className="text-red-500"
            >
              <path
                d="M9 3h6l1 1h4v2H4V4h4L9 3ZM5 8h14l-1 13H6L5 8Zm5 3v7m4-7v7"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Text */}
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1.5">
          {title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {desc}
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                       text-sm font-medium text-gray-700 dark:text-gray-300
                       bg-white dark:bg-gray-700/50
                       hover:bg-gray-50 dark:hover:bg-gray-700
                       transition-colors"
          >
            Bekor qilish
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl
                       text-sm font-semibold text-white
                       bg-red-500 hover:bg-red-600 active:bg-red-700
                       shadow-sm shadow-red-500/30
                       transition-colors"
          >
            O'chirish
          </button>
        </div>
      </div>

      <style>{`
        @keyframes dmslideup {
          from { opacity:0; transform:translateY(12px) scale(0.97); }
          to   { opacity:1; transform:translateY(0)   scale(1);    }
        }
        @keyframes dmfadein {
          from { opacity:0; }
          to   { opacity:1; }
        }
      `}</style>
    </div>,
    document.body
  );
}

/* ── Main component ──────────────────────────────────────── */
export default function TableActions({
  onEdit,
  onDelete,
  editLabel = "Tahrirlash",
  deleteLabel = "O'chirish",
  confirmTitle = "O'chirishni tasdiqlaysizmi?",
  confirmDesc = "Bu amalni qaytarib bo'lmaydi.",
  extraActions = [],
}: TableActionsProps) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const colorMap = {
    blue:   { row: "hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-700 dark:hover:text-blue-400",   badge: "bg-blue-100 dark:bg-blue-500/15",   icon: "text-blue-500 dark:text-blue-400"   },
    green:  { row: "hover:bg-green-50 dark:hover:bg-green-500/10 hover:text-green-700 dark:hover:text-green-400", badge: "bg-green-100 dark:bg-green-500/15", icon: "text-green-500 dark:text-green-400" },
    orange: { row: "hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-700 dark:hover:text-orange-400", badge: "bg-orange-100 dark:bg-orange-500/15", icon: "text-orange-500 dark:text-orange-400" },
    red:    { row: "hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-400",       badge: "bg-red-100 dark:bg-red-500/15",     icon: "text-red-500 dark:text-red-400"     },
  };

  return (
    <>
      <div className="relative inline-block" ref={ref}>
        {/* Trigger */}
        <button
          onClick={() => setOpen((o) => !o)}
          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150
            ${open
              ? "bg-gray-100 text-gray-600 dark:bg-white/[0.12] dark:text-white"
              : "text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-400 dark:hover:bg-white/[0.08] dark:hover:text-gray-200"
            }`}
          aria-label="Amallar"
        >
          <svg width="4" height="16" viewBox="0 0 4 16" fill="currentColor">
            <circle cx="2" cy="2"  r="1.8" />
            <circle cx="2" cy="8"  r="1.8" />
            <circle cx="2" cy="14" r="1.8" />
          </svg>
        </button>

        {/* Dropdown */}
        {open && (
          <div
            className="absolute right-0 z-50 mt-1.5 min-w-[180px] rounded-2xl overflow-hidden p-1.5
                       border border-gray-200 dark:border-white/[0.08]
                       bg-white dark:bg-gray-800
                       shadow-[0_20px_60px_-10px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.55)]"
            style={{ animation: "dmfadein 0.15s ease both" }}
          >
            {/* Edit row */}
            <button
              onClick={() => { onEdit(); setOpen(false); }}
              className="group flex items-center gap-2.5 w-full px-3 py-2 text-sm
                         font-semibold text-blue-700 dark:text-blue-400
                         rounded-xl
                         hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-600 hover:text-white
                         hover:shadow-md hover:shadow-blue-500/25
                         transition-all"
            >
              <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <EditIcon className="size-4 text-blue-500 dark:text-blue-400 group-hover:text-white transition-colors" />
              </span>
              {editLabel}
            </button>

            {/* Extra actions */}
            {extraActions.map((a, i) => {
              const c = colorMap[a.color ?? "blue"];
              return (
                <button key={i}
                  onClick={() => { a.onClick(); setOpen(false); }}
                  className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-300 transition-colors ${c.row}`}
                >
                  {a.icon && (
                    <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${c.badge}`}>
                      <span className={`size-4 ${c.icon}`}>{a.icon}</span>
                    </span>
                  )}
                  {a.label}
                </button>
              );
            })}

            {/* Divider */}
            <div className="my-1 mx-2 h-px bg-gray-100 dark:bg-white/[0.06]" />

            {/* Delete row — opens confirm modal */}
            <button
              onClick={() => { setOpen(false); setConfirming(true); }}
              className="group flex items-center gap-2.5 w-full px-3 py-2 text-sm
                         font-semibold text-red-600 dark:text-red-400
                         rounded-xl
                         hover:bg-gradient-to-r hover:from-red-500 hover:to-rose-600 hover:text-white
                         hover:shadow-md hover:shadow-red-500/25
                         transition-all"
            >
              <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-red-100 dark:bg-red-500/15 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <DeleteIcon className="size-4 text-red-500 dark:text-red-400 group-hover:text-white transition-colors" />
              </span>
              {deleteLabel}
            </button>
          </div>
        )}
      </div>

      {/* Confirm delete modal */}
      {confirming && (
        <ConfirmDeleteModal
          title={confirmTitle}
          desc={confirmDesc}
          onConfirm={() => { setConfirming(false); onDelete(); }}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}
