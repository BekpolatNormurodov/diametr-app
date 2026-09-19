import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import axiosClient from "../service/axios.service";

/**
 * Live shop-owner session.
 *
 * The login response is stored in localStorage ("user", "shop_id"), but that is a
 * snapshot: a renewed subscription, a renamed shop, a reassignment to another shop
 * or a new name/phone set by the platform admin never reached it. This provider uses
 * the snapshot only as the initial placeholder and refreshes, on mount, every 60s
 * while the tab is visible, and when the tab regains focus:
 *  - the shop part from GET /subscription/balance (ADMIN, live DB row:
 *    {id, name, balance, expired, auto_payment[, work_status]});
 *  - the admin's own fields from GET /admin/me (ADMIN, live DB row, no password:
 *    {id, fullname, phone, image, chat_id, shop_id, role}).
 * Each request updates only its own part; a failed one keeps the last known values
 * (only a 401 on /subscription/balance ends the session — the axios interceptor handles
 * that; /admin/me opts out, so a backend without that route can never log the owner out).
 * The fresh values are written back to localStorage so a cold start paints them.
 */

export interface SessionShop {
  id?: number;
  name?: string | null;
  expired?: string | null;
  balance?: number;
  auto_payment?: boolean;
  /** Live shop status ("WORKING" | "BLOCKED" …); set only from a live refresh that reports it. */
  work_status?: string;
  [key: string]: unknown;
}

export interface SessionUser {
  id?: number;
  fullname?: string | null;
  phone?: string | null;
  image?: string | null;
  chat_id?: string | null;
  shop_id?: number | null;
  shopName?: string;
  shop?: SessionShop | null;
  [key: string]: unknown;
}

interface ShopSessionValue {
  user: SessionUser | null;
  shop: SessionShop | null;
  shopId: number;
  /** Timestamp of the last successful live refresh (0 = only the stored snapshot so far). */
  checkedAt: number;
  refresh: () => Promise<void>;
  updateUser: (patch: Partial<SessionUser>) => void;
}

const REFRESH_INTERVAL = 60_000;
const FOCUS_THROTTLE = 30_000;

function readStoredUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

function readStoredShopId(): number {
  try {
    return Number(localStorage.getItem("shop_id") ?? 0) || 0;
  } catch {
    return 0;
  }
}

function writeStored(user: SessionUser | null, shopId: number) {
  try {
    // Logged out meanwhile (a refresh resolved during the redirect): never resurrect the snapshot.
    if (!localStorage.getItem("token")) return;
    // Another account signed in from a different tab: its snapshot is not ours to overwrite.
    const stored = readStoredUser();
    if (stored?.id != null && user?.id != null && stored.id !== user.id) return;
    if (user) localStorage.setItem("user", JSON.stringify(user));
    if (shopId) localStorage.setItem("shop_id", String(shopId));
  } catch { /* storage unavailable */ }
}

const ShopIdContext = createContext<number | null>(null);
const ShopSessionContext = createContext<ShopSessionValue | null>(null);

export function ShopSessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => readStoredUser());
  const [shopId, setShopId] = useState<number>(() => readStoredShopId());
  const [checkedAt, setCheckedAt] = useState(0);
  const seq = useRef(0);
  const lastRun = useRef(0);

  const refresh = useCallback(async () => {
    const id = ++seq.current;
    lastRun.current = Date.now();
    const [balRes, meRes] = await Promise.allSettled([
      axiosClient.get("/subscription/balance"),
      // Never ends the session by itself: /subscription/balance (same token) still does on a
      // real 401, and an older backend without /admin/me must not log the owner out.
      axiosClient.get("/admin/me", { skipAuthRedirect: true }),
    ]);
    if (id !== seq.current) return;

    // Admin's own fields (name/phone shown in the header and on Profile). Merged field by
    // field, never the password; a backend without /admin/me (403/404) just keeps the snapshot.
    if (meRes.status === "fulfilled") {
      const me = meRes.value.data;
      if (me && typeof me === "object" && typeof me.id === "number") {
        setUser((prev) => {
          const next: SessionUser = { ...(prev ?? {}), id: me.id };
          if (me.fullname !== undefined) next.fullname = me.fullname;
          if (me.phone !== undefined) next.phone = me.phone;
          if (me.image !== undefined) next.image = me.image;
          if (me.chat_id !== undefined) next.chat_id = me.chat_id;
          if (typeof me.role === "string") next.role = me.role;
          delete next.password;
          return next;
        });
      }
    }

    if (balRes.status !== "fulfilled") return; // network / server error — keep the last known values
    const d = balRes.value.data ?? {};
    const liveId = typeof d.id === "number" ? d.id : null;
    setUser((prev) => {
      const base: SessionUser = prev ?? {};
      const next: SessionUser = {
        ...base,
        ...(liveId != null ? { shop_id: liveId } : {}),
        shop: {
          ...(base.shop ?? {}),
          ...(liveId != null ? { id: liveId } : {}),
          name: d.name ?? base.shop?.name ?? null,
          expired: d.expired ?? null,
          ...(d.balance !== undefined ? { balance: d.balance } : {}),
          ...(d.auto_payment !== undefined ? { auto_payment: d.auto_payment } : {}),
          // Only a live value counts: the login snapshot's status may be stale, so it is
          // dropped when the refresh does not report one.
          work_status: typeof d.work_status === "string" ? d.work_status : undefined,
        },
      };
      return next;
    });
    if (liveId != null) setShopId((prev) => (prev === liveId ? prev : liveId));
    setCheckedAt(Date.now());
  }, []);

  useEffect(() => {
    refresh();
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastRun.current < FOCUS_THROTTLE) return;
      refresh();
    };
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, REFRESH_INTERVAL);
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const updateUser = useCallback((patch: Partial<SessionUser>) => {
    setUser((prev) => ({ ...(prev ?? {}), ...patch }));
  }, []);

  // Persist live values so the next cold start paints them immediately.
  useEffect(() => {
    if (checkedAt === 0 && user === null) return;
    writeStored(user, shopId);
  }, [user, shopId, checkedAt]);

  const value = useMemo<ShopSessionValue>(
    () => ({ user, shop: user?.shop ?? null, shopId, checkedAt, refresh, updateUser }),
    [user, shopId, checkedAt, refresh, updateUser]
  );

  return (
    <ShopIdContext.Provider value={shopId}>
      <ShopSessionContext.Provider value={value}>{children}</ShopSessionContext.Provider>
    </ShopIdContext.Provider>
  );
}

/** Live shop id of the logged-in owner (changes only when the shop really changes). */
export function useShopId(): number {
  const id = useContext(ShopIdContext);
  return id ?? readStoredShopId();
}

export function useShopSession(): ShopSessionValue {
  const ctx = useContext(ShopSessionContext);
  if (ctx) return ctx;
  const user = readStoredUser();
  return {
    user,
    shop: user?.shop ?? null,
    shopId: readStoredShopId(),
    checkedAt: 0,
    refresh: async () => {},
    updateUser: () => {},
  };
}
