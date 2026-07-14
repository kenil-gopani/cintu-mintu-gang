import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Loader from '../components/common/Loader'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Image as ImageIcon, Mic, Square, Smile, Paperclip,
  ChevronLeft, Check, CheckCheck, MoreVertical, Users, Search, X,
  Bot, MessageCircle, Edit2, Trash2, CornerUpLeft, Plus,
  Heart, ThumbsUp, Laugh, Angry, SmilePlus, Phone, Video
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { chatService, memberService } from '../services/services'
import Avatar from '../components/common/Avatar'
import { format, isSameDay, isToday, isYesterday } from 'date-fns'
import { toast } from 'sonner'
import { useSocket } from '../hooks/useSocket'

// ─── Constants ───────────────────────────────────────────────────
const GANG_CHAT_NAME = 'Cintu Mintu Gang'
const QUICK_EMOJIS  = ['❤️', '😂', '😮', '😢', '🙏', '🔥']
const EMOJI_PANEL   = ['😀','😂','🥰','😎','😭','🥺','🙏','👍','🔥','❤️','🎉','✨','👀','🤦','🤷',
                        '😅','😍','🤩','😤','🥳','💪','👏','🙌','💯','🫡','😜','🤔','😬','🫶','🥂']

// ─── Helper: format date separator ───────────────────────────────
function formatDateSep(date) {
  if (isToday(date))     return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMMM d, yyyy')
}

// ─── AI Chat ─────────────────────────────────────────────────────
const AI_WELCOME = {
  _id: 'ai-welcome',
  role: 'ai',
  text: "👋 Hi! I'm your family AI Assistant. Ask me anything — homework, recipes, travel ideas, coding, planning, or just chat! How can I help the Cintu-Mintu Gang today?",
  createdAt: new Date().toISOString()
}

