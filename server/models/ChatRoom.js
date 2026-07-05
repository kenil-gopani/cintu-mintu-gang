const mongoose = require('mongoose')

const chatRoomSchema = new mongoose.Schema({
  isGroup: { type: Boolean, default: false },
  name: { type: String, trim: true }, // Optional, only for groups
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  unreadCounts: { type: Map, of: Number, default: {} },
}, { timestamps: true })

module.exports = mongoose.model('ChatRoom', chatRoomSchema)
