const User = require('../models/User')
const Memory = require('../models/Memory')
const Event = require('../models/Event')
const Poll = require('../models/Poll')
const { cloudinary } = require('../config/cloudinary')

// GET /api/users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ isActive: true }).select('-password').sort({ name: 1 })
    res.json({ users })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/users/birthdays
exports.getBirthdays = async (req, res) => {
  try {
    const users = await User.find({ birthday: { $exists: true, $ne: null }, isActive: true })
      .select('name nickname avatar birthday')
    // Compute nextBirthday
    const now = new Date()
    const birthdays = users.map(u => {
      const bday = new Date(u.birthday)
      let next = new Date(now.getFullYear(), bday.getMonth(), bday.getDate())
      if (next < now) next.setFullYear(next.getFullYear() + 1)
      return { ...u.toJSON(), nextBirthday: next }
    }).sort((a, b) => a.nextBirthday - b.nextBirthday)
    res.json({ birthdays })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/users/:id
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json({ user })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PUT /api/users/:id
exports.updateUser = async (req, res) => {
  try {
    if (req.params.id !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only update your own profile' })
    }
    const allowed = ['name', 'nickname', 'bio', 'funFacts', 'birthday']
    const updates = {}
    allowed.forEach(field => { if (req.body[field] !== undefined) updates[field] = req.body[field] })
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password')
    res.json({ user })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PUT /api/users/:id/avatar
exports.updateAvatar = async (req, res) => {
  try {
    if (req.params.id !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' })
    }
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })

    // Delete old avatar from Cloudinary if it exists
    if (req.user.avatar) {
      const oldPublicId = req.user.avatar.split('/').pop().split('.')[0]
      await cloudinary.uploader.destroy(`cintu-mintu-gang/avatars/${oldPublicId}`).catch(() => {})
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { avatar: req.file.path },
      { new: true }
    ).select('-password')
    res.json({ avatar: user.avatar, user })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/users/dashboard-stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalMembers = await User.countDocuments({ isActive: true })
    const totalMemories = await Memory.countDocuments()
    const upcomingEventsCount = await Event.countDocuments({ date: { $gte: new Date() } })
    const totalPolls = await Poll.countDocuments()

    // Build Leaderboard (based on persistent points field)
    const leaderboard = await User.find({ isActive: true })
      .select('name avatar points')
      .sort({ points: -1 })
      .limit(5)

    res.json({
      totalMembers,
      totalMemories,
      upcomingEventsCount,
      totalPolls,
      leaderboard
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/users/activities
exports.getActivities = async (req, res) => {
  try {
    const memories = await Memory.find().sort({ createdAt: -1 }).limit(10).populate('uploadedBy', 'name avatar nickname')
    const events   = await Event.find().sort({ createdAt: -1 }).limit(10).populate('createdBy', 'name avatar nickname')
    const polls    = await Poll.find().sort({ createdAt: -1 }).limit(10).populate('createdBy', 'name avatar nickname')

    let activities = []

    memories.forEach(m => activities.push({
      id:    m._id,
      type:  'memory',
      title: 'added a new memory',
      user:  m.uploadedBy,
      date:  m.createdAt,
      extra: m.caption
    }))

    events.forEach(e => activities.push({
      id:    e._id,
      type:  'event',
      title: 'created a new event',
      user:  e.createdBy,
      date:  e.createdAt,
      extra: e.title
    }))

    polls.forEach(p => activities.push({
      id:    p._id,
      type:  'poll',
      title: 'started a new poll',
      user:  p.createdBy,
      date:  p.createdAt,
      extra: p.question
    }))

    activities.sort((a, b) => new Date(b.date) - new Date(a.date))

    res.json({ activities: activities.slice(0, 15) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/users/tree
exports.getFamilyTree = async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .select('name nickname avatar birthday occupation bio parents spouse children')
    res.json({ tree: users })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/users/tree/member - Any member can add a new person to the family tree
exports.createFamilyMember = async (req, res) => {
  try {
    const { name, nickname, birthday } = req.body
    if (!name) return res.status(400).json({ message: 'Name is required' })

    const baseEmail = name.toLowerCase().replace(/\s+/g, '.') + '@cintumintugang.com'
    const existing = await User.findOne({ email: baseEmail })
    const finalEmail = existing ? `${baseEmail.split('@')[0]}.${Date.now()}@cintumintugang.com` : baseEmail

    const user = new User({
      name,
      nickname: nickname || name.split(' ')[0],
      email: finalEmail,
      password: 'Password@123',
      isEmailVerified: true,
      role: 'member',
      birthday: birthday || undefined
    })

    await user.save()
    res.status(201).json({ user, message: 'Member added to family tree' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// DELETE /api/users/tree/member/:id
exports.deleteFamilyMember = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    // Also remove this user from all reciprocal relations
    await User.updateMany({ parents: user._id }, { $pull: { parents: user._id } })
    await User.updateMany({ children: user._id }, { $pull: { children: user._id } })
    await User.updateMany({ spouse: user._id }, { $unset: { spouse: "" } })

    await User.findByIdAndDelete(req.params.id)

    res.json({ message: 'Member deleted from family tree' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PUT /api/users/:id/relations
exports.updateRelations = async (req, res) => {
  try {
    // All authenticated members can edit family tree relations
    const { parents, spouse, children } = req.body
    
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const oldParents = user.parents.map(id => id.toString())
    const oldChildren = user.children.map(id => id.toString())
    const oldSpouse = user.spouse ? user.spouse.toString() : null

    if (parents !== undefined) user.parents = parents
    if (spouse !== undefined) user.spouse = spouse || null
    if (children !== undefined) user.children = children

    await user.save()

    // Reciprocal sync
    // 1. Parents -> their children array
    if (parents !== undefined) {
      const newParents = parents.map(id => id.toString())
      const addedParents = newParents.filter(id => !oldParents.includes(id))
      const removedParents = oldParents.filter(id => !newParents.includes(id))
      
      if (addedParents.length) await User.updateMany({ _id: { $in: addedParents } }, { $addToSet: { children: user._id } })
      if (removedParents.length) await User.updateMany({ _id: { $in: removedParents } }, { $pull: { children: user._id } })
    }

    // 2. Children -> their parents array
    if (children !== undefined) {
      const newChildren = children.map(id => id.toString())
      const addedChildren = newChildren.filter(id => !oldChildren.includes(id))
      const removedChildren = oldChildren.filter(id => !newChildren.includes(id))

      if (addedChildren.length) await User.updateMany({ _id: { $in: addedChildren } }, { $addToSet: { parents: user._id } })
      if (removedChildren.length) await User.updateMany({ _id: { $in: removedChildren } }, { $pull: { parents: user._id } })
    }

    // 3. Spouse -> reciprocal spouse
    if (spouse !== undefined) {
      const newSpouse = spouse ? spouse.toString() : null
      if (oldSpouse && oldSpouse !== newSpouse) {
        await User.findByIdAndUpdate(oldSpouse, { $unset: { spouse: "" } })
      }
      if (newSpouse && newSpouse !== oldSpouse) {
        await User.findByIdAndUpdate(newSpouse, { spouse: user._id })
      }
    }

    res.json({ message: 'Relations updated', user })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─────────────────────────────────────────────────────────────
// PUT /api/users/:id/password
// User changes their own password
// ─────────────────────────────────────────────────────────────
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized to change this password.' })
    }

    const user = await User.findById(req.params.id).select('+password')
    if (!user) return res.status(404).json({ message: 'User not found' })

    const bcrypt = require('bcryptjs')
    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) return res.status(400).json({ message: 'Incorrect current password.' })

    user.password = await bcrypt.hash(newPassword, 12)
    await user.save()

    res.json({ message: 'Password updated successfully' })
  } catch (err) {
    console.error('Update password error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// ─────────────────────────────────────────────────────────────
// PUT /api/users/:id/admin-reset-password
// Admin forcefully resets a user's password
// ─────────────────────────────────────────────────────────────
exports.adminResetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin privileges required.' })
    }

    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const bcrypt = require('bcryptjs')
    user.password = await bcrypt.hash(newPassword, 12)
    await user.save()

    res.json({ message: `Password for ${user.name} has been reset successfully.` })
  } catch (err) {
    console.error('Admin reset password error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}
