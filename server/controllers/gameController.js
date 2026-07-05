const GameScore = require('../models/GameScore')
const User = require('../models/User')

const BADGES_CRITERIA = {
  'Quiz Master': (scores, totalPoints) => scores.filter(s => s.game === 'quiz').length >= 5,
  'Puzzle Solver': (scores, totalPoints) => scores.filter(s => s.game === 'puzzle').length >= 3,
  'Memory Guru': (scores, totalPoints) => scores.filter(s => s.game === 'memory').length >= 5,
  'High Roller': (scores, totalPoints) => totalPoints >= 1000,
  'Arcade Champion': (scores, totalPoints) => totalPoints >= 5000,
}

exports.submitScore = async (req, res) => {
  try {
    const { game, score } = req.body
    if (!game || score === undefined) return res.status(400).json({ message: 'Game and score required' })

    const gameScore = await GameScore.create({ user: req.user._id, game, score: Number(score) })

    // Update user points and evaluate badges
    const user = await User.findById(req.user._id)
    user.gamePoints += Number(score)

    const allScores = await GameScore.find({ user: req.user._id })
    let newBadgesEarned = false

    Object.keys(BADGES_CRITERIA).forEach(badge => {
      if (!user.badges.includes(badge) && BADGES_CRITERIA[badge](allScores, user.gamePoints)) {
        user.badges.push(badge)
        newBadgesEarned = true
      }
    })

    await user.save()

    res.status(201).json({ 
      gameScore, 
      gamePoints: user.gamePoints, 
      badges: user.badges,
      newBadgesEarned
    })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.getLeaderboard = async (req, res) => {
  try {
    const users = await User.find({ gamePoints: { $gt: 0 } })
      .select('name nickname avatar gamePoints badges')
      .sort({ gamePoints: -1 })
      .limit(10)
    res.json({ leaderboard: users })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.getUserHistory = async (req, res) => {
  try {
    const scores = await GameScore.find({ user: req.params.userId || req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
    res.json({ scores })
  } catch (err) { res.status(500).json({ message: err.message }) }
}
