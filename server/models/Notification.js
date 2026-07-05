const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:      { type: String, enum: ['birthday', 'event', 'memory', 'poll', 'message', 'wish', 'general', 'system'], default: 'general' },
  message:   { type: String, required: true },
  link:      { type: String, default: '' },
  read:      { type: Boolean, default: false },
}, { timestamps: true })

notificationSchema.index({ recipient: 1, createdAt: -1 })

module.exports = mongoose.model('Notification', notificationSchema)
