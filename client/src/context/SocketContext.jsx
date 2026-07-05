import { createContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../hooks/useAuth'

export const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { user } = useAuth()
  const socketRef = useRef(null)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [messages, setMessages] = useState([])
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      return
    }

    const token = localStorage.getItem('cmg-token')
    socketRef.current = io('/', {
      auth: { token },
      transports: ['websocket'],
    })

    const socket = socketRef.current

    socket.on('connect', () => {
      console.log('🔌 Socket connected')
    })

    socket.on('online-users', (users) => setOnlineUsers(users))

    socket.on('new-message', (msg) => {
      setMessages(prev => [...prev, msg])
    })

    socket.on('new-notification', (notif) => {
      setNotifications(prev => [notif, ...prev])
      setUnreadCount(prev => prev + 1)
    })

    socket.on('user-typing', ({ userId, isTyping }) => {
      // handled in ChatWindow
    })

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected')
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [user])

  const sendMessage = (data) => {
    socketRef.current?.emit('send-message', data)
  }

  const sendTyping = (isTyping) => {
    socketRef.current?.emit('typing', { isTyping })
  }

  const markNotificationsRead = () => setUnreadCount(0)

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      onlineUsers,
      messages,
      setMessages,
      notifications,
      setNotifications,
      unreadCount,
      markNotificationsRead,
      sendMessage,
      sendTyping,
    }}>
      {children}
    </SocketContext.Provider>
  )
}
