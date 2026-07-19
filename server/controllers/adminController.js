const User           = require('../models/User')
const Invite         = require('../models/Invite')
const Memory         = require('../models/Memory')
const generateInvite = require('../utils/inviteGenerator')
const Event          = require('../models/Event')
const Poll           = require('../models/Poll')
const Message        = require('../models/Message')
const Notification   = require('../models/Notification')
const { cloudinary } = require('../config/cloudinary')

exports.getAllMembers = async (req, res) => {
  try {
    const members = await User.find().select('-password').sort({ joinedAt: 1 })
    res.json({ members })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.addMember = async (req, res) => {
  try {
    const { name, nickname } = req.body
    if (!name) return res.status(400).json({ message: 'Name is required' })

    const email = `${name.toLowerCase().replace(/\s+/g, '.')}@chintumintugang.com`
    
    // Check if email exists to avoid duplicate key error
    const existing = await User.findOne({ email })
    let finalEmail = email
    if (existing) {
      finalEmail = `${name.toLowerCase().replace(/\s+/g, '.')}.${Date.now()}@chintumintugang.com`
    }

    const user = new User({
      name,
      nickname,
      email: finalEmail,
      password: 'Password@123',
      isEmailVerified: true,
      role: 'member'
    })

    await user.save()
    res.status(201).json({ user, message: 'Member created successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.fixPasswords = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } })
    let count = 0
    for (let user of users) {
      user.password = 'Password@123'
      await user.save()
      count++
    }
    res.json({ message: `Successfully reset and hashed passwords for ${count} users.` })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.changeRole = async (req, res) => {
  try {
    const { role } = req.body
    if (!['admin', 'member'].includes(role)) return res.status(400).json({ message: 'Invalid role' })
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json({ user })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.removeMember = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "You can't remove yourself" })
    }
    await User.findByIdAndUpdate(req.params.id, { isActive: false })
    res.json({ message: 'Member removed' })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.createInvite = async (req, res) => {
  try {
    let code, exists = true
    while (exists) {
      code = generateInvite()
      exists = await Invite.findOne({ code })
    }
    const invite = await Invite.create({ code, createdBy: req.user._id })
    res.status(201).json({ invite })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.getInvites = async (req, res) => {
  try {
    const invites = await Invite.find()
      .populate('createdBy', 'name')
      .populate('usedBy', 'name nickname')
      .sort({ createdAt: -1 })
    res.json({ invites })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.adminDeleteMemory = async (req, res) => {
  try {
    const memory = await Memory.findById(req.params.id)
    if (!memory) return res.status(404).json({ message: 'Memory not found' })
    await cloudinary.uploader.destroy(memory.publicId).catch(() => {})
    await memory.deleteOne()
    res.json({ message: 'Memory deleted by admin' })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.getAnalytics = async (req, res) => {
  try {
    const [userCount, memoryCount, eventCount, messageCount] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Memory.countDocuments(),
      Event.countDocuments(),
      Message.countDocuments()
    ])
    res.json({
      analytics: {
        users: userCount,
        memories: memoryCount,
        events: eventCount,
        messages: messageCount
      }
    })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.pushNotification = async (req, res) => {
  try {
    const { title, message } = req.body
    if (!message) return res.status(400).json({ message: 'Message is required' })

    const users = await User.find({ isActive: true }).select('_id')
    const notifications = users.map(u => ({
      recipient: u._id,
      type: 'system',
      message: `🔔 Admin Broadcast: ${title ? title + ' - ' : ''}${message}`
    }))

    await Notification.insertMany(notifications)

    // Broadcast via socket if available
    const io = require('../config/socket').getIo()
    if (io) {
      io.emit('system-broadcast', { title, message })
    }

    res.json({ message: 'Push notification sent to all users' })
  } catch (err) { res.status(500).json({ message: err.message }) }
}
