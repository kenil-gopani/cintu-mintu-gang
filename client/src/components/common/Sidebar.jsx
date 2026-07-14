import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Home, Image, MessageCircle, Calendar, Users, Network, Gift, Laugh, Shield, LogOut, CheckCircle2, BarChart2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import Avatar from './Avatar'
import { useSocket } from '../../hooks/useSocket'
import { useEffect } from 'react'

const navItems = [
  { to: '/home',     icon: Home,          label: 'Home' },
  { to: '/gallery',  icon: Image,         label: 'Memory Wall' },
  { to: '/events',   icon: Calendar,      label: 'Events' },
  { to: '/members',  icon: Users,         label: 'Members' },
  { to: '/tree',     icon: Network,       label: 'Family Tree' },
  { to: '/polls',    icon: CheckCircle2,  label: 'Polls' },
  { to: '/birthday', icon: Gift,          label: 'Birthdays' },
  { to: '/chat',     icon: MessageCircle, label: 'Family Chat' },
  { to: '/games',    icon: Laugh,         label: 'Arcade & Games',  comingSoon: true },
]

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  const { onlineUsers } = useSocket()
  const location = useLocation()

  // Prevent body scrolling when mobile sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-light-border dark:border-dark-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm shrink-0">
            <span className="text-white text-sm font-black">C</span>
          </div>
          <div>
            <h1 className="text-sm font-black text-light-text dark:text-dark-text leading-tight">Cintu-Mintu</h1>
            <p className="text-[10px] font-semibold text-light-muted dark:text-dark-muted">Gang 🏠</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="p-2 rounded-xl bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text lg:hidden cursor-pointer active:scale-95">
          <X size={20} />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-3 sidebar-scroll overflow-y-auto">
        <ul className="space-y-0.5">
          {navItems.map(({ to, icon: Icon, label, comingSoon }) => {
            const active = location.pathname === to
            if (comingSoon) {
              return (
                <li key={to} onClick={onClose} className="cursor-pointer">
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium opacity-40 text-light-muted dark:text-dark-muted select-none">
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
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-[14px] text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'bg-primary text-white font-semibold shadow-sm'
                      : 'text-light-muted dark:text-dark-muted hover:bg-primary-light hover:text-primary dark:hover:bg-primary/20 dark:hover:text-white'
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[14px] text-sm font-medium transition-all duration-150 ${
                  location.pathname === '/admin'
                    ? 'bg-primary text-white font-semibold shadow-sm'
                    : 'text-light-muted dark:text-dark-muted hover:bg-primary-light hover:text-primary dark:hover:bg-primary/20 dark:hover:text-white'
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
      <div className="px-3 py-3 border-t border-light-border dark:border-dark-border safe-bottom">
        {/* Online status pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-semibold text-green-700 dark:text-green-400">{onlineUsers.length} Online</span>
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
          className="mt-1 w-full flex items-center gap-3 px-3 py-2.5 rounded-[14px] text-sm font-medium text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
          <motion.div
            key="mobile-drawer"
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <div
              onClick={onClose}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm cursor-pointer"
            />
            
            {/* Sidebar Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="absolute left-0 top-0 h-screen-safe w-60 bg-white dark:bg-dark-card border-r border-light-border dark:border-dark-border flex flex-col safe-top shadow-2xl"
            >
              {sidebarContent}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
