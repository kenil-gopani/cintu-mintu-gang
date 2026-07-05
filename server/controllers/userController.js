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
    if (req.params.id !== req.user._id.toString()) {
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
    if (req.params.id !== req.user._id.toString()) {
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

    // Build Leaderboard (very simple points system based on uploaded items)
    const users = await User.find({ isActive: true }).select('name avatar')
    const memories = await Memory.find().select('uploader')
    const events = await Event.find().select('creator')
    const polls = await Poll.find().select('creator')

    const userStats = users.map(u => ({
      _id: u._id,
      name: u.name,
      avatar: u.avatar,
      points: 0
    }))

    memories.forEach(m => {
      const u = userStats.find(us => us._id.toString() === m.uploader?.toString())
      if (u) u.points += 5 // 5 pts for memory
    })
    events.forEach(e => {
      const u = userStats.find(us => us._id.toString() === e.creator?.toString())
      if (u) u.points += 10 // 10 pts for event
    })
    polls.forEach(p => {
      const u = userStats.find(us => us._id.toString() === p.creator?.toString())
      if (u) u.points += 2 // 2 pts for poll
    })

    const leaderboard = userStats.sort((a, b) => b.points - a.points).slice(0, 5)

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
    const memories = await Memory.find().sort({ createdAt: -1 }).limit(10).populate('uploader', 'name avatar')
    const events = await Event.find().sort({ createdAt: -1 }).limit(10).populate('creator', 'name avatar')
    const polls = await Poll.find().sort({ createdAt: -1 }).limit(10).populate('creator', 'name avatar')

    let activities = []
    
    memories.forEach(m => activities.push({
      id: m._id,
      type: 'memory',
      title: 'added a new memory',
      user: m.uploader,
      date: m.createdAt,
      extra: m.caption
    }))

    events.forEach(e => activities.push({
      id: e._id,
      type: 'event',
      title: 'created a new event',
      user: e.creator,
      date: e.createdAt,
      extra: e.title
    }))

    polls.forEach(p => activities.push({
      id: p._id,
      type: 'poll',
      title: 'started a new poll',
      user: p.creator,
      date: p.createdAt,
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
    const { name, nickname } = req.body
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
      role: 'member'
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
