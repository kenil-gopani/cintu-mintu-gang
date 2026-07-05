const mongoose = require('mongoose')

const rsvpSchema = new mongoose.Schema({
  user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['going', 'maybe', 'notGoing'] },
})

const eventSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, maxlength: 500 },
  date:        { type: Date, required: true },
  location:    { type: String, maxlength: 200 },
  locationUrl: { type: String, maxlength: 500, default: '' },
  type:        { type: String, enum: ['birthday', 'reunion', 'festival', 'trip', 'other'], default: 'other' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coverImage:  { type: String, default: '' },
  rsvp:        [rsvpSchema],
  expenses: [{
    description: { type: String, required: true },
    amount:      { type: Number, required: true },
    paidBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date:        { type: Date, default: Date.now }
  }],
}, { timestamps: true })

module.exports = mongoose.model('Event', eventSchema)
