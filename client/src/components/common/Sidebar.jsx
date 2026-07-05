import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Home, Image, MessageCircle, Calendar, Users, Network, Gift, Laugh, Shield, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import Avatar from './Avatar'
import { useSocket } from '../../hooks/useSocket'

const navItems = [
  { to: '/home',      icon: Home,          label: 'Home' },
  { to: '/gallery',   icon: Image,         label: 'Memory Wall' },
  { to: '/events',    icon: Calendar,      label: 'Events' },
  { to: '/members',   icon: Users,         label: 'Members' },
  { to: '/tree',      icon: Network,       label: 'Family Tree' },
  { to: '/birthday',  icon: Gift,          label: 'Birthdays' },
  { to: '/chat',      icon: MessageCircle, label: 'Family Chat',  comingSoon: true },
  { to: '/games',     icon: Laugh,         label: 'Arcade & Games', comingSoon: true },
]

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  const { onlineUsers } = useSocket()
  const location = useLocation()

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div>
          <h1 className="text-xl font-extrabold gradient-text leading-tight">Cintu-Mintu</h1>
          <p className="text-xs font-bold text-light-muted dark:text-dark-muted">Gang 🏠</p>
        </div>
        <button onClick={onClose} className="btn-icon lg:hidden">
          <X size={20} />
        </button>
      </div>

      {/* User card */}
      <Link
        to={`/profile/${user?._id}`}
        onClick={onClose}
        className="mx-4 mb-4 p-3 rounded-2xl glass flex items-center gap-3 hover:scale-[1.02] transition-transform"
      >
        <Avatar
          src={user?.avatar}
          name={user?.name}
          size={44}
          online={onlineUsers.includes(user?._id)}
        />
        <div className="overflow-hidden">
          <p className="font-bold text-sm truncate">{user?.nickname || user?.name}</p>
          <p className="text-xs text-light-muted dark:text-dark-muted capitalize">{user?.role}</p>
        </div>
      </Link>

      {/* Nav items */}
      <nav className="flex-1 px-3 sidebar-scroll overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map(({ to, icon: Icon, label, comingSoon }) => {
            const active = location.pathname === to
            if (comingSoon) {
              return (
                <li key={to}>
                  <div
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm opacity-50 cursor-not-allowed select-none text-light-muted dark:text-dark-muted"
                  >
                    <Icon size={18} />
                    <span className="flex-1">{label}</span>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider bg-coral/20 text-coral px-2 py-0.5 rounded-full">Soon</span>
                  </div>
                </li>
              )
            }
            return (
              <li key={to}>
                <Link
                  to={to}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 ${
                    active
                      ? 'bg-gradient-warm text-white shadow-glow-coral'
                      : 'text-light-muted dark:text-dark-muted hover:bg-black/5 dark:hover:bg-white/10 hover:text-light-text dark:hover:text-dark-text'
                  }`}
                >
                  <Icon size={18} />
                  {label}
                  {active && (
                    <motion.div
                      layoutId="active-pill"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                    />
                  )}
                </Link>
              </li>
            )
          })}
          {user?.role === 'admin' && (
            <li>
              <Link
                to="/admin"
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 ${
                  location.pathname === '/admin'
                    ? 'bg-gradient-warm text-white'
                    : 'text-light-muted dark:text-dark-muted hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                <Shield size={18} />
                Admin Panel
              </Link>
            </li>
          )}
        </ul>
      </nav>

      {/* Online count */}
      <div className="mx-4 mb-2 px-3 py-2 rounded-xl glass text-xs text-center text-light-muted dark:text-dark-muted font-semibold">
        🟢 {onlineUsers.length} member{onlineUsers.length !== 1 ? 's' : ''} online
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="mx-4 mb-4 mobile-nav flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm text-red-400 hover:bg-red-400/10 transition-all duration-200"
      >
        <LogOut size={18} />
        Logout
      </button>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-64 h-screen bg-light-card/80 dark:bg-dark-card/80 backdrop-blur-xl border-r border-light-border dark:border-dark-border flex-col shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 h-screen-safe w-64 z-40 lg:hidden bg-light-card dark:bg-dark-card border-r border-light-border dark:border-dark-border flex flex-col safe-top"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
