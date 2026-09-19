export const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8888'
const API = `${BASE_URL}/api/v1`

export interface AuthUser {
  id: number
  phone: string
  name?: string
  role: string
}

const TOKEN_KEY = 'diametr_token'
const USER_KEY = 'diametr_user'

/** Decodes a JWT payload without verifying it (the server does that). */
function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    return JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

// ── Token expiry vs. a wrongly set phone clock ─────────────────────────────────
// `exp` is SERVER time. A phone whose clock runs hours ahead (e.g. local time
// typed in by hand with the time zone left at UTC) would see every fresh 2h bot
// link as expired. So before a token is refused, the device clock is corrected
// by the server's clock, read from the Date header of a tiny same-origin request
// (the API is cross-origin and does not expose its Date header).

/** Normal leeway once the clock is known to be right. */
const EXPIRY_LEEWAY_MS = 2 * 60 * 1000
/**
 * While the device clock is unverified a STORED session is only dropped once it
 * is this far past `exp`. Until then the server's 401 (apiFetch) ends it, and a
 * background clock check drops it early when it really has expired.
 */
const UNVERIFIED_CLOCK_LEEWAY_MS = 24 * 60 * 60 * 1000
const CLOCK_SYNC_RETRY_MS = 60 * 1000
const CLOCK_SYNC_TIMEOUT_MS = 4000

/** Server clock minus device clock (ms); null until learned. */
let clockOffsetMs: number | null = null
let clockSyncInFlight: Promise<boolean> | null = null
let clockSyncStartedAt = 0

/**
 * Learns the server clock once per page load. Resolves true when the offset is
 * known, false when it could not be read (offline, timeout); never rejects.
 * At most one attempt at a time and one per minute.
 */
function syncServerClock(): Promise<boolean> {
  if (clockOffsetMs != null) return Promise.resolve(true)
  if (clockSyncInFlight) return clockSyncInFlight
  if (clockSyncStartedAt && Date.now() - clockSyncStartedAt < CLOCK_SYNC_RETRY_MS) return Promise.resolve(false)
  clockSyncStartedAt = Date.now()
  const sync = new Promise<boolean>(resolve => {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
    const timer = setTimeout(() => {
      if (controller) controller.abort()
      resolve(false)
    }, CLOCK_SYNC_TIMEOUT_MS)
    const sentAt = Date.now()
    fetch('/', { method: 'HEAD', cache: 'no-store', signal: controller ? controller.signal : undefined })
      .then(res => {
        const receivedAt = Date.now()
        const serverMs = Date.parse(res.headers.get('date') || '')
        if (isNaN(serverMs)) return resolve(false)
        // Date has 1s resolution: take the middle of that second and of the round trip
        clockOffsetMs = serverMs + 500 - Math.round((sentAt + receivedAt) / 2)
        resolve(true)
      })
      .catch(() => resolve(false))
      .then(() => clearTimeout(timer))
  })
  clockSyncInFlight = sync
  sync.then(() => { clockSyncInFlight = null })
  return sync
}

/** How long ago the token expired by the best known clock (<= 0: not yet); null when it has no `exp`. */
function expiredAgoMs(token: string): number | null {
  const payload = decodeJwtPayload(token)
  const exp = payload && typeof payload.exp === 'number' ? payload.exp : null
  if (exp == null) return null
  return Date.now() + (clockOffsetMs != null ? clockOffsetMs : 0) - exp * 1000
}

/**
 * True when the token carries an `exp` that has already passed (by more than
 * the leeway). A token with no `exp` is left to the server to judge.
 */
function isTokenExpired(token: string, leewayMs: number = EXPIRY_LEEWAY_MS): boolean {
  const ago = expiredAgoMs(token)
  return ago != null && ago > leewayMs
}

function clearStoredAuth() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  } catch {
    // storage unavailable — nothing to clear
  }
}

/**
 * The stored session looked expired by the device clock only: check the real
 * time in the background and log out (like a 401 would) if it really expired.
 */
function recheckStoredSession() {
  syncServerClock().then(known => {
    if (!known) return
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      if (token && isTokenExpired(token)) {
        clearStoredAuth()
        window.dispatchEvent(new Event('diametr:unauthorized'))
      }
    } catch {
      // storage unavailable — the server's 401 still ends the session
    }
  })
}

