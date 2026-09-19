import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import Button from "../ui/button/Button";
import { isBusy } from "../../utils/busy";

/**
 * Lets a long-open tab pick up a new deploy without a hard refresh.
 *
 * Running version = the hashed Vite entry script of this document (/assets/index-<hash>.js).
 * Latest version  = the same script in a freshly fetched index.html (served no-store).
 * When they differ: the next in-app navigation does a normal reload (a natural boundary),
 * and a small "Yangi versiya mavjud" banner offers "Yangilash" right away. It never reloads
 * on focus/visibility — a form or modal may be half filled — and never while a multi-row
 * save is running (utils/busy). Fails safe: if the running
 * version cannot be determined (e.g. dev server), it does nothing.
 */

const BUNDLE_RE = /\/assets\/index-[A-Za-z0-9_-]+\.js/;
const CHECK_THROTTLE = 60_000;
const CHECK_INTERVAL = 5 * 60_000;
const ATTEMPT_KEY = "diametr_shop_admin:reload-attempt";

function bundleSrc(doc: Document): string | null {
  const scripts = doc.querySelectorAll('script[type="module"][src]');
  for (const el of Array.from(scripts)) {
    const match = (el.getAttribute("src") ?? "").match(BUNDLE_RE);
    if (match) return match[0];
  }
  return null;
}

function readAttempt(): string | null {
  try { return sessionStorage.getItem(ATTEMPT_KEY); } catch { return null; }
}
function writeAttempt(version: string) {
  try { sessionStorage.setItem(ATTEMPT_KEY, version); } catch { /* storage unavailable */ }
}
function clearAttempt() {
  try { sessionStorage.removeItem(ATTEMPT_KEY); } catch { /* storage unavailable */ }
}

export default function VersionWatcher() {
  const location = useLocation();
  const [running] = useState<string | null>(() => bundleSrc(document));
  const [available, setAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const pending = useRef<string | null>(null); // newer version to reload into on the next navigation
  const found = useRef(false);
  const lastCheck = useRef(0);
  const firstLocation = useRef(true);

  const check = useCallback(async () => {
    if (!running || found.current) return;
    const now = Date.now();
    if (now - lastCheck.current < CHECK_THROTTLE) return;
    lastCheck.current = now;
    try {
      const res = await fetch(`/index.html?_v=${now}`, { cache: "no-store" });
      if (!res.ok) return;
      const latest = bundleSrc(new DOMParser().parseFromString(await res.text(), "text/html"));
      if (!latest || latest === running || found.current) return;
      found.current = true;
      // Loop guard: we already reloaded once to reach `latest` and still run the old bundle —
      // do not reload automatically again, only offer the banner.
      if (readAttempt() !== latest) pending.current = latest;
      setAvailable(true);
    } catch {
      /* offline / network error — try again on the next trigger */
    }
  }, [running]);

  useEffect(() => {
    if (!running) return;
    // The previous automatic reload reached the version it aimed for.
    if (readAttempt() === running) clearAttempt();
    const onFocus = () => { check(); };
    const onVisible = () => { if (document.visibilityState === "visible") check(); };
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") check();
    }, CHECK_INTERVAL);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [running, check]);

  useEffect(() => {
    if (firstLocation.current) {
      firstLocation.current = false;
      check();
      return;
    }
    if (pending.current) {
      // A multi-row stock save is still sending requests: a reload now would silently drop
      // the rest. Keep the pending version — the next navigation after the save reloads.
      if (isBusy()) return;
      writeAttempt(pending.current);
      window.location.reload();
      return;
    }
    check();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key, location.pathname, location.search]);

  if (!available || dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[999999] max-w-[calc(100vw-32px)]">
      <div
        role="status"
        className="relative flex items-center gap-3 overflow-hidden rounded-xl bg-white py-2.5 pl-4 pr-2.5 ring-1 ring-blue-100 shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:bg-gray-800 dark:ring-blue-500/20 dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
      >
        <span className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
        <p className="text-sm font-medium text-gray-800 dark:text-white">Yangi versiya mavjud</p>
        <Button size="sm" onClick={() => window.location.reload()}>Yangilash</Button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Yopish"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-gray-300 transition-colors hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
