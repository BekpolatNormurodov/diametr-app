import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { EditIcon, DeleteIcon } from "../../../icons";

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
    blue:   { row: "hover:bg-blue-50 dark:hover:bg-blue-500/15 hover:text-blue-700 dark:hover:text-blue-300",     badge: "bg-blue-100 dark:bg-blue-500/20 group-hover/item:bg-blue-500",   icon: "text-blue-600 dark:text-blue-300 group-hover/item:text-white"   },
    green:  { row: "hover:bg-green-50 dark:hover:bg-green-500/15 hover:text-green-700 dark:hover:text-green-300", badge: "bg-green-100 dark:bg-green-500/20 group-hover/item:bg-green-500", icon: "text-green-600 dark:text-green-300 group-hover/item:text-white" },
    orange: { row: "hover:bg-orange-50 dark:hover:bg-orange-500/15 hover:text-orange-700 dark:hover:text-orange-300", badge: "bg-orange-100 dark:bg-orange-500/20 group-hover/item:bg-orange-500", icon: "text-orange-600 dark:text-orange-300 group-hover/item:text-white" },
    red:    { row: "hover:bg-red-50 dark:hover:bg-red-500/15 hover:text-red-700 dark:hover:text-red-300",         badge: "bg-red-100 dark:bg-red-500/20 group-hover/item:bg-red-500",       icon: "text-red-600 dark:text-red-300 group-hover/item:text-white"     },
  };

  return (
    <>
      <div className="relative inline-block" ref={ref}>
        {/* Trigger */}
        <button
          onClick={() => setOpen((o) => !o)}
          className={`group inline-flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200
            ${open
              ? "bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/30 scale-105"
              : "bg-gray-50 text-gray-400 border border-gray-200 hover:bg-white hover:text-brand-600 hover:border-brand-300 hover:shadow-md hover:shadow-brand-500/10 dark:bg-white/[0.04] dark:text-gray-400 dark:border-white/[0.06] dark:hover:bg-white/[0.08] dark:hover:text-white dark:hover:border-white/[0.12]"
            }`}
          aria-label="Amallar"
        >
          <svg width="4" height="16" viewBox="0 0 4 16" fill="currentColor" className="transition-transform duration-200 group-hover:scale-125">
            <circle cx="2" cy="2"  r="1.6" />
            <circle cx="2" cy="8"  r="1.6" />
            <circle cx="2" cy="14" r="1.6" />
          </svg>
        </button>

        {/* Dropdown */}
        {open && (
          <div
            className="absolute right-0 z-50 mt-2 min-w-[200px] rounded-2xl overflow-hidden
                       border border-gray-200/80 dark:border-white/[0.08]
                       bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl
                       shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25),0_8px_20px_-8px_rgba(0,0,0,0.15)]
                       dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7),0_8px_20px_-8px_rgba(0,0,0,0.5)]"
            style={{ animation: "dmdropdown 0.18s cubic-bezier(0.22, 1, 0.36, 1) both", transformOrigin: "top right" }}
          >
            {/* Caret */}
            <div className="absolute -top-1.5 right-3 w-3 h-3 rotate-45 bg-white/95 dark:bg-gray-800/95 border-l border-t border-gray-200/80 dark:border-white/[0.08]" />

            <div className="relative p-1.5">
              {/* Edit row */}
              <button
                onClick={() => { onEdit(); setOpen(false); }}
                className="group/item flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm
                           font-semibold text-gray-700 dark:text-gray-200
                           hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-50/30
                           dark:hover:from-blue-500/15 dark:hover:to-blue-500/5
                           hover:text-blue-700 dark:hover:text-blue-300
                           transition-all duration-150"
              >
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center
                                 group-hover/item:bg-blue-500 dark:group-hover/item:bg-blue-500 group-hover/item:shadow-md group-hover/item:shadow-blue-500/30
                                 transition-all duration-150">
                  <EditIcon className="size-4 text-blue-600 dark:text-blue-300 group-hover/item:text-white dark:group-hover/item:text-white transition-colors" />
                </span>
                <span className="flex-1 text-left">{editLabel}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  className="text-gray-300 dark:text-gray-600 opacity-0 group-hover/item:opacity-100 -translate-x-1 group-hover/item:translate-x-0 transition-all">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>

              {/* Extra actions */}
              {extraActions.map((a, i) => {
                const c = colorMap[a.color ?? "blue"];
                return (
                  <button key={i}
                    onClick={() => { a.onClick(); setOpen(false); }}
                    className={`group/item flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 transition-all duration-150 ${c.row}`}
                  >
                    {a.icon && (
                      <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${c.badge}`}>
                        <span className={`size-4 ${c.icon}`}>{a.icon}</span>
                      </span>
                    )}
                    <span className="flex-1 text-left">{a.label}</span>
                  </button>
                );
              })}

              {/* Divider */}
              <div className="my-1 mx-2 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-white/[0.08]" />

              {/* Delete row — opens confirm modal */}
              <button
                onClick={() => { setOpen(false); setConfirming(true); }}
                className="group/item flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm
                           font-semibold text-gray-700 dark:text-gray-200
                           hover:bg-gradient-to-r hover:from-red-50 hover:to-red-50/30
                           dark:hover:from-red-500/15 dark:hover:to-red-500/5
                           hover:text-red-700 dark:hover:text-red-300
                           transition-all duration-150"
              >
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center
                                 group-hover/item:bg-red-500 dark:group-hover/item:bg-red-500 group-hover/item:shadow-md group-hover/item:shadow-red-500/30
                                 transition-all duration-150">
                  <DeleteIcon className="size-4 text-red-600 dark:text-red-300 group-hover/item:text-white dark:group-hover/item:text-white transition-colors" />
                </span>
                <span className="flex-1 text-left">{deleteLabel}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  className="text-gray-300 dark:text-gray-600 opacity-0 group-hover/item:opacity-100 -translate-x-1 group-hover/item:translate-x-0 transition-all">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
            <style>{`
              @keyframes dmdropdown {
                from { opacity: 0; transform: translateY(-8px) scale(0.94); }
                to   { opacity: 1; transform: translateY(0)    scale(1);    }
              }
            `}</style>
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
