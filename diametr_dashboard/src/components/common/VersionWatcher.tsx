import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";

/*
 * Picks up a new deploy in a long-open tab without a hard refresh.
 *
 * Running version = src of the Vite entry script in the live document
 * (/assets/index-<hash>.js). The latest version is read from a fresh
 * index.html (served no-store by nginx). When they differ:
 *   - the next react-router navigation reloads the page (a natural boundary,
 *     nothing half-typed is lost);
 *   - a small "Yangi versiya mavjud" banner offers a manual "Yangilash".
 * Focus / visibility / timer checks never reload on their own.
 * If the version cannot be determined (e.g. vite dev server) it does nothing.
 */

const BUNDLE_SRC_RE = /\/assets\/index-[A-Za-z0-9_-]+\.js$/;
const MIN_CHECK_GAP_MS = 60_000;
const VISIBLE_INTERVAL_MS = 5 * 60_000;
const ATTEMPT_KEY = "diametr_dashboard_reload_target";

function bundleSrcFrom(root: ParentNode): string | null {
  const scripts = root.querySelectorAll<HTMLScriptElement>('script[type="module"][src]');
  for (const s of Array.from(scripts)) {
    const src = s.getAttribute("src") ?? "";
    if (BUNDLE_SRC_RE.test(src)) return src;
  }
  return null;
}

function readAttempt(): string | null {
  try { return sessionStorage.getItem(ATTEMPT_KEY); } catch { return null; }
}

function writeAttempt(v: string) {
  try { sessionStorage.setItem(ATTEMPT_KEY, v); } catch { /* storage unavailable */ }
}

export default function VersionWatcher() {
  const location = useLocation();
  const runningRef = useRef<string | null>(null);
  const latestRef = useRef<string | null>(null);
  const lastCheckRef = useRef(0);
  const inFlightRef = useRef(false);
  const firstLocationRef = useRef(true);
  const [available, setAvailable] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);

  const check = useRef(async () => {
    const running = runningRef.current;
    if (!running || inFlightRef.current) return;
    const now = Date.now();
    if (now - lastCheckRef.current < MIN_CHECK_GAP_MS) return;
    lastCheckRef.current = now;
    inFlightRef.current = true;
    try {
      const res = await fetch(`/index.html?_v=${now}`, { cache: "no-store" });
      if (!res.ok) return;
      const html = await res.text();
      const latest = bundleSrcFrom(new DOMParser().parseFromString(html, "text/html"));
      if (!latest) return;
      latestRef.current = latest === running ? null : latest;
      setAvailable(latestRef.current);
    } catch {
      /* network errors are ignored */
    } finally {
      inFlightRef.current = false;
    }
  }).current;

  // Determine the running version once, then wire focus/visibility/timer checks.
  useEffect(() => {
    runningRef.current = bundleSrcFrom(document);
    if (!runningRef.current) return;

    const onFocus = () => { check(); };
    const onVisibility = () => { if (document.visibilityState === "visible") check(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") check();
    }, VISIBLE_INTERVAL_MS);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(timer);
    };
  }, [check]);

  // Every react-router navigation: reload if a newer version is known, else check.
  useEffect(() => {
    if (firstLocationRef.current) {
      firstLocationRef.current = false;
      check();
      return;
    }
    const latest = latestRef.current;
    if (latest && runningRef.current && latest !== runningRef.current) {
      // Loop guard: if we already reloaded towards this exact version and are
      // still running an older bundle (stale cache somewhere), don't loop —
      // leave it to the banner.
      if (readAttempt() !== latest) {
        writeAttempt(latest);
        window.location.reload();
        return;
      }
    }
    check();
  }, [location.key, location.pathname, location.search, check]);

  if (!available || dismissed === available) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[99998] max-w-[calc(100vw-32px)]">
      <div className="flex items-center gap-3 rounded-xl bg-white dark:bg-gray-800 ring-1 ring-blue-100 dark:ring-blue-500/20 shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] pl-4 pr-2 py-2.5">
        <span className="flex-shrink-0 text-blue-500">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" clipRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" />
          </svg>
        </span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">Yangi versiya mavjud</span>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition-colors whitespace-nowrap"
        >
          Yangilash
        </button>
        <button
          type="button"
          onClick={() => setDismissed(available)}
          title="Yopish"
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 transition-colors"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
