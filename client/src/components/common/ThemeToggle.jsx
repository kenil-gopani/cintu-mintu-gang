import { motion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'

export default function ThemeToggle({ size = 'md' }) {
  const { isDark, toggleTheme } = useTheme()

  return (
    <motion.button
      onClick={toggleTheme}
      whileTap={{ scale: 0.85 }}
      whileHover={{ scale: 1.05 }}
      className="relative w-14 h-7 rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-coral/50"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, #1A1A2E, #2A2A4A)'
          : 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
      }}
      aria-label="Toggle theme"
    >
      <motion.div
        className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-md"
        animate={{ x: isDark ? 28 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {isDark
          ? <Moon size={12} className="text-dark-bg" />
          : <Sun size={12} className="text-coral" />
        }
      </motion.div>
    </motion.button>
  )
}
