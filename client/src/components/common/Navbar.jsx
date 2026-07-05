import { Menu, Bell, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
import Avatar from './Avatar'
import NotificationCenter from './NotificationCenter'
import { useAuth } from '../../hooks/useAuth'

export default function Navbar({ onMenuClick }) {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-20 bg-light-card/80 dark:bg-dark-card/80 backdrop-blur-xl border-b border-light-border dark:border-dark-border px-4 h-16 flex items-center justify-between gap-4 safe-top">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="btn-icon lg:hidden touch-manipulation" id="mobile-menu-btn">
          <Menu size={20} />
        </button>
        <div className="hidden sm:flex items-center gap-2 bg-black/5 dark:bg-white/5 rounded-2xl px-3 py-2 w-56">
          <Search size={16} className="text-light-muted dark:text-dark-muted shrink-0" />
          <input
            type="text"
            placeholder="Search family..."
            className="bg-transparent outline-none text-sm flex-1 placeholder-light-muted dark:placeholder-dark-muted"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        {/* Notifications */}
        <NotificationCenter />

        {/* Avatar */}
        <Link to={`/profile/${user?._id}`}>
          <Avatar src={user?.avatar} name={user?.name} size={36} />
        </Link>
      </div>
    </header>
  )
}

