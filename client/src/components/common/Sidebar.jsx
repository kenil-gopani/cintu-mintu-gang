import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Home, Image, MessageCircle, Calendar, Users, Network, Gift, Laugh, Shield, LogOut, CheckCircle2, BarChart2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import Avatar from './Avatar'
import { useSocket } from '../../hooks/useSocket'

const navItems = [
  { to: '/home',     icon: Home,          label: 'Home' },
  { to: '/gallery',  icon: Image,         label: 'Memory Wall' },
  { to: '/events',   icon: Calendar,      label: 'Events' },
  { to: '/members',  icon: Users,         label: 'Members' },
  { to: '/tree',     icon: Network,       label: 'Family Tree' },
  { to: '/polls',    icon: CheckCircle2,  label: 'Polls' },
  { to: '/birthday', icon: Gift,          label: 'Birthdays' },
  { to: '/chat',     icon: MessageCircle, label: 'Family Chat',     comingSoon: true },
  { to: '/games',    icon: Laugh,         label: 'Arcade & Games',  comingSoon: true },
]

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  const { onlineUsers } = useSocket()
  const location = useLocation()

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-light-border dark:border-dark-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-warm flex items-center justify-center shadow-sm shrink-0">
            <span className="text-white text-sm font-black">C</span>
          </div>
          <div>
            <h1 className="text-sm font-black text-light-text dark:text-dark-text leading-tight">Cintu-Mintu</h1>
            <p className="text-[10px] font-semibold text-light-muted dark:text-dark-muted">Gang 🏠</p>
          </div>
        </div>
        <button onClick={onClose} className="btn-icon lg:hidden">
          <X size={18} />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-3 sidebar-scroll overflow-y-auto">
        <ul className="space-y-0.5">
          {navItems.map(({ to, icon: Icon, label, comingSoon }) => {
            const active = location.pathname === to
            if (comingSoon) {
              return (
                <li key={to}>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium opacity-40 cursor-not-allowed text-light-muted dark:text-dark-muted select-none">
                    <Icon size={17} />
                    <span className="flex-1">{label}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-light-border dark:bg-dark-border text-light-muted dark:text-dark-muted px-1.5 py-0.5 rounded-full">Soon</span>
                  </div>
                </li>
              )
            }
            return (
              <li key={to}>
                <Link
                  to={to}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-semibold border-l-[3px] border-indigo-500 pl-[calc(0.75rem-3px)]'
                      : 'text-light-muted dark:text-dark-muted hover:bg-light-bg dark:hover:bg-dark-bg hover:text-light-text dark:hover:text-dark-text'
                  }`}
                >
                  <Icon size={17} />
                  {label}
                </Link>
              </li>
            )
          })}
          {user?.role === 'admin' && (
            <li>
              <Link
                to="/admin"
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  location.pathname === '/admin'
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-semibold border-l-[3px] border-indigo-500 pl-[calc(0.75rem-3px)]'
                    : 'text-light-muted dark:text-dark-muted hover:bg-light-bg dark:hover:bg-dark-bg hover:text-light-text dark:hover:text-dark-text'
                }`}
              >
                <Shield size={17} />
                Admin Panel
              </Link>
            </li>
          )}
        </ul>
      </nav>

      {/* User card */}
      <div className="px-3 py-3 border-t border-light-border dark:border-dark-border">
        {/* Online status pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-semibold text-green-700 dark:text-green-400">{onlineUsers.length} online</span>
        </div>

        <Link
          to={`/profile/${user?._id}`}
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
        >
          <Avatar
            src={user?.avatar}
            name={user?.name}
            size={36}
            online={onlineUsers.includes(user?._id)}
          />
          <div className="overflow-hidden flex-1">
            <p className="font-semibold text-sm text-light-text dark:text-dark-text truncate">{user?.nickname || user?.name}</p>
            <p className="text-xs text-light-muted dark:text-dark-muted capitalize">{user?.role}</p>
          </div>
        </Link>

        <button
          onClick={logout}
          className="mt-1 w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut size={17} />
          Logout
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-60 h-screen bg-white dark:bg-dark-card border-r border-light-border dark:border-dark-border flex-col shrink-0">
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
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden"
            />
            <motion.div
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed left-0 top-0 h-screen-safe w-60 z-40 lg:hidden bg-white dark:bg-dark-card border-r border-light-border dark:border-dark-border flex flex-col safe-top"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
