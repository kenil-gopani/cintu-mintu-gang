const mongoose = require('mongoose')

const inviteSchema = new mongoose.Schema({
  code:      { type: String, required: true, unique: true, uppercase: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  usedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }, // 30 days
  isUsed:    { type: Boolean, default: false },
}, { timestamps: true })

module.exports = mongoose.model('Invite', inviteSchema)
