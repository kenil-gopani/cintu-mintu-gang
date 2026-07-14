const Message  = require('../models/Message')
const ChatRoom = require('../models/ChatRoom')
const User     = require('../models/User')

// ── helpers ──────────────────────────────────────────────────────
const getIo = () => require('../config/socket').getIo()

// ── GET /api/chat/rooms ──────────────────────────────────────────
exports.getRooms = async (req, res) => {
  try {
    const rooms = await ChatRoom.find({ participants: req.user._id })
      .populate('participants', 'name nickname avatar lastSeen')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'name nickname avatar' }
      })
      .sort({ updatedAt: -1 })
    res.json({ rooms })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

// ── POST /api/chat/gang-init ──────────────────────────────────────
// Creates the permanent Gang Chat with ALL users if it doesn't exist yet.
// Safe to call multiple times — idempotent.
exports.initGangChat = async (req, res) => {
  try {
    const GANG_CHAT_NAME = 'Cintu Mintu Gang'

    // Find all active users
    const allUsers = await User.find({ isActive: true }).select('_id')
    const allUserIds = allUsers.map(u => u._id.toString())

    // Look for existing gang chat
    let gangRoom = await ChatRoom.findOne({ isGroup: true, name: GANG_CHAT_NAME })
      .populate('participants', 'name nickname avatar lastSeen')
      .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'name nickname avatar' } })

    if (!gangRoom) {
      // Create it fresh with all users
      gangRoom = await ChatRoom.create({
        isGroup:      true,
        name:         GANG_CHAT_NAME,
        participants: allUserIds,
      })
      await gangRoom.populate('participants', 'name nickname avatar lastSeen')
    } else {
      // Ensure any new users are added as participants
      const existingIds = gangRoom.participants.map(p => (p._id || p).toString())
      const missing     = allUserIds.filter(id => !existingIds.includes(id))
      if (missing.length > 0) {
        gangRoom.participants.push(...missing)
        await gangRoom.save()
        await gangRoom.populate('participants', 'name nickname avatar lastSeen')
      }
    }

    res.json({ room: gangRoom })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

