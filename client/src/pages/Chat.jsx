import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, Image as ImageIcon, Mic, Square, Smile, Paperclip, 
  ChevronLeft, Check, CheckCheck, MoreVertical, Plus, Users, Search, X
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { chatService, memberService } from '../services/services'
import Avatar from '../components/common/Avatar'
import { format, isSameDay } from 'date-fns'
import toast from 'react-hot-toast'
import io from 'socket.io-client'

const EMOJIS = ['😀','😂','🥰','😎','😭','🥺','🙏','👍','🔥','❤️','🎉','✨','👀','🤦‍♂️','🤷‍♀️']

export default function Chat() {
  const { user } = useAuth()
  
  // Socket
  const [socket, setSocket] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [typingUsers, setTypingUsers] = useState({}) // { roomId: userId }
  
  // Data State
  const [rooms, setRooms] = useState([])
  const [activeRoom, setActiveRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [members, setMembers] = useState([]) // For new chat modal
  const [loading, setLoading] = useState(true)

  // UI State
  const [showMembers, setShowMembers] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  // Input State
  const [text, setText] = useState('')
  const [mediaFile, setMediaFile] = useState(null)
  
  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false)
  const [audioChunks, setAudioChunks] = useState([])
  const mediaRecorderRef = useRef(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const timerRef = useRef(null)

  // Initialize Socket & Data
  useEffect(() => {
    const token = localStorage.getItem('cmg-token')
    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    const s = io(serverUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })
    setSocket(s)
    
    s.on('connect', () => console.log('✅ Chat socket connected'))
    s.on('connect_error', (e) => console.error('❌ Socket error:', e.message))
    
    chatService.getRooms().then(r => { setRooms(r.data.rooms); setLoading(false) })
    memberService.getAll().then(r => setMembers(r.data.users))

    s.on('online-users', setOnlineUsers)
    
    return () => s.disconnect()
  }, [])

  // Handle Socket Events for Active Room
  useEffect(() => {
    if (!socket || !activeRoom) return

    socket.emit('join-room', activeRoom._id)
    chatService.getMessages(activeRoom._id).then(r => setMessages(r.data.messages))

    const handleNewMessage = (msg) => {
      if (msg.chatId === activeRoom._id) {
        setMessages(prev => [...prev, msg])
        // Mark seen if it's not from us
        if (msg.sender._id !== user._id) {
          chatService.markRead(msg._id)
          socket.emit('mark-seen', { roomId: activeRoom._id, messageId: msg._id })
        }
      }
      // Update rooms list last message
      setRooms(prev => prev.map(r => r._id === msg.chatId ? { ...r, lastMessage: msg } : r))
    }

    const handleTyping = ({ userId, isTyping }) => {
      setTypingUsers(prev => ({ ...prev, [activeRoom._id]: isTyping ? userId : null }))
    }

    const handleSeen = ({ messageId, userId }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, readBy: [...new Set([...m.readBy, userId])] } : m))
    }

    socket.on('new-message', handleNewMessage)
    socket.on('user-typing', handleTyping)
    socket.on('message-seen', handleSeen)

    return () => {
      socket.emit('leave-room', activeRoom._id)
      socket.off('new-message', handleNewMessage)
      socket.off('user-typing', handleTyping)
      socket.off('message-seen', handleSeen)
    }
  }, [socket, activeRoom?._id])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingUsers])

  // Typing debounce
  let typingTimeout = null
  const handleTyping = (e) => {
    setText(e.target.value)
    if (socket && activeRoom) {
      socket.emit('typing', { roomId: activeRoom._id, isTyping: true })
      clearTimeout(typingTimeout)
      typingTimeout = setTimeout(() => {
        socket.emit('typing', { roomId: activeRoom._id, isTyping: false })
      }, 2000)
    }
  }

  // --- Voice Recording ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      const chunks = []
      
      mr.ondataavailable = e => chunks.push(e.data)
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const file = new File([blob], 'voicenote.webm', { type: 'audio/webm' })
        sendMediaMessage(file, 'audio')
      }
      
      mr.start()
      setIsRecording(true)
      setRecordingTime(0)
      timerRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000)
    } catch { toast.error('Microphone access denied') }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop())
    setIsRecording(false)
    clearInterval(timerRef.current)
  }

  // --- Send Messages ---
  const handleSend = async (e) => {
    e.preventDefault()
    if (!text.trim() && !mediaFile) return
    
    if (mediaFile) {
      const type = mediaFile.type.startsWith('image/') ? 'image' : 'audio'
      await sendMediaMessage(mediaFile, type, text)
      setMediaFile(null)
    } else {
      try {
        await chatService.sendMessage(activeRoom._id, { text })
      } catch { toast.error('Failed to send') }
    }
    setText('')
    setShowEmoji(false)
    socket.emit('typing', { roomId: activeRoom._id, isTyping: false })
  }

  const sendMediaMessage = async (file, type, caption = '') => {
    const fd = new FormData()
    fd.append('media', file)
    fd.append('type', type)
    if (caption) fd.append('text', caption)
    
    const toastId = toast.loading('Sending...')
    try {
      await chatService.sendMessage(activeRoom._id, fd)
      toast.success('Sent', { id: toastId })
    } catch { toast.error('Failed to send media', { id: toastId }) }
  }

  // --- Room Creation ---
  const startPrivateChat = async (userId) => {
    try {
      const { data } = await chatService.getOrCreatePrivateRoom(userId)
      if (!rooms.find(r => r._id === data.room._id)) setRooms(prev => [data.room, ...prev])
      setActiveRoom(data.room)
      setShowMembers(false)
    } catch { toast.error('Failed to start chat') }
  }


  // --- Render Helpers ---
  const getRoomName = (room) => {
    if (room.isGroup) return room.name
    const other = room.participants.find(p => p._id !== user._id)
    return other?.nickname || other?.name || 'User'
  }
  
  const getRoomAvatar = (room) => {
    if (room.isGroup) return <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md"><Users size={20}/></div>
    const other = room.participants.find(p => p._id !== user._id)
    const isOnline = onlineUsers.includes(other?._id)
    return (
      <div className="relative">
        <Avatar src={other?.avatar} name={other?.name} size={48} />
        {isOnline && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-dark-card rounded-full" />}
      </div>
    )
  }

  const renderMessageGroups = () => {
    let lastDate = null
    const groups = []
    
    messages.forEach(msg => {
      const date = new Date(msg.createdAt)
      const dateStr = isSameDay(date, new Date()) ? 'Today' : format(date, 'MMMM d, yyyy')
      if (dateStr !== lastDate) {
        groups.push(<div key={dateStr} className="text-center my-6"><span className="bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 text-[10px] font-bold px-3 py-1 rounded-full">{dateStr}</span></div>)
        lastDate = dateStr
      }
      
      const isMe = msg.sender._id === user._id
      const isSeen = msg.readBy.some(id => id !== user._id)

      groups.push(
        <motion.div key={msg._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4`}>
          {!isMe && activeRoom.isGroup && <Avatar src={msg.sender.avatar} name={msg.sender.name} size={28} className="mr-2 self-end mb-1" />}
          
          <div className={`max-w-[75%] md:max-w-[60%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
            {!isMe && activeRoom.isGroup && <span className="text-[10px] font-bold text-gray-500 ml-1 mb-1">{msg.sender.nickname || msg.sender.name}</span>}
            
            <div className={`relative px-4 py-2.5 rounded-2xl shadow-sm ${isMe ? 'bg-gradient-warm text-white rounded-br-sm' : 'bg-white dark:bg-dark-card rounded-bl-sm'}`}>
              
              {msg.type === 'image' && <img src={msg.mediaUrl} alt="" className="max-w-full rounded-xl mb-2 cursor-pointer hover:opacity-90" onClick={()=>window.open(msg.mediaUrl)} />}
              
              {msg.type === 'audio' && (
                <div className="flex items-center gap-2 mb-1 w-48">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isMe ? 'bg-white/20' : 'bg-coral/10 text-coral'}`}><Mic size={18}/></div>
                  <audio src={msg.mediaUrl} controls className={`h-8 w-full ${isMe ? 'invert sepia saturate-0 hue-rotate-180 brightness-200' : ''}`} />
                </div>
              )}

              {msg.text && <p className={`text-[15px] leading-relaxed break-words ${isMe ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>{msg.text}</p>}
              
              <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                <span className="text-[9px] font-bold">{format(new Date(msg.createdAt), 'h:mm a')}</span>
                {isMe && (isSeen ? <CheckCheck size={12} className="text-blue-300" /> : <Check size={12} />)}
              </div>
            </div>
          </div>
        </motion.div>
      )
    })
    return groups
  }

  return (
    <div className="page-container h-[calc(100vh-80px)] flex flex-col p-0 md:p-4 overflow-hidden bg-gray-50 dark:bg-dark-bg">
      <div className="flex-1 bg-white dark:bg-dark-card md:rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 flex overflow-hidden relative">
        
        {/* --- SIDEBAR (Conversations List) --- */}
        <div className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-gray-100 dark:border-gray-800 ${activeRoom ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-black/20">
            <h2 className="text-2xl font-extrabold gradient-text">Messages</h2>
            <button onClick={() => setShowMembers(true)} className="btn-icon bg-coral/10 text-coral hover:bg-coral hover:text-white"><Plus size={20} /></button>
          </div>
          
          <div className="p-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search chats..." className="w-full bg-gray-100 dark:bg-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium outline-none border border-transparent focus:border-coral/50 transition-colors" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto sidebar-scroll">
            {loading ? <div className="p-8 text-center text-gray-400"><div className="w-6 h-6 border-2 border-coral border-t-transparent rounded-full animate-spin mx-auto"/></div> : 
             rooms.length === 0 ? <div className="p-8 text-center text-gray-400 font-bold text-sm">No conversations yet.<br/>Start a new chat!</div> :
             rooms.map(room => {
               const isActive = activeRoom?._id === room._id
               return (
                 <div key={room._id} onClick={() => setActiveRoom(room)} className={`flex items-center gap-4 p-3 mx-2 rounded-2xl cursor-pointer transition-all ${isActive ? 'bg-gradient-warm text-white shadow-md' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                   {getRoomAvatar(room)}
                   <div className="flex-1 min-w-0">
                     <div className="flex justify-between items-center mb-0.5">
                       <h3 className={`font-bold text-sm truncate ${isActive ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{getRoomName(room)}</h3>
                       {room.lastMessage && <span className={`text-[10px] font-bold ${isActive ? 'text-white/80' : 'text-gray-400'}`}>{format(new Date(room.lastMessage.createdAt), 'h:mm a')}</span>}
                     </div>
                     <p className={`text-xs truncate font-medium ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                       {room.lastMessage ? (room.lastMessage.type !== 'text' ? `📎 ${room.lastMessage.type}` : room.lastMessage.text) : 'Say hi! 👋'}
                     </p>
                   </div>
                 </div>
               )
             })}
          </div>
        </div>

        {/* --- MAIN CHAT WINDOW --- */}
        {activeRoom ? (
          <div className={`flex-1 flex flex-col bg-[#F8F9FA] dark:bg-[#0A0A0A] ${!activeRoom ? 'hidden md:flex' : 'flex'}`}>
            
            {/* Chat Header */}
            <div className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-card flex items-center justify-between px-4 shadow-sm z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveRoom(null)} className="md:hidden btn-icon -ml-2"><ChevronLeft size={24} /></button>
                {getRoomAvatar(activeRoom)}
                <div>
                  <h3 className="font-extrabold text-sm">{getRoomName(activeRoom)}</h3>
                  {!activeRoom.isGroup && (
                    <p className="text-xs font-bold text-gray-500">
                      {typingUsers[activeRoom._id] ? <span className="text-coral animate-pulse">Typing...</span> : 
                       (onlineUsers.includes(activeRoom.participants.find(p=>p._id!==user._id)?._id) ? <span className="text-green-500">Online</span> : 'Offline')}
                    </p>
                  )}
                </div>
              </div>
              <button className="btn-icon text-gray-400"><MoreVertical size={20} /></button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 sidebar-scroll" style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px', backgroundPosition: 'center' }}>
              {renderMessageGroups()}
              {typingUsers[activeRoom._id] && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-start mb-4">
                  <div className="bg-white dark:bg-dark-card rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 md:p-4 bg-white dark:bg-dark-card border-t border-gray-200 dark:border-gray-800 relative">
              {/* Media Preview */}
              <AnimatePresence>
                {mediaFile && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full left-4 mb-2 p-2 bg-white dark:bg-dark-card rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                    {mediaFile.type.startsWith('image/') ? <img src={URL.createObjectURL(mediaFile)} className="w-16 h-16 object-cover rounded-lg" /> : <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center"><Paperclip /></div>}
                    <div className="flex-1 min-w-[150px]">
                      <p className="text-xs font-bold truncate">{mediaFile.name}</p>
                      <p className="text-[10px] text-gray-500">{(mediaFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button onClick={() => setMediaFile(null)} className="btn-icon text-red-500 bg-red-50"><X size={16}/></button>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Emoji Picker Fake UI */}
              <AnimatePresence>
                {showEmoji && (
                  <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="absolute bottom-full left-4 mb-2 bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-3 grid grid-cols-5 gap-2 w-64 z-50">
                    {EMOJIS.map(e => (
                      <button key={e} onClick={() => { setText(p => p + e); setShowEmoji(false) }} className="text-2xl hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg p-1 transition-colors">{e}</button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {isRecording ? (
                <div className="flex items-center gap-4 bg-red-50 dark:bg-red-900/20 text-red-500 p-2 md:p-3 rounded-full">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                  <span className="font-bold flex-1">Recording {Math.floor(recordingTime/60)}:{(recordingTime%60).toString().padStart(2, '0')}</span>
                  <button onClick={stopRecording} className="btn-icon bg-red-100 dark:bg-red-900/40 hover:bg-red-200"><Square size={18}/></button>
                </div>
              ) : (
                <form onSubmit={handleSend} className="flex items-center gap-2">
                  <button type="button" onClick={() => setShowEmoji(!showEmoji)} className="btn-icon text-gray-400 hover:text-coral"><Smile size={22} /></button>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-icon text-gray-400 hover:text-coral"><Paperclip size={22} /></button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={e => setMediaFile(e.target.files[0])} />
                  
                  <input 
                    type="text" 
                    value={text} 
                    onChange={handleTyping}
                    placeholder="Type a message..." 
                    className="flex-1 bg-gray-100 dark:bg-white/5 border-none rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-coral/20 outline-none transition-shadow"
                  />
                  
                  {text.trim() || mediaFile ? (
                    <button type="submit" className="w-12 h-12 rounded-full bg-coral text-white flex items-center justify-center hover:bg-coral-dark shadow-lg shadow-coral/30 transition-transform active:scale-95"><Send size={20} className="ml-1" /></button>
                  ) : (
                    <button type="button" onClick={startRecording} className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 flex items-center justify-center hover:bg-coral/10 hover:text-coral transition-colors active:scale-95"><Mic size={22} /></button>
                  )}
                </form>
              )}
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-[#F8F9FA] dark:bg-[#0A0A0A] text-gray-400">
            <div className="w-24 h-24 bg-coral/10 rounded-full flex items-center justify-center text-coral mb-4"><Send size={40} className="ml-2" /></div>
            <h2 className="text-xl font-extrabold text-gray-800 dark:text-gray-200 mb-2">Cintu-Mintu Messages</h2>
            <p className="text-sm font-semibold">Select a conversation or start a new one to chat.</p>
            <p className="text-[10px] mt-4 opacity-50 font-bold uppercase tracking-widest">End-to-End Family Encryption</p>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <AnimatePresence>
        {showMembers && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="card w-full max-w-sm p-0 overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-black/20">
                <h3 className="font-extrabold text-lg">New Chat</h3>
                <button onClick={() => setShowMembers(false)} className="btn-icon"><X size={18}/></button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-2">
                {members.filter(m => m._id !== user._id).map(m => (
                  <div key={m._id} onClick={() => startPrivateChat(m._id)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer transition-colors">
                    <Avatar src={m.avatar} name={m.name} size={40} />
                    <div>
                      <p className="font-bold text-sm">{m.nickname || m.name}</p>
                      <p className="text-xs text-gray-500 font-semibold">{onlineUsers.includes(m._id) ? <span className="text-green-500">Online</span> : 'Offline'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