/** Stored token, or null when missing or already expired (an expired one is cleared). */
function getStoredToken(): string | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return null
    const clockKnown = clockOffsetMs != null
    if (isTokenExpired(token, clockKnown ? EXPIRY_LEEWAY_MS : UNVERIFIED_CLOCK_LEEWAY_MS)) {
      clearStoredAuth()
      return null
    }
    if (!clockKnown && isTokenExpired(token)) recheckStoredSession()
    return token
  } catch {
    return null
  }
}

/**
 * Logs in from a ?token= link (store bot). Refuses malformed or already-expired
 * links — old bot buttons stay in chat history, and an expired one must not
 * replace a working session (its first request would 401 and log the user out).
 */
function autoLoginFromToken(token: string): AuthUser | null {
  try {
    const payload = decodeJwtPayload(token)
    if (!payload || payload.user_id == null || isTokenExpired(token)) return null
    const user: AuthUser = {
      id: payload.user_id,
      phone: payload.phone ?? '',
      role: payload.role ?? 'USER',
    }
    // Keep the display name we already know for the same account
    const prev = getStoredUser()
    if (prev && prev.id === user.id) {
      if (prev.name) user.name = prev.name
      if (!user.phone && prev.phone) user.phone = prev.phone
    }
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    return user
  } catch {
    return null
  }
}

/** Logged-in user — only while a non-expired token is stored alongside it. */
function getStoredUser(): AuthUser | null {
  try {
    if (!getStoredToken()) return null
    const u = localStorage.getItem(USER_KEY)
    return u ? JSON.parse(u) : null
  } catch (e) {
    return null
  }
}

export const authService = {
  sendSms: async (phone: string): Promise<{ id: string; phone: string }> => {
    const res = await fetch(`${API}/sms/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    }).catch(() => { throw new Error('Serverga ulanib bo\'lmadi. Internet aloqasini tekshiring') })
    const data = await (res as Response).json()
    if (!(res as Response).ok) throw new Error(data.message || 'SMS yuborishda xatolik yuz berdi')
    return data
  },

  verifySms: async (id: string, code: string): Promise<{ user: AuthUser; access_token: string }> => {
    const res = await fetch(`${API}/sms/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, code }),
    }).catch(() => { throw new Error('Serverga ulanib bo\'lmadi. Internet aloqasini tekshiring') })
    const data = await (res as Response).json()
    if (!(res as Response).ok) throw new Error(data.message || 'Kod noto\'g\'ri yoki muddati o\'tgan')
    return data
  },

  getToken: (): string | null => getStoredToken(),

  getUser: (): AuthUser | null => getStoredUser(),

  saveAuth: (token: string, user: AuthUser) => {
    localStorage.setItem('diametr_token', token)
    localStorage.setItem('diametr_user', JSON.stringify(user))
  },

  logout: () => {
    localStorage.removeItem('diametr_token')
    localStorage.removeItem('diametr_user')
  },

  /** Call this when any API returns 401 — clears auth and notifies the app */
  handleUnauthorized: () => {
    localStorage.removeItem('diametr_token')
    localStorage.removeItem('diametr_user')
    window.dispatchEvent(new Event('diametr:unauthorized'))
  },

  /**
   * Called when ?token=JWT is present in URL (Store bot redirect).
   * Decodes the JWT payload (without verification — server already issued it)
   * and saves auth to localStorage.
   */
  autoLoginFromToken: (token: string): AuthUser | null => autoLoginFromToken(token),

  /**
   * autoLoginFromToken for a link opened just now. When the link looks expired
   * only by this device's clock, the server's clock is read first, so a phone
   * clock set hours ahead does not refuse a fresh bot link. Never rejects.
   */
  autoLoginFromLink: async (token: string): Promise<AuthUser | null> => {
    if (clockOffsetMs == null && isTokenExpired(token)) await syncServerClock()
    return autoLoginFromToken(token)
  },

  /**
   * Wrapper around fetch that:
   * - Attaches Authorization header automatically
   * - Calls handleUnauthorized() on 401
   */
  apiFetch: async (url: string, options: RequestInit = {}): Promise<Response> => {
    const token = getStoredToken()
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
    const res = await fetch(url, { ...options, headers })
    if (res.status === 401) {
      localStorage.removeItem('diametr_token')
      localStorage.removeItem('diametr_user')
      window.dispatchEvent(new Event('diametr:unauthorized'))
    }
    return res
  },
}
