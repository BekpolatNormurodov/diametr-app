/**
 * Ending the panel session — one place for the "Chiqish" button, an expired
 * stored token and every 401 from the API.
 *
 * A 401 used to clear only the token and redirect, while each failed request
 * still showed its own error toast; the "Sign out" item was a plain link that
 * left the token in place, so the panel stayed logged in.
 */

const SESSION_KEYS = ["token", "user", "shop_id"];
const EXPIRED_FLAG = "diametr_session_expired";

let ending = false;

/** Clears the stored session; `expired` makes the sign-in page explain why. */
export function clearSession(expired = false) {
  try {
    SESSION_KEYS.forEach((k) => localStorage.removeItem(k));
  } catch { /* storage unavailable */ }
  if (expired) {
    try { sessionStorage.setItem(EXPIRED_FLAG, "1"); } catch { /* ignore */ }
  }
}

/** Clears the session and reloads on the sign-in page (fresh app state). */
export function endSession(expired = false) {
  if (ending) return;
  ending = true;
  clearSession(expired);
  window.location.replace("/signin");
}

/** True once after a session ended because the token expired / was rejected. */
export function takeExpiredFlag(): boolean {
  try {
    const v = sessionStorage.getItem(EXPIRED_FLAG);
    sessionStorage.removeItem(EXPIRED_FLAG);
    return v === "1";
  } catch {
    return false;
  }
}

/**
 * True when the JWT carries an `exp` that has passed. Anything undecodable
 * counts as valid — the server's 401 stays the final word.
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return false;
  try {
    const part = token.split(".")[1];
    if (!part) return false;
    const payload = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload?.exp === "number" && payload.exp * 1000 < Date.now();
  } catch {
    return false;
  }
}
