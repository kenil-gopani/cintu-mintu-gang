import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Palette, Check } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'

export default function ThemeSelector({ mobile = false }) {
  const { theme, setTheme, availableThemes } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (mobile) {
    return (
      <div className="flex flex-col gap-2 mt-4 px-3 py-3 border-t border-light-border dark:border-dark-border">
        <p className="text-xs font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-1">Appearance</p>
        {availableThemes.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-[14px] text-sm font-medium transition-all duration-150 ${
              theme === t.id
                ? 'bg-primary text-white font-semibold shadow-sm'
                : 'text-light-muted dark:text-dark-muted hover:bg-light-bg dark:hover:bg-dark-bg hover:text-light-text dark:hover:text-dark-text'
            }`}
          >
            <span className="text-lg leading-none">{t.icon}</span>
            <span className="flex-1 text-left">{t.name}</span>
            {theme === t.id && <Check size={16} />}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-[14px] transition-all duration-200 flex items-center justify-center ${
          isOpen ? 'bg-primary/10 text-primary' : 'text-light-muted dark:text-dark-muted hover:bg-primary/10 hover:text-primary'
        }`}
        title="Change Theme"
      >
        <Palette size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-xl overflow-hidden z-50 p-1.5"
          >
            <div className="px-3 py-2 border-b border-light-border dark:border-dark-border mb-1">
              <p className="text-xs font-bold text-light-muted dark:text-dark-muted">🎨 Theme</p>
            </div>
            {availableThemes.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  theme === t.id
                    ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light font-bold'
                    : 'text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-bg'
                }`}
              >
                <span className="text-base leading-none">{t.icon}</span>
                <span className="flex-1 text-left">{t.name}</span>
                {theme === t.id && <Check size={16} className="text-primary" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
