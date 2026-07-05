const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:      { type: String, required: true, maxlength: 500 },
  createdAt: { type: Date, default: Date.now },
})

const memorySchema = new mongoose.Schema({
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  imageUrl:   { type: String, required: true },
  publicId:   { type: String, required: true },
  type:       { type: String, enum: ['photo', 'video'], default: 'photo' },
  caption:    { type: String, maxlength: 300, default: '' },
  tags:       [{ type: String }],
  album:      { type: String, enum: ['birthday', 'vacation', 'festival', 'random', 'reunion'], default: 'random' },
  event:      { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  year:       { type: Number },
  likes:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  favorites:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments:   [commentSchema],
}, { timestamps: true })

module.exports = mongoose.model('Memory', memorySchema)
