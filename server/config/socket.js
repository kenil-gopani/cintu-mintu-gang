const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const Message = require('../models/Message')
const Notification = require('../models/Notification')

let io

function init(server) {
  const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000']
  if (process.env.CLIENT_URL) {
    allowedOrigins.push(process.env.CLIENT_URL.replace(/\/$/, ''))
  }

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
          callback(null, true)
        } else {
          callback(new Error('Socket CORS blocked'))
        }
      },
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  // Auth middleware for sockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token
      if (!token) return next(new Error('Authentication error'))
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.id).select('-password')
      if (!user) return next(new Error('User not found'))
      socket.user = user
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  // Track online users: Map<userId, socketId>
  const onlineMap = new Map()

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString()
    onlineMap.set(userId, socket.id)
    console.log(`🟢 ${socket.user.name} connected`)

    // Broadcast updated online list
    const broadcastOnline = () => {
      io.emit('online-users', Array.from(onlineMap.keys()))
    }
    broadcastOnline()

    // === Chat Rooms ===
    socket.on('join-room', (roomId) => {
      socket.join(roomId)
      console.log(`${socket.user.name} joined room ${roomId}`)
    })

    socket.on('leave-room', (roomId) => {
      socket.leave(roomId)
    })

    // === Typing ===
    socket.on('typing', ({ roomId, isTyping }) => {
      socket.to(roomId).emit('user-typing', { userId, isTyping })
    })

    // === Read Receipts ===
    socket.on('mark-seen', ({ roomId, messageId }) => {
      socket.to(roomId).emit('message-seen', { messageId, userId })
    })

    // === Birthday wish ===
    socket.on('send-wish', async ({ toUserId, fromName }) => {
      try {
        const notif = await Notification.create({
          recipient: toUserId,
          type:      'wish',
          message:   `🎂 ${fromName} wished you a Happy Birthday!`,
        })
        const targetSocket = onlineMap.get(toUserId)
        if (targetSocket) {
          io.to(targetSocket).emit('new-notification', notif)
        }
      } catch {}
    })

    // === Disconnect ===
    socket.on('disconnect', () => {
      onlineMap.delete(userId)
      broadcastOnline()
      User.findByIdAndUpdate(userId, { lastSeen: new Date() }).exec()
      console.log(`🔴 ${socket.user.name} disconnected`)
    })
  })

  return io
}

function getIo() { return io }

module.exports = { init, getIo }
