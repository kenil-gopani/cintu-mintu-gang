const Poll = require('../models/Poll')
const User = require('../models/User')
const { createNotification } = require('./notificationController')
const { awardPoints } = require('../utils/points')

exports.getAllPolls = async (req, res) => {
  try {
    const polls = await Poll.find()
      .populate('createdBy', 'name nickname avatar')
      .populate('options.votes')
      .sort({ createdAt: -1 })
    res.json({ polls })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.createPoll = async (req, res) => {
  try {
    const { question, options, expiresAt } = req.body
    if (!question || !options?.length || options.length < 2) {
      return res.status(400).json({ message: 'Need a question and at least 2 options' })
    }
    const poll = await Poll.create({ question, options, createdBy: req.user._id, expiresAt })
    await poll.populate('createdBy', 'name nickname')
    
    // Award points
    await awardPoints(req.user._id, 2, 'ACTION')
    
    // Notify users
    const users = await User.find({ _id: { $ne: req.user._id }, isActive: true }).select('_id')
    if (users.length > 0) {
      await createNotification({
        recipients: users.map(u => u._id),
        type: 'poll',
        message: `${req.user.nickname || req.user.name} created a new poll: "${question}"`,
        link: '/dashboard'
      })
    }

    res.status(201).json({ poll })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.votePoll = async (req, res) => {
  try {
    const { optionIndex } = req.body
    const poll = await Poll.findById(req.params.id)
    if (!poll) return res.status(404).json({ message: 'Poll not found' })
    // Remove existing vote from all options
    poll.options.forEach(opt => {
      opt.votes = opt.votes.filter(v => v.toString() !== req.user._id.toString())
    })
    // Add vote to selected option
    if (poll.options[optionIndex]) {
      poll.options[optionIndex].votes.push(req.user._id)
    }
    await poll.save()
    await poll.populate('createdBy', 'name nickname')
    res.json({ poll })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.deletePoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id)
    if (!poll) return res.status(404).json({ message: 'Poll not found' })

    if (poll.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this poll' })
    }

    await poll.deleteOne()
    res.json({ message: 'Poll deleted successfully' })
  } catch (err) { 
    res.status(500).json({ message: err.message }) 
  }
}
