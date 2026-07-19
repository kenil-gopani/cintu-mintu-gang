import { Menu, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
import ThemeSelector from './ThemeSelector'
import Avatar from './Avatar'
import NotificationCenter from './NotificationCenter'
import { useAuth } from '../../hooks/useAuth'

export default function Navbar({ onMenuClick }) {
  const { user } = useAuth()

  return (
    <header className="shrink-0 z-20 sticky top-0 w-full bg-white dark:bg-dark-card border-b border-light-border dark:border-dark-border px-4 h-14 flex items-center justify-between gap-4 safe-top">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="btn-icon lg:hidden" id="mobile-menu-btn">
          <Menu size={19} />
        </button>
        {/* Search bar */}
        <div className="hidden sm:flex items-center gap-2 bg-light-bg dark:bg-dark-bg rounded-xl px-3 py-2 w-52 border border-light-border dark:border-dark-border">
          <Search size={14} className="text-light-sub dark:text-dark-sub shrink-0" />
          <input
            type="text"
            placeholder="Search family..."
            className="bg-transparent outline-none text-sm flex-1 placeholder-light-sub dark:placeholder-dark-sub text-light-text dark:text-dark-text"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5">
        <ThemeSelector />
        <ThemeToggle />
        <NotificationCenter />
        <Link to={`/profile/${user?._id}`} className="ml-1 flex items-center justify-center">
          <Avatar src={user?.avatar} name={user?.name} size={32} />
        </Link>
      </div>
    </header>
  )
}
