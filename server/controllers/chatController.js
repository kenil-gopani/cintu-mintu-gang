const Message = require('../models/Message')
const ChatRoom = require('../models/ChatRoom')
const User = require('../models/User')

// GET /api/chat/rooms
// Fetches all rooms for the user
exports.getRooms = async (req, res) => {
  try {
    const rooms = await ChatRoom.find({ participants: req.user._id })
      .populate('participants', 'name nickname avatar')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'name nickname avatar' }
      })
      .sort({ updatedAt: -1 })
    res.json({ rooms })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

// POST /api/chat/room/private/:userId
// Get or create a private room with another user
exports.getOrCreatePrivateRoom = async (req, res) => {
  try {
    const otherUserId = req.params.userId
    let room = await ChatRoom.findOne({
      isGroup: false,
      participants: { $all: [req.user._id, otherUserId] }
    }).populate('participants', 'name nickname avatar')

    if (!room) {
      room = await ChatRoom.create({
        isGroup: false,
        participants: [req.user._id, otherUserId],
        unreadCounts: { [req.user._id]: 0, [otherUserId]: 0 }
      })
      await room.populate('participants', 'name nickname avatar')
    }
    res.json({ room })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

// POST /api/chat/room/group
exports.createGroupRoom = async (req, res) => {
  try {
    const { name, participants } = req.body
    if (!name || !participants || participants.length === 0) {
      return res.status(400).json({ message: 'Name and participants required' })
    }
    const allParticipants = [...new Set([...participants, req.user._id.toString()])]
    
    const unreadCounts = {}
    allParticipants.forEach(p => unreadCounts[p] = 0)

    const room = await ChatRoom.create({
      isGroup: true,
      name,
      participants: allParticipants,
      unreadCounts
    })
    await room.populate('participants', 'name nickname avatar')
    res.status(201).json({ room })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

// GET /api/chat/room/:roomId/messages
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chatId: req.params.roomId })
      .populate('sender', 'name nickname avatar')
      .populate('readBy', 'name nickname avatar')
      .sort({ createdAt: 1 })
      .limit(300)
    res.json({ messages })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

// POST /api/chat/room/:roomId/message
exports.sendMessage = async (req, res) => {
  try {
    const { text, type = 'text' } = req.body
    let mediaUrl = ''

    if (req.file) {
      mediaUrl = req.file.path
    }

    if (!text?.trim() && !mediaUrl) {
      return res.status(400).json({ message: 'Message cannot be empty' })
    }

    const msg = await Message.create({
      chatId: req.params.roomId,
      sender: req.user._id,
      text: text ? text.trim() : '',
      type,
      mediaUrl,
      readBy: [req.user._id]
    })

    await msg.populate('sender', 'name nickname avatar')
    await msg.populate('readBy', 'name nickname avatar')

    // Update Room last message
    await ChatRoom.findByIdAndUpdate(req.params.roomId, {
      lastMessage: msg._id,
      updatedAt: new Date()
    })

    // Broadcast
    const io = require('../config/socket').getIo()
    if (io) {
      io.to(req.params.roomId).emit('new-message', msg)
    }

    res.status(201).json({ message: msg })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

// POST /api/chat/message/:msgId/read
exports.markMessageRead = async (req, res) => {
  try {
    const msg = await Message.findById(req.params.msgId)
    if (!msg) return res.status(404).json({ message: 'Not found' })
    
    if (!msg.readBy.includes(req.user._id)) {
      msg.readBy.push(req.user._id)
      await msg.save()
    }
    res.json({ message: msg })
  } catch (err) { res.status(500).json({ message: err.message }) }
}
