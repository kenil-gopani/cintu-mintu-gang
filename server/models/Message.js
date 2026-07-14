const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  chatId:   { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', required: true },
  sender:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:     { type: String, default: '', maxlength: 4000 },
  type:     { type: String, enum: ['text', 'image', 'audio', 'gif', 'file'], default: 'text' },
  mediaUrl: { type: String, default: '' },
  replyTo:  { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  readBy:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reactions: [{
    user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: { type: String },
  }],
  edited:   { type: Boolean, default: false },
  deleted:  { type: Boolean, default: false },
}, { timestamps: true })

module.exports = mongoose.model('Message', messageSchema)
