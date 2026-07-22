export const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8888'
const API = `${BASE_URL}/api/v1`

export interface AuthUser {
  id: number
  phone: string
  name?: string
  role: string
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

  getToken: (): string | null => localStorage.getItem('diametr_token'),

  getUser: (): AuthUser | null => {
    try {
      const u = localStorage.getItem('diametr_user')
      return u ? JSON.parse(u) : null
    } catch (e) {
      return null
    }
  },

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
  autoLoginFromToken: (token: string): AuthUser | null => {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) return null
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
      const user: AuthUser = {
        id: payload.user_id,
        phone: payload.phone ?? '',
        role: payload.role ?? 'USER',
      }
      localStorage.setItem('diametr_token', token)
      localStorage.setItem('diametr_user', JSON.stringify(user))
      return user
    } catch {
      return null
    }
  },

  /**
   * Wrapper around fetch that:
   * - Attaches Authorization header automatically
   * - Calls handleUnauthorized() on 401
   */
  apiFetch: async (url: string, options: RequestInit = {}): Promise<Response> => {
    const token = localStorage.getItem('diametr_token')
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
