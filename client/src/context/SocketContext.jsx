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

    const token = localStorage.getItem('cmg-token') || sessionStorage.getItem('cmg-token')
    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    socketRef.current = io(serverUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
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

    socket.on('global-new-message', (data) => {
      const { message, roomName } = data
      // Only show toast if we are not actively on the chat page, or we could just always show it 
      // (a quick check: if the user is actively viewing this room, we might not want it, but global toast is fine)
      import('sonner').then(({ toast }) => {
        toast.info(`New message in ${roomName}`, {
          description: message.text || 'Sent an attachment 📎',
          action: { label: 'Reply', onClick: () => window.location.href = '/chat' }
        })
      })
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
