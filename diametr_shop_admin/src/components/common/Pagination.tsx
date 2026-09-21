import { useEffect } from "react";
import Button from "../ui/button/Button";

/**
 * Ideal pagination for our admin tables.
 *
 * Two whole classes of bug are impossible now:
 * - "Where am I?" — the current page number is always visible ("Sahifa X / Y"),
 *   so clicking Keyingi and landing on a shorter page can no longer feel like
 *   the page went backwards.
 * - "Stuck on an empty page" — {@link useAutoClampPage} clamps the current
 *   page to `maxPage` whenever the item count shrinks (a poll removed rows,
 *   a filter narrowed them), so pressing Keyingi never lands on a blank view.
 *
 * Extras: numeric page tokens jump directly to a page (with ellipses when
 * there are many); the pager scrolls the table's top back into view on
 * change; every button is keyboard-reachable.
 */
export interface PaginationProps {
  /** 1-based current page. */
  currentPage: number;
  /** Total pages (≥ 1). */
  maxPage: number;
  /** Total items across all pages, shown on the left. Optional. */
  totalItems?: number;
  /** Label for the total count (e.g. "ta tovar"). */
  totalLabel?: string;
  /** Called with the new page number. */
  onChange: (page: number) => void;
  /**
   * When set, the pager scrolls this element back into view after a page
   * change — so the user always sees the top of the fresh page.
   */
  scrollTargetRef?: React.RefObject<HTMLElement | null>;
}

/** Build the visible page tokens: [1] … [current-1] [current] [current+1] … [max]. */
function pageTokens(current: number, max: number): (number | "…")[] {
  if (max <= 7) return Array.from({ length: max }, (_, i) => i + 1);
  const set = new Set<number>([1, max, current, current - 1, current + 1]);
  const pages = [...set].filter((p) => p >= 1 && p <= max).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  for (let i = 0; i < pages.length; i++) {
    if (i > 0 && pages[i] - pages[i - 1] > 1) out.push("…");
    out.push(pages[i]);
  }
  return out;
}

export default function Pagination({
  currentPage,
  maxPage,
  totalItems,
  totalLabel,
  onChange,
  scrollTargetRef,
}: PaginationProps) {
  const go = (p: number) => {
    const clamped = Math.min(Math.max(1, p), maxPage);
    if (clamped === currentPage) return;
    onChange(clamped);
    // Bring the top of the table back into view on the next frame, once the
    // new rows are rendered — skipped when the target is already on screen.
    if (scrollTargetRef?.current) {
      requestAnimationFrame(() => {
        const el = scrollTargetRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.top < 0 || rect.top > window.innerHeight * 0.5) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }
  };

  const tokens = pageTokens(currentPage, maxPage);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < maxPage;

  return (
    <div className="px-5 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-t border-gray-100 dark:border-white/5">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        {typeof totalItems === "number" && (
          <span>
            {totalItems.toLocaleString()} {totalLabel ?? ""}
          </span>
        )}
        <span className="text-gray-300 dark:text-white/20">•</span>
        <span className="tabular-nums">
          Sahifa <span className="font-semibold text-gray-700 dark:text-gray-200">{currentPage}</span> / {maxPage}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button size="sm" variant="outline" disabled={!hasPrev} onClick={() => go(currentPage - 1)}>
          Oldingi
        </Button>
        {tokens.map((t, i) =>
          t === "…" ? (
            <span key={`e${i}`} className="px-2 text-gray-400 select-none">…</span>
          ) : (
            <button
              key={t}
              type="button"
              onClick={() => go(t)}
              aria-current={t === currentPage ? "page" : undefined}
              className={`min-w-[34px] h-[34px] px-2 rounded-lg text-sm font-medium transition-colors tabular-nums ${
                t === currentPage
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 border border-gray-200 dark:border-white/10"
              }`}
            >
              {t}
            </button>
          ),
        )}
        <Button size="sm" variant="outline" disabled={!hasNext} onClick={() => go(currentPage + 1)}>
          Keyingi
        </Button>
      </div>
    </div>
  );
}

/**
 * Keeps `currentPage` inside `[1, maxPage]`. Without this, a poll that removed
 * rows would leave the pager pointing at a page that no longer exists — the
 * user sees an empty view and thinks the button "went back". Call it right
 * next to the state.
 */
export function useAutoClampPage(
  currentPage: number,
  maxPage: number,
  setPage: (p: number) => void,
) {
  useEffect(() => {
    if (currentPage > maxPage) setPage(maxPage);
    else if (currentPage < 1) setPage(1);
  }, [currentPage, maxPage, setPage]);
}