// ── POST /api/chat/room/private/:userId ──────────────────────────
exports.getOrCreatePrivateRoom = async (req, res) => {
  try {
    const otherUserId = req.params.userId
    let room = await ChatRoom.findOne({
      isGroup: false,
      participants: { $all: [req.user._id, otherUserId], $size: 2 }
    }).populate('participants', 'name nickname avatar lastSeen')

    if (!room) {
      room = await ChatRoom.create({
        isGroup: false,
        participants: [req.user._id, otherUserId],
        unreadCounts: { [req.user._id]: 0, [otherUserId]: 0 }
      })
      await room.populate('participants', 'name nickname avatar lastSeen')
    }
    res.json({ room })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

// ── POST /api/chat/room/group ────────────────────────────────────
exports.createGroupRoom = async (req, res) => {
  try {
    const { name, participants } = req.body
    if (!name || !participants || participants.length === 0)
      return res.status(400).json({ message: 'Name and participants required' })

    const allParticipants = [...new Set([...participants, req.user._id.toString()])]
    const unreadCounts = {}
    allParticipants.forEach(p => unreadCounts[p] = 0)

    const room = await ChatRoom.create({ isGroup: true, name, participants: allParticipants, unreadCounts })
    await room.populate('participants', 'name nickname avatar lastSeen')
    res.status(201).json({ room })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

// ── GET /api/chat/room/:roomId/messages ──────────────────────────
exports.getMessages = async (req, res) => {
  try {
    // Verify user is participant
    const room = await ChatRoom.findOne({ _id: req.params.roomId, participants: req.user._id })
    if (!room) return res.status(403).json({ message: 'Access denied' })

    const messages = await Message.find({ chatId: req.params.roomId, deleted: { $ne: true } })
      .populate('sender', 'name nickname avatar')
      .populate('readBy', 'name nickname avatar')
      .populate({ path: 'replyTo', populate: { path: 'sender', select: 'name nickname avatar' } })
      .sort({ createdAt: 1 })
      .limit(200)
    res.json({ messages })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

// ── POST /api/chat/room/:roomId/message ─────────────────────────
exports.sendMessage = async (req, res) => {
  try {
    const room = await ChatRoom.findOne({ _id: req.params.roomId, participants: req.user._id })
    if (!room) return res.status(403).json({ message: 'Access denied' })

    const { text, type = 'text', replyTo } = req.body
    let mediaUrl = ''
    if (req.file) mediaUrl = req.file.path

    if (!text?.trim() && !mediaUrl)
      return res.status(400).json({ message: 'Message cannot be empty' })

    const msgData = {
      chatId:   req.params.roomId,
      sender:   req.user._id,
      text:     text ? text.trim() : '',
      type:     req.file ? (req.file.mimetype.startsWith('image/') ? 'image' : 'audio') : type,
      mediaUrl,
      readBy:   [req.user._id],
    }
    if (replyTo) msgData.replyTo = replyTo

    const msg = await Message.create(msgData)
    await msg.populate('sender', 'name nickname avatar')
    await msg.populate('readBy', 'name nickname avatar')
    if (replyTo) await msg.populate({ path: 'replyTo', populate: { path: 'sender', select: 'name nickname avatar' } })

    await ChatRoom.findByIdAndUpdate(req.params.roomId, { lastMessage: msg._id, updatedAt: new Date() })

    // Broadcast to room
    const io = getIo()
    if (io) io.to(req.params.roomId).emit('new-message', msg)

    res.status(201).json({ message: msg })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

// ── PUT /api/chat/message/:msgId ─────────────────────────────────
exports.editMessage = async (req, res) => {
  try {
    const msg = await Message.findById(req.params.msgId)
    if (!msg) return res.status(404).json({ message: 'Not found' })
    if (msg.sender.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Cannot edit others messages' })

    msg.text    = req.body.text?.trim() || msg.text
    msg.edited  = true
    await msg.save()
    await msg.populate('sender', 'name nickname avatar')
    await msg.populate('readBy', 'name nickname avatar')

    const io = getIo()
    if (io) io.to(msg.chatId.toString()).emit('message-edited', msg)

    res.json({ message: msg })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

// ── DELETE /api/chat/message/:msgId ─────────────────────────────
exports.deleteMessage = async (req, res) => {
  try {
    const msg = await Message.findById(req.params.msgId)
    if (!msg) return res.status(404).json({ message: 'Not found' })

    const room = await ChatRoom.findById(msg.chatId)
    const isAdmin = req.user.role === 'admin'
    const isOwner = msg.sender.toString() === req.user._id.toString()
    if (!isAdmin && !isOwner) return res.status(403).json({ message: 'Cannot delete others messages' })

    msg.deleted = true
    msg.text    = ''
    msg.mediaUrl = ''
    await msg.save()

    const io = getIo()
    if (io) io.to(msg.chatId.toString()).emit('message-deleted', { _id: msg._id, chatId: msg.chatId })

    res.json({ success: true })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

// ── POST /api/chat/message/:msgId/react ─────────────────────────
exports.reactMessage = async (req, res) => {
  try {
    const { emoji } = req.body
    const msg = await Message.findById(req.params.msgId)
    if (!msg) return res.status(404).json({ message: 'Not found' })

    // Toggle: remove if same emoji from same user, else replace/add
    const existingIdx = msg.reactions.findIndex(r => r.user.toString() === req.user._id.toString())
    if (existingIdx !== -1) {
      if (msg.reactions[existingIdx].emoji === emoji) {
        msg.reactions.splice(existingIdx, 1) // remove
      } else {
        msg.reactions[existingIdx].emoji = emoji // replace
      }
    } else {
      msg.reactions.push({ user: req.user._id, emoji })
    }
    await msg.save()
    await msg.populate('sender', 'name nickname avatar')
    await msg.populate('readBy', 'name nickname avatar')

    const io = getIo()
    if (io) io.to(msg.chatId.toString()).emit('message-reacted', msg)

    res.json({ message: msg })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

// ── POST /api/chat/message/:msgId/read ──────────────────────────
exports.markMessageRead = async (req, res) => {
  try {
    const msg = await Message.findById(req.params.msgId)
    if (!msg) return res.status(404).json({ message: 'Not found' })

    if (!msg.readBy.map(id => id.toString()).includes(req.user._id.toString())) {
      msg.readBy.push(req.user._id)
      await msg.save()
    }
    res.json({ success: true })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

// ── POST /api/chat/ai ────────────────────────────────────────────
exports.aiChat = async (req, res) => {
  try {
    const { message } = req.body
    if (!message?.trim()) return res.status(400).json({ message: 'Message required' })

    // Use Gemini API if available, otherwise fallback
    const GEMINI_KEY = process.env.GEMINI_API_KEY
    if (!GEMINI_KEY) {
      // Intelligent fallback responses
      const responses = [
        "That's a great question! I'm your family AI assistant. While I'm in limited mode right now, feel free to ask me about family planning, recipes, travel ideas, or anything else!",
        "Interesting! As the Cintu-Mintu Gang AI, I love helping with creative ideas. Could you tell me more about what you're looking for?",
        "Great question! I'd be happy to help. For the best experience, make sure the GEMINI_API_KEY is configured on the server.",
      ]
      return res.json({ reply: responses[Math.floor(Math.random() * responses.length)] })
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `You are a helpful AI assistant for the Cintu-Mintu Gang, a close-knit family group. Be friendly, warm, and helpful. User says: ${message}` }]
          }]
        })
      }
    )
    const data = await response.json()
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not process that. Please try again!'
    res.json({ reply })
  } catch (err) {
    res.json({ reply: 'Sorry, the AI is taking a break! Please try again shortly.' })
  }
}
