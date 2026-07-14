import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Calendar, Image as ImageIcon, MessageCircle, BarChart3, Cake, ShieldAlert, Check, X } from 'lucide-react'
import { notificationService } from '../../services/services'
import { useSocket } from '../../hooks/useSocket'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  
  const { socket } = useSocket()
  const navigate = useNavigate()

  useEffect(() => {
    fetchNotifications()
    
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!socket) return

    const handleNewNotification = (notif) => {
      setNotifications(prev => [notif, ...prev])
      setUnreadCount(prev => prev + 1)
      toast.success(notif.message, { icon: getIcon(notif.type).emoji })
    }
    
    const handleSystemBroadcast = (data) => {
      setNotifications(prev => [{
        _id: Date.now().toString(),
        type: 'system',
        message: `🚨 Admin Broadcast: ${data.title ? data.title + ' - ' : ''}${data.message}`,
        read: false,
        createdAt: new Date()
      }, ...prev])
      setUnreadCount(prev => prev + 1)
      toast.custom((t) => (
        <div className="bg-red-500 text-white p-4 rounded-2xl shadow-xl flex items-start gap-3 max-w-sm">
          <ShieldAlert size={24} className="shrink-0" />
          <div>
            <p className="font-bold text-sm">System Broadcast</p>
            <p className="text-sm mt-1">{data.title ? `${data.title} - ` : ''}{data.message}</p>
          </div>
        </div>
      ))
    }

    socket.on('new-notification', handleNewNotification)
    socket.on('system-broadcast', handleSystemBroadcast)

    return () => {
      socket.off('new-notification', handleNewNotification)
      socket.off('system-broadcast', handleSystemBroadcast)
    }
  }, [socket])

  const fetchNotifications = async () => {
    try {
      const [notifsRes, countRes] = await Promise.all([
        notificationService.getAll(),
        notificationService.getUnreadCount()
      ])
      setNotifications(notifsRes.data.notifications || [])
      setUnreadCount(countRes.data.count || 0)
    } catch {
      // silent
    }
  }

  const markAsRead = async (id, link) => {
    if (link) {
      setIsOpen(false)
      navigate(link)
    }
    const notif = notifications.find(n => n._id === id)
    if (notif && !notif.read) {
      try {
        await notificationService.markAsRead(id)
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
      } catch {}
    }
  }

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {}
  }

  const getIcon = (type) => {
    switch (type) {
      case 'birthday': return { icon: Cake, color: 'text-pink-500 bg-pink-100', emoji: '🎂' }
      case 'event': return { icon: Calendar, color: 'text-blue-500 bg-blue-100', emoji: '📅' }
      case 'memory': return { icon: ImageIcon, color: 'text-primary bg-primary', emoji: '📸' }
      case 'poll': return { icon: BarChart3, color: 'text-secondary bg-secondary', emoji: '📊' }
      case 'message': return { icon: MessageCircle, color: 'text-green-500 bg-green-100', emoji: '💬' }
      case 'system': return { icon: ShieldAlert, color: 'text-red-500 bg-red-100', emoji: '🚨' }
      default: return { icon: Bell, color: 'text-gray-500 bg-gray-100', emoji: '🔔' }
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors focus:outline-none"
      >
        <Bell size={24} className={unreadCount > 0 ? 'text-primary' : ''} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-dark-bg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50 origin-top-right"
          >
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-black/20">
              <h3 className="font-extrabold text-lg flex items-center gap-2">
                Notifications
                {unreadCount > 0 && <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">{unreadCount} New</span>}
              </h3>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-1 transition-colors">
                  <Check size={14} /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto sidebar-scroll bg-white dark:bg-dark-card">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                  <Bell size={40} className="mb-3 opacity-20" />
                  <p className="font-bold text-sm">All caught up!</p>
                  <p className="text-xs">You have no new notifications.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
                  {notifications.map(notif => {
                    const { icon: Icon, color } = getIcon(notif.type)
                    return (
                      <div 
                        key={notif._id} 
                        onClick={() => markAsRead(notif._id, notif.link)}
                        className={`p-4 flex gap-3 cursor-pointer transition-colors ${notif.read ? 'hover:bg-gray-50 dark:hover:bg-white/5 opacity-70' : 'bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${color} shadow-sm`}>
                          <Icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${notif.read ? 'text-gray-600 dark:text-gray-300' : 'text-gray-900 dark:text-white font-bold'}`}>
                            {notif.message}
                          </p>
                          <p className="text-[10px] font-semibold text-gray-400 mt-1 uppercase tracking-wide">
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        {!notif.read && <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0 shadow-sm shadow-primary/50" />}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
