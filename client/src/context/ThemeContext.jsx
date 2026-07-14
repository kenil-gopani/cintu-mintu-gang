import { createContext, useState, useEffect, useCallback } from 'react'

export const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('cmg-theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('cmg-active-theme') || 'default'
  })

  useEffect(() => {
    localStorage.setItem('cmg-theme', isDark ? 'dark' : 'light')
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  useEffect(() => {
    localStorage.setItem('cmg-active-theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => setIsDark(prev => !prev), [])

  const availableThemes = [
    { id: 'default', name: 'Default', icon: '🔵' },
    { id: 'purple', name: 'Purple', icon: '🟣' },
    { id: 'emerald', name: 'Emerald', icon: '🟢' }
  ]

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, theme, setTheme, availableThemes }}>
      {children}
    </ThemeContext.Provider>
  )
}
