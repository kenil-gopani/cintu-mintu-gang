const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  chatId:   { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', required: true },
  sender:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:     { type: String, default: '', maxlength: 2000 },
  type:     { type: String, enum: ['text', 'image', 'audio', 'gif'], default: 'text' },
  mediaUrl: { type: String, default: '' },
  readBy:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reactions:[{
    user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: { type: String },
  }],
}, { timestamps: true })

module.exports = mongoose.model('Message', messageSchema)