// ─── Component ───────────────────────────────────────────────────
export default function Chat() {
  const { user }           = useAuth()
  const { socket, onlineUsers } = useSocket()

  // ── Section state (gang | dm:<roomId> | ai) ──
  const [section,     setSection]     = useState('gang')
  const [rooms,       setRooms]       = useState([])
  const [activeRoom,  setActiveRoom]  = useState(null)
  const [messages,    setMessages]    = useState([])
  const [members,     setMembers]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [msgLoading,  setMsgLoading]  = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true) // desktop always open

  // ── Typing ──
  const [typingUsers, setTypingUsers] = useState({})
  const typingRef    = useRef(null)

  // ── Input ──
  const [text,       setText]       = useState('')
  const [mediaFile,  setMediaFile]  = useState(null)
  const [replyTo,    setReplyTo]    = useState(null)
  const [editMsg,    setEditMsg]    = useState(null)
  const [showEmoji,  setShowEmoji]  = useState(false)
  const [contextMenu, setContextMenu] = useState(null) // { msg, x, y }
  const [reactMenu,   setReactMenu]   = useState(null) // { msgId }

  // ── AI ──
  const [aiMessages, setAiMessages] = useState([AI_WELCOME])
  const [aiLoading,  setAiLoading]  = useState(false)
  const [aiText,     setAiText]     = useState('')

  // ── Voice Recording ──
  const [isRecording,   setIsRecording]   = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef(null)
  const timerRef         = useRef(null)

  // ── Refs ──
  const messagesEndRef = useRef(null)
  const fileInputRef   = useRef(null)
  const inputRef       = useRef(null)

  useEffect(() => {
    const loadChat = async () => {
      try {
        // Ensure the permanent Gang Chat exists — safe to fail silently on 404
        await chatService.initGangChat().catch(() => {})

        const [roomsRes, membersRes] = await Promise.all([
          chatService.getRooms(),
          memberService.getAll()
        ])

        const fetchedRooms = roomsRes.data.rooms || []
        const allFetchedMembers = membersRes.data.users || []
        
        // Only allow these 8 users in the DM list
        const allowedEmails = [
          'gopanikenil26@gmail.com',
          'krish.miyani@cintumintugang.com',
          'hasti.miyani@cintumintugang.com',
          'maitri.gopani@cintumintugang.com',
          'krisha.sutariya@cintumintugang.com',
          'harshil.sutariya@cintumintugang.com',
          'het.sheta@cintumintugang.com',
          'rutvi.sheta@cintumintugang.com'
        ]
        const fetchedMembers = allFetchedMembers.filter(m => allowedEmails.includes(m.email))

        setRooms(fetchedRooms)
        setMembers(fetchedMembers)

        // Auto-select gang chat if it exists
        const gang = fetchedRooms.find(r => r.isGroup && r.name === GANG_CHAT_NAME)
        if (gang) { setActiveRoom(gang); setSection('gang') }
      } catch (err) {
        console.error('Chat init error:', err)
        toast.error('Failed to load chat. Please refresh.')
      } finally {
        setLoading(false)
      }
    }
    loadChat()
  }, [])

  // ─────────────────────────────────────────────────────────────
  // Socket: join/leave room + events
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !activeRoom || section === 'ai') return

    socket.emit('join-room', activeRoom._id)
    setMsgLoading(true)
    chatService.getMessages(activeRoom._id).then(r => {
      setMessages(r.data.messages)
      setMsgLoading(false)
    }).catch(() => setMsgLoading(false))

    const onNewMessage = (msg) => {
      if (msg.chatId === activeRoom._id) {
        setMessages(prev => {
          if (prev.find(m => m._id === msg._id)) return prev
          return [...prev, msg]
        })
        if (msg.sender._id !== user._id) {
          chatService.markRead(msg._id).catch(() => {})
          socket.emit('mark-seen', { roomId: activeRoom._id, messageId: msg._id })
        }
      }
      
      // Move room to top of the list and update its lastMessage
      setRooms(prev => {
        const updatedRooms = prev.map(r => r._id === msg.chatId ? { ...r, lastMessage: msg, updatedAt: new Date().toISOString() } : r)
        // Sort rooms by updatedAt descending
        return updatedRooms.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
      })
    }

    const onEdited  = (msg) => setMessages(prev => prev.map(m => m._id === msg._id ? msg : m))
    const onDeleted = ({ _id }) => setMessages(prev => prev.map(m => m._id === _id ? { ...m, deleted: true, text: '' } : m))
    const onReacted = (msg) => setMessages(prev => prev.map(m => m._id === msg._id ? msg : m))
    const onTyping  = ({ userId, isTyping }) =>
      setTypingUsers(prev => ({ ...prev, [activeRoom._id]: isTyping ? userId : null }))
    const onSeen    = ({ messageId, userId }) =>
      setMessages(prev => prev.map(m => m._id === messageId
        ? { ...m, readBy: [...new Set([...(m.readBy || []).map(u => u._id || u), userId])] }
        : m))

    socket.on('new-message',    onNewMessage)
    socket.on('message-edited', onEdited)
    socket.on('message-deleted', onDeleted)
    socket.on('message-reacted', onReacted)
    socket.on('user-typing',    onTyping)
    socket.on('message-seen',   onSeen)

    return () => {
      socket.emit('leave-room', activeRoom._id)
      socket.off('new-message',    onNewMessage)
      socket.off('message-edited', onEdited)
      socket.off('message-deleted', onDeleted)
      socket.off('message-reacted', onReacted)
      socket.off('user-typing',    onTyping)
      socket.off('message-seen',   onSeen)
    }
  }, [socket, activeRoom?._id, section])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingUsers, aiMessages])

  // Close context/react menus on click outside
  useEffect(() => {
    const close = () => { setContextMenu(null); setReactMenu(null) }
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [])

  // ─────────────────────────────────────────────────────────────
  // Section switching helpers
  // ─────────────────────────────────────────────────────────────
  const switchToGang = () => {
    const gang = rooms.find(r => r.isGroup && r.name === GANG_CHAT_NAME)
    setActiveRoom(gang || null)
    setSection('gang')
    setReplyTo(null); setEditMsg(null)
  }

  const switchToAI = () => {
    setSection('ai')
    setActiveRoom(null)
    setReplyTo(null); setEditMsg(null)
  }

  const switchToDM = async (memberId) => {
    try {
      const { data } = await chatService.getOrCreatePrivateRoom(memberId)
      if (!rooms.find(r => r._id === data.room._id)) {
        setRooms(prev => [data.room, ...prev])
      } else {
        setRooms(prev => prev.map(r => r._id === data.room._id ? data.room : r))
      }
      setActiveRoom(data.room)
      setSection(`dm:${data.room._id}`)
      setReplyTo(null); setEditMsg(null)
    } catch { toast.error('Failed to open chat') }
  }

  // ─────────────────────────────────────────────────────────────
  // Typing
  // ─────────────────────────────────────────────────────────────
  const handleTextChange = (e) => {
    const val = e.target.value
    setText(val)
    if (socket && activeRoom) {
      socket.emit('typing', { roomId: activeRoom._id, isTyping: true })
      clearTimeout(typingRef.current)
      typingRef.current = setTimeout(() => {
        socket.emit('typing', { roomId: activeRoom._id, isTyping: false })
      }, 2000)
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Send / Edit
  // ─────────────────────────────────────────────────────────────
  const handleSend = async (e) => {
    e?.preventDefault()
    if (!text.trim() && !mediaFile) return

    if (editMsg) {
      try {
        await chatService.editMessage(editMsg._id, text.trim())
        setEditMsg(null)
        setText('')
      } catch { toast.error('Failed to edit') }
      return
    }

    const fd = new FormData()
    fd.append('text',  text.trim())
    if (mediaFile) fd.append('media', mediaFile)
    if (replyTo)   fd.append('replyTo', replyTo._id)

    setText('')
    setMediaFile(null)
    setReplyTo(null)
    setShowEmoji(false)
    if (socket && activeRoom) socket.emit('typing', { roomId: activeRoom._id, isTyping: false })

    try {
      await chatService.sendMessage(activeRoom._id, fd)
    } catch { toast.error('Failed to send') }
  }

  // ─────────────────────────────────────────────────────────────
  // Delete
  // ─────────────────────────────────────────────────────────────
  const handleDelete = async (msg) => {
    if (!window.confirm('Delete this message?')) return
    try {
      await chatService.deleteMessage(msg._id)
    } catch { toast.error('Failed to delete') }
  }

  // ─────────────────────────────────────────────────────────────
  // React
  // ─────────────────────────────────────────────────────────────
  const handleReact = async (msgId, emoji) => {
    try { await chatService.reactMessage(msgId, emoji) }
    catch { toast.error('Failed to react') }
    setReactMenu(null)
  }

  // ─────────────────────────────────────────────────────────────
  // AI Chat
  // ─────────────────────────────────────────────────────────────
  const handleAiSend = async (e) => {
    e?.preventDefault()
    if (!aiText.trim() || aiLoading) return

    const userMsg = { _id: Date.now(), role: 'user', text: aiText.trim(), createdAt: new Date().toISOString() }
    setAiMessages(prev => [...prev, userMsg])
    setAiText('')
    setAiLoading(true)

    try {
      const { data } = await chatService.sendAiMessage(aiText.trim())
      const aiMsg = { _id: Date.now() + 1, role: 'ai', text: data.reply, createdAt: new Date().toISOString() }
      setAiMessages(prev => [...prev, aiMsg])
    } catch {
      setAiMessages(prev => [...prev, { _id: Date.now() + 1, role: 'ai', text: 'Sorry, something went wrong. Please try again!', createdAt: new Date().toISOString() }])
    } finally {
      setAiLoading(false)
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Voice Recording
  // ─────────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      const chunks = []
      mediaRecorderRef.current = mr
      mr.ondataavailable = e => chunks.push(e.data)
      mr.onstop = () => {
        const blob = new File([new Blob(chunks, { type: 'audio/webm' })], 'voice.webm', { type: 'audio/webm' })
        setMediaFile(blob)
      }
      mr.start()
      setIsRecording(true)
      setRecordingTime(0)
      timerRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000)
    } catch { toast.error('Microphone access denied') }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current?.stream?.getTracks()?.forEach(t => t.stop())
    setIsRecording(false)
    clearInterval(timerRef.current)
  }

  // ─────────────────────────────────────────────────────────────
  // Render Helpers
  // ─────────────────────────────────────────────────────────────
  const getRoomName = (room) => {
    if (!room) return ''
    if (room.isGroup) return room.name
    const other = room.participants?.find(p => (p._id || p) !== user._id)
    return other?.nickname || other?.name || 'User'
  }

  const getOtherParticipant = (room) => {
    if (!room || room.isGroup) return null
    return room.participants?.find(p => (p._id || p).toString() !== user._id.toString())
  }

  const isOtherOnline = (room) => {
    if (!room || room.isGroup) return false
    const other = getOtherParticipant(room)
    return other && onlineUsers.includes(other._id || other)
  }

  const getTypingLabel = () => {
    if (!activeRoom || !typingUsers[activeRoom._id]) return null
    const tUser = members.find(m => (m._id || m) === typingUsers[activeRoom._id])
    return tUser ? `${tUser.nickname || tUser.name} is typing...` : 'Typing...'
  }

  // ─────────────────────────────────────────────────────────────
  // Message rendering
  // ─────────────────────────────────────────────────────────────
  const renderMessages = () => {
    const items = []
    let lastDate = null

    messages.forEach((msg, idx) => {
      const date    = new Date(msg.createdAt)
      const dateStr = formatDateSep(date)
      if (dateStr !== lastDate) {
        items.push(
          <div key={`date-${dateStr}-${idx}`} className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-light-border dark:bg-dark-border" />
            <span className="text-[10px] font-bold text-light-muted dark:text-dark-muted px-3 py-1 bg-light-bg dark:bg-dark-bg rounded-full shrink-0">
              {dateStr}
            </span>
            <div className="flex-1 h-px bg-light-border dark:bg-dark-border" />
          </div>
        )
        lastDate = dateStr
      }

      const isMe   = msg.sender?._id === user._id || msg.sender === user._id
      const isSeen = (msg.readBy || []).some(r => (r._id || r).toString() !== user._id.toString())

      items.push(
        <motion.div
          key={msg._id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className={`flex gap-2 mb-1.5 group ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
        >
          {/* Avatar (group only) */}
          {!isMe && activeRoom?.isGroup && (
            <Avatar src={msg.sender?.avatar} name={msg.sender?.name} size={28} className="self-end mb-1 shrink-0" />
          )}

          <div className={`flex flex-col max-w-[72%] md:max-w-[58%] ${isMe ? 'items-end' : 'items-start'}`}>
            {/* Sender name in group */}
            {!isMe && activeRoom?.isGroup && (
              <span className="text-[10px] font-bold text-primary mb-0.5 ml-1">
                {msg.sender?.nickname || msg.sender?.name}
              </span>
            )}

            {/* Reply preview */}
            {msg.replyTo && !msg.deleted && (
              <div className={`text-[10px] font-semibold px-3 py-1.5 rounded-xl mb-1 border-l-2 border-primary max-w-full truncate
                ${isMe ? 'bg-primary/5 text-primary/70' : 'bg-light-bg dark:bg-dark-bg text-light-muted dark:text-dark-muted'}`}>
                ↩ {msg.replyTo.sender?.nickname || msg.replyTo.sender?.name}: {msg.replyTo.text || '📎 Media'}
              </div>
            )}

            {/* Bubble */}
            <div
              className={`relative px-3.5 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed
                ${msg.deleted
                  ? 'italic text-light-muted dark:text-dark-muted bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border'
                  : isMe
                    ? 'bg-primary text-white rounded-br-sm'
                    : 'bg-white dark:bg-dark-card text-light-text dark:text-dark-text rounded-bl-sm'
                }`}
              onContextMenu={(e) => {
                if (msg.deleted) return
                e.preventDefault()
                setContextMenu({ msg, x: e.clientX, y: e.clientY })
              }}
            >
              {msg.deleted ? (
                <span className="flex items-center gap-1.5"><Trash2 size={12} /> Message deleted</span>
              ) : (
                <>
                  {msg.type === 'image' && msg.mediaUrl && (
                    <img
                      src={msg.mediaUrl}
                      alt=""
                      className="max-w-full rounded-xl mb-1.5 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(msg.mediaUrl, '_blank')}
                      loading="lazy"
                    />
                  )}
                  {msg.type === 'audio' && msg.mediaUrl && (
                    <audio 
                      src={msg.mediaUrl} 
                      controls 
                      className="w-[240px] max-w-full h-10 mb-1 rounded-full bg-black/5 dark:bg-white/10"
                      controlsList="nodownload noplaybackrate"
                    />
                  )}
                  {msg.text && (
                    <p className={`break-words whitespace-pre-wrap ${isMe ? 'text-white' : 'text-light-text dark:text-dark-text'}`}>
                      {msg.text}
                    </p>
                  )}
                  {msg.edited && (
                    <span className={`text-[9px] font-medium ${isMe ? 'text-white/50' : 'text-light-muted dark:text-dark-muted'}`}> (edited)</span>
                  )}
                </>
              )}

              {/* Timestamp + seen */}
              <div className={`flex items-center gap-1 mt-1 justify-end ${isMe ? 'text-white/60' : 'text-light-muted dark:text-dark-muted'}`}>
                <span className="text-[9px] font-bold">{format(new Date(msg.createdAt), 'h:mm a')}</span>
                {isMe && !msg.deleted && (
                  isSeen
                    ? <CheckCheck size={11} className="text-blue-300" />
                    : <Check size={11} />
                )}
              </div>

              {/* Reactions */}
              {msg.reactions?.length > 0 && !msg.deleted && (
                <div className="flex flex-wrap gap-0.5 mt-1.5">
                  {Object.entries(
                    msg.reactions.reduce((acc, r) => ({ ...acc, [r.emoji]: (acc[r.emoji] || 0) + 1 }), {})
                  ).map(([emoji, count]) => (
                    <button
                      key={emoji}
                      onClick={() => handleReact(msg._id, emoji)}
                      className="text-xs px-1.5 py-0.5 rounded-full bg-white/20 dark:bg-dark-bg hover:bg-white/30 transition-colors"
                    >
                      {emoji} {count > 1 ? count : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick actions on hover */}
            {!msg.deleted && (
              <div className={`flex items-center gap-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'flex-row-reverse' : ''}`}>
                <button
                  onClick={(e) => { e.stopPropagation(); setReactMenu(reactMenu?.msgId === msg._id ? null : { msgId: msg._id }) }}
                  className="p-1 rounded-full hover:bg-light-bg dark:hover:bg-dark-bg text-light-muted dark:text-dark-muted"
                  title="React"
                >
                  <SmilePlus size={13} />
                </button>
                <button
                  onClick={() => { setReplyTo(msg); inputRef.current?.focus() }}
                  className="p-1 rounded-full hover:bg-light-bg dark:hover:bg-dark-bg text-light-muted dark:text-dark-muted"
                  title="Reply"
                >
                  <CornerUpLeft size={13} />
                </button>
                {isMe && (
                  <>
                    <button
                      onClick={() => { setEditMsg(msg); setText(msg.text); inputRef.current?.focus() }}
                      className="p-1 rounded-full hover:bg-light-bg dark:hover:bg-dark-bg text-light-muted dark:text-dark-muted"
                      title="Edit"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(msg)}
                      className="p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
                {/* Quick emoji pop-up */}
                <AnimatePresence>
                  {reactMenu?.msgId === msg._id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: 8 }}
                      onClick={e => e.stopPropagation()}
                      className="absolute bottom-full mb-1 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-xl p-2 flex gap-1 z-50"
                    >
                      {QUICK_EMOJIS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => handleReact(msg._id, emoji)}
                          className="text-xl hover:scale-125 transition-transform p-1"
                        >
                          {emoji}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      )
    })
    return items
  }

  // ─────────────────────────────────────────────────────────────
  // Chat Window Header
  // ─────────────────────────────────────────────────────────────
  const renderHeader = () => {
    if (section === 'ai') {
      return (
        <div className="h-14 border-b border-light-border dark:border-dark-border bg-white dark:bg-dark-card flex items-center px-4 gap-3 shrink-0 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 rounded-xl hover:bg-light-bg dark:hover:bg-dark-bg text-light-muted dark:text-dark-muted">
            <ChevronLeft size={20} />
          </button>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center shadow-sm shrink-0">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-light-text dark:text-dark-text">AI Assistant</h3>
            <p className="text-[10px] text-green-500 font-semibold">Always available ✨</p>
          </div>
        </div>
      )
    }
    if (!activeRoom) return null
    const other   = getOtherParticipant(activeRoom)
    const online  = activeRoom.isGroup ? null : isOtherOnline(activeRoom)
    const typing  = getTypingLabel()

    return (
      <div className="h-14 border-b border-light-border dark:border-dark-border bg-white dark:bg-dark-card flex items-center justify-between px-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 rounded-xl hover:bg-light-bg dark:hover:bg-dark-bg text-light-muted dark:text-dark-muted">
            <ChevronLeft size={20} />
          </button>
          {activeRoom.isGroup ? (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm shrink-0">
              <Users size={16} className="text-white" />
            </div>
          ) : (
            <div className="relative shrink-0">
              <Avatar src={other?.avatar} name={other?.name} size={36} />
              {online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-white dark:border-dark-card rounded-full" />}
            </div>
          )}
          <div>
            <h3 className="font-bold text-sm text-light-text dark:text-dark-text">{getRoomName(activeRoom)}</h3>
            <p className={`text-[10px] font-semibold ${typing ? 'text-primary animate-pulse' : online ? 'text-green-500' : 'text-light-muted dark:text-dark-muted'}`}>
              {typing || (activeRoom.isGroup ? `${activeRoom.participants?.length} members` : online ? 'Online' : 'Offline')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // Sidebar Panel (left)
  // ─────────────────────────────────────────────────────────────
  const renderSidebar = () => {
    const gangRoom = rooms.find(r => r.isGroup && r.name === GANG_CHAT_NAME)
    const dmRooms  = rooms.filter(r => !r.isGroup)

    return (
      <div className={`
        flex flex-col bg-white dark:bg-dark-card border-r border-light-border dark:border-dark-border
        absolute inset-0 z-20 md:relative md:inset-auto md:z-auto md:w-72 lg:w-80 shrink-0
        transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header */}
        <div className="px-4 py-4 border-b border-light-border dark:border-dark-border flex items-center justify-between shrink-0">
          <h2 className="text-lg font-black text-light-text dark:text-dark-text">Messages</h2>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1.5 rounded-xl hover:bg-light-bg dark:hover:bg-dark-bg text-light-muted dark:text-dark-muted">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto sidebar-scroll py-2">
          {/* Gang Chat */}
          <div className="px-3 mb-1">
            <p className="text-[9px] font-black uppercase tracking-wider text-light-muted dark:text-dark-muted px-2 mb-1">Group</p>
            <button
              onClick={() => { switchToGang(); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[14px] text-left transition-all
                ${section === 'gang'
                  ? 'bg-primary text-white'
                  : 'hover:bg-light-bg dark:hover:bg-dark-bg text-light-text dark:text-dark-text'
                }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${section === 'gang' ? 'bg-white/20' : 'bg-gradient-to-br from-primary to-accent'}`}>
                <span className="text-lg">💬</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm truncate ${section === 'gang' ? 'text-white' : ''}`}>Gang Chat</p>
                <p className={`text-[10px] truncate ${section === 'gang' ? 'text-white/70' : 'text-light-muted dark:text-dark-muted'}`}>
                  {gangRoom?.lastMessage?.text || 'Say something 👋'}
                </p>
              </div>
            </button>
          </div>

          {/* AI Assistant */}
          <div className="px-3 mb-1">
            <button
              onClick={() => { switchToAI(); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[14px] text-left transition-all
                ${section === 'ai'
                  ? 'bg-violet-600 text-white'
                  : 'hover:bg-light-bg dark:hover:bg-dark-bg text-light-text dark:text-dark-text'
                }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${section === 'ai' ? 'bg-white/20' : 'bg-gradient-to-br from-violet-500 to-primary'}`}>
                <Bot size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm truncate ${section === 'ai' ? 'text-white' : ''}`}>AI Assistant</p>
                <p className={`text-[10px] truncate ${section === 'ai' ? 'text-white/70' : 'text-light-muted dark:text-dark-muted'}`}>Ask me anything ✨</p>
              </div>
            </button>
          </div>

          {/* DMs */}
          <div className="px-3 mt-3">
            <p className="text-[9px] font-black uppercase tracking-wider text-light-muted dark:text-dark-muted px-2 mb-1">Direct Messages</p>
            {members.filter(m => m._id !== user._id).map(m => {
              const dmRoom     = dmRooms.find(r => r.participants?.some(p => (p._id || p).toString() === m._id.toString()))
              const isOnline   = onlineUsers.includes(m._id)
              const isActive   = dmRoom && section === `dm:${dmRoom._id}`
              return (
                <button
                  key={m._id}
                  onClick={() => { switchToDM(m._id); setSidebarOpen(false) }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[14px] text-left transition-all mb-0.5
                    ${isActive
                      ? 'bg-primary text-white'
                      : 'hover:bg-light-bg dark:hover:bg-dark-bg text-light-text dark:text-dark-text'
                    }`}
                >
                  <div className="relative shrink-0">
                    <Avatar src={m.avatar} name={m.name} size={36} />
                    {isOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-white dark:border-dark-card rounded-full" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm truncate ${isActive ? 'text-white' : ''}`}>{m.nickname || m.name}</p>
                    <p className={`text-[10px] truncate ${isActive ? 'text-white/70' : isOnline ? 'text-green-500' : 'text-light-muted dark:text-dark-muted'}`}>
                      {dmRoom?.lastMessage?.text || (isOnline ? 'Online' : 'Offline')}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // Input area
  // ─────────────────────────────────────────────────────────────
  const renderInput = () => {
    if (section === 'ai') {
      return (
        <div className="p-3 md:p-4 border-t border-light-border dark:border-dark-border bg-white dark:bg-dark-card shrink-0">
          <form onSubmit={handleAiSend} className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-light-bg dark:bg-dark-bg rounded-2xl px-4 py-2.5 border border-light-border dark:border-dark-border focus-within:border-primary/50 transition-colors">
              <input
                type="text"
                value={aiText}
                onChange={e => setAiText(e.target.value)}
                placeholder="Ask anything..."
                className="flex-1 bg-transparent outline-none text-sm text-light-text dark:text-dark-text placeholder-light-muted dark:placeholder-dark-muted"
                disabled={aiLoading}
              />
            </div>
            <button
              type="submit"
              disabled={!aiText.trim() || aiLoading}
              className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center disabled:opacity-40 hover:bg-violet-700 transition-colors shadow-sm"
            >
              {aiLoading ? <Loader scale={0.15} /> : <Send size={17} className="ml-0.5" />}
            </button>
          </form>
        </div>
      )
    }

    if (!activeRoom) return null

    return (
      <div className="p-3 md:p-4 border-t border-light-border dark:border-dark-border bg-white dark:bg-dark-card shrink-0 relative">
        {/* Reply / Edit bar */}
        <AnimatePresence>
          {(replyTo || editMsg) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              className="flex items-center gap-2 mb-2 p-2.5 bg-primary/5 border-l-4 border-primary rounded-xl"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-primary mb-0.5">
                  {editMsg ? '✏️ Editing message' : `↩ Replying to ${replyTo?.sender?.nickname || replyTo?.sender?.name}`}
                </p>
                <p className="text-xs text-light-muted dark:text-dark-muted truncate">
                  {editMsg ? editMsg.text : replyTo?.text || '📎 Media'}
                </p>
              </div>
              <button onClick={() => { setReplyTo(null); setEditMsg(null); setText('') }} className="p-1 text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text">
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Media preview */}
        <AnimatePresence>
          {mediaFile && (
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
              className="flex items-center gap-3 mb-2 p-2 bg-light-bg dark:bg-dark-bg rounded-xl"
            >
              {mediaFile.type?.startsWith('image/')
                ? <img src={URL.createObjectURL(mediaFile)} className="w-14 h-14 object-cover rounded-lg" alt="" />
                : <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center text-primary"><Mic size={20} /></div>
              }
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">{mediaFile.name}</p>
                <p className="text-[10px] text-light-muted dark:text-dark-muted">{(mediaFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={() => setMediaFile(null)} className="p-1 text-red-400 hover:text-red-500">
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Emoji picker */}
        <AnimatePresence>
          {showEmoji && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 16 }}
              onClick={e => e.stopPropagation()}
              className="absolute bottom-full left-3 mb-2 bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-light-border dark:border-dark-border p-3 grid grid-cols-6 gap-1 w-64 z-50"
            >
              {EMOJI_PANEL.map(e => (
                <button key={e} onClick={() => { setText(p => p + e) }} className="text-xl hover:bg-light-bg dark:hover:bg-dark-bg rounded-lg p-1 transition-colors">
                  {e}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recording state */}
        {isRecording ? (
          <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 text-red-500 px-3 py-2.5 rounded-2xl">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            <span className="font-bold text-sm flex-1">
              Recording {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
            </span>
            <button onClick={stopRecording} className="p-1.5 bg-red-100 dark:bg-red-900/40 rounded-lg hover:bg-red-200">
              <Square size={16} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <button type="button" onClick={() => { setShowEmoji(p => !p) }} className="p-2 rounded-xl text-light-muted dark:text-dark-muted hover:text-primary hover:bg-primary/10 transition-colors shrink-0">
              <Smile size={20} />
            </button>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 rounded-xl text-light-muted dark:text-dark-muted hover:text-primary hover:bg-primary/10 transition-colors shrink-0">
              <Paperclip size={20} />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*,audio/*" onChange={e => setMediaFile(e.target.files[0])} />

            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={handleTextChange}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder={editMsg ? 'Edit your message...' : 'Type a message...'}
              className="flex-1 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 transition-colors text-light-text dark:text-dark-text placeholder-light-muted dark:placeholder-dark-muted"
            />

            {text.trim() || mediaFile ? (
              <button type="submit" className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-hover shadow-sm transition-colors shrink-0">
                <Send size={17} className="ml-0.5" />
              </button>
            ) : (
              <button type="button" onClick={startRecording} className="w-10 h-10 rounded-xl bg-light-bg dark:bg-dark-bg text-light-muted dark:text-dark-muted flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors shrink-0">
                <Mic size={18} />
              </button>
            )}
          </form>
        )}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // Main Chat window
  // ─────────────────────────────────────────────────────────────
  const renderChatWindow = () => {
    if (section === 'ai') {
      return (
        <div className="flex-1 flex flex-col overflow-hidden">
          {renderHeader()}
          <div className="flex-1 overflow-y-auto sidebar-scroll p-4 space-y-4">
            {aiMessages.map(msg => (
              <div key={msg._id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.role === 'ai' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center shrink-0">
                    <Bot size={16} className="text-white" />
                  </div>
                )}
                <div className={`max-w-[75%] md:max-w-[60%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm
                  ${msg.role === 'user'
                    ? 'bg-primary text-white rounded-br-sm'
                    : 'bg-white dark:bg-dark-card text-light-text dark:text-dark-text rounded-bl-sm border border-light-border dark:border-dark-border'
                  }`}>
                  {msg.text}
                  <p className={`text-[9px] mt-1 font-bold ${msg.role === 'user' ? 'text-white/50 text-right' : 'text-light-muted dark:text-dark-muted'}`}>
                    {format(new Date(msg.createdAt), 'h:mm a')}
                  </p>
                </div>
              </div>
            ))}
            {aiLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center shrink-0">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="px-4 py-3 bg-white dark:bg-dark-card rounded-2xl rounded-bl-sm border border-light-border dark:border-dark-border flex gap-1.5 items-center">
                  <span className="w-2 h-2 bg-light-muted dark:bg-dark-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-light-muted dark:bg-dark-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-light-muted dark:bg-dark-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          {renderInput()}
        </div>
      )
    }

    if (!activeRoom) {
      return (
        <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-light-bg dark:bg-dark-bg text-light-muted dark:text-dark-muted">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 shadow-sm">
            <MessageCircle size={36} />
          </div>
          <h3 className="text-lg font-bold text-light-text dark:text-dark-text mb-1">Cintu-Mintu Messages</h3>
          <p className="text-sm">Select a conversation to start chatting</p>
        </div>
      )
    }

    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderHeader()}

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto sidebar-scroll p-4"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(37,99,235,0.03) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        >
          {msgLoading ? (
            <div className="flex justify-center py-16"><Loader scale={0.35} /></div>
          ) : (
            renderMessages()
          )}

          {/* Typing indicator */}
          {getTypingLabel() && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 mb-2">
              {activeRoom.isGroup && <div className="w-7 h-7 rounded-full bg-light-border dark:bg-dark-border" />}
              <div className="bg-white dark:bg-dark-card rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-light-border dark:border-dark-border flex gap-1.5 items-center">
                <span className="w-2 h-2 bg-light-muted dark:bg-dark-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-light-muted dark:bg-dark-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-light-muted dark:bg-dark-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {renderInput()}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // Root render
  // ─────────────────────────────────────────────────────────────
  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><Loader scale={0.5} /></div>
  }

  return (
    <div className="h-[calc(100dvh-56px)] flex overflow-hidden bg-light-bg dark:bg-dark-bg">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left: sidebar */}
      {renderSidebar()}

      {/* Right: chat window */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile: show open-sidebar button when no sidebar */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden absolute top-14 left-4 z-30 w-9 h-9 bg-white dark:bg-dark-card rounded-xl shadow-md flex items-center justify-center border border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted"
          >
            <MessageCircle size={18} />
          </button>
        )}
        {renderChatWindow()}
      </div>

      {/* Context Menu (right-click) */}
      {createPortal(
        <AnimatePresence>
          {contextMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{ top: contextMenu.y, left: contextMenu.x }}
              onClick={e => e.stopPropagation()}
              className="fixed z-[9999] bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-2xl py-1.5 min-w-[160px]"
            >
              {[
                { icon: CornerUpLeft, label: 'Reply', action: () => { setReplyTo(contextMenu.msg); inputRef.current?.focus(); setContextMenu(null) } },
                contextMenu.msg.sender?._id === user._id && {
                  icon: Edit2, label: 'Edit', action: () => { setEditMsg(contextMenu.msg); setText(contextMenu.msg.text); inputRef.current?.focus(); setContextMenu(null) }
                },
                contextMenu.msg.sender?._id === user._id && {
                  icon: Trash2, label: 'Delete', danger: true, action: () => { handleDelete(contextMenu.msg); setContextMenu(null) }
                },
              ].filter(Boolean).map(item => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors
                    ${item.danger
                      ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                      : 'text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-bg'
                    }`}
                >
                  <item.icon size={15} />
                  {item.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
