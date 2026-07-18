const mongoose = require('mongoose')

const gameScoreSchema = new mongoose.Schema({
  user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  game:  { type: String, enum: ['quiz', 'memory', 'memory-family', 'puzzle', 'spin', 'truth-dare', 'truth-dare-wheel', 'snake'], required: true },
  score: { type: Number, required: true },
}, { timestamps: true })

module.exports = mongoose.model('GameScore', gameScoreSchema)
