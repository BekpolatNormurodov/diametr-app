import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

type Lang = 'uz' | 'ru'
type Theme = 'light' | 'dark'

interface AppContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  theme: Theme
  toggleTheme: () => void
}

const AppContext = createContext<AppContextValue>({
  lang: 'uz',
  setLang: () => {},
  theme: 'light',
  toggleTheme: () => {},
})

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() =>
    (localStorage.getItem('diametr_lang') as Lang) || 'uz'
  )
  const [theme, setThemeState] = useState<Theme>(() =>
    (localStorage.getItem('diametr_theme') as Theme) || 'light'
  )

  const setLang = useCallback((l: Lang) => {
    localStorage.setItem('diametr_lang', l)
    setLangState(l)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState(t => {
      const next = t === 'light' ? 'dark' : 'light'
      localStorage.setItem('diametr_theme', next)
      return next
    })
  }, [])

  // Apply dark class globally whenever theme changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return (
    <AppContext.Provider value={{ lang, setLang, theme, toggleTheme }}>
      {children}
    </AppContext.Provider>
  )
}

export function useLang() {
  return useContext(AppContext)
}

export default AppContext
