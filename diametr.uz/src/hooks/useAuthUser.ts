import { useEffect, useState } from 'react'
import { authService, AuthUser } from '../service/authService'

/**
 * Page-level logged-in user that stays in sync with the stored session:
 * - a 401 anywhere (authService.apiFetch → 'diametr:unauthorized') logs the page out,
 * - logging in/out in another tab updates this tab too.
 */
export function useAuthUser() {
  const [user, setUser] = useState<AuthUser | null>(() => authService.getUser())

  useEffect(() => {
    const sync = () => setUser(authService.getUser())
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === 'diametr_token' || e.key === 'diametr_user') sync()
    }
    window.addEventListener('diametr:unauthorized', sync)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('diametr:unauthorized', sync)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return [user, setUser] as const
}
