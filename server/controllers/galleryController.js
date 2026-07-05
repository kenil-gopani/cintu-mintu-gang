const Memory = require('../models/Memory')
const User = require('../models/User')
const { createNotification } = require('./notificationController')
const { cloudinary } = require('../config/cloudinary')

// GET /api/gallery
exports.getAllMemories = async (req, res) => {
  try {
    const { page = 1, album = '', search = '', year = '', event = '', favorite = '' } = req.query
    const limit  = 20
    const filter = {}
    
    if (album) filter.album = album
    if (year) filter.year = Number(year)
    if (event) filter.event = event
    if (favorite === 'true') filter.favorites = req.user._id
    
    if (search) {
      filter.$or = [
        { caption: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ]
    }

    const memories = await Memory.find(filter)
      .populate('uploadedBy', 'name nickname avatar')
      .populate('comments.user', 'name nickname avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
    const total = await Memory.countDocuments(filter)
    res.json({ memories, total, page: Number(page), pages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/gallery/albums
exports.getAlbums = async (req, res) => {
  try {
    const albums = await Memory.distinct('album')
    res.json({ albums })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/gallery
exports.uploadMemory = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })
    const { caption = '', album = 'random', tags = '', event = '' } = req.body
    
    const type = req.file.mimetype.startsWith('video/') ? 'video' : 'photo'
    const year = new Date().getFullYear()

    const memoryData = {
      uploadedBy: req.user._id,
      imageUrl:   req.file.path,
      publicId:   req.file.filename,
      type,
      year,
      caption,
      album,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
    }
    
    if (event) memoryData.event = event

    const memory = await Memory.create(memoryData)
    await memory.populate('uploadedBy', 'name nickname avatar')
    
    // Notify others
    const users = await User.find({ _id: { $ne: req.user._id }, isActive: true }).select('_id')
    if (users.length > 0) {
      await createNotification({
        recipients: users.map(u => u._id),
        type: 'memory',
        message: `${req.user.nickname || req.user.name} uploaded a new ${type}`,
        link: `/gallery?memory=${memory._id}`
      })
    }

    res.status(201).json({ memory })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// DELETE /api/gallery/:id
exports.deleteMemory = async (req, res) => {
  try {
    const memory = await Memory.findById(req.params.id)
    if (!memory) return res.status(404).json({ message: 'Memory not found' })
    const isOwner = memory.uploadedBy.toString() === req.user._id.toString()
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this memory' })
    }
    // Delete from Cloudinary
    await cloudinary.uploader.destroy(memory.publicId)
    await memory.deleteOne()
    res.json({ message: 'Memory deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/gallery/:id/like
exports.toggleLike = async (req, res) => {
  try {
    const memory = await Memory.findById(req.params.id)
    if (!memory) return res.status(404).json({ message: 'Memory not found' })
    const userId = req.user._id.toString()
    const idx = memory.likes.indexOf(userId)
    if (idx === -1) memory.likes.push(userId)
    else memory.likes.splice(idx, 1)
    await memory.save()
    res.json({ likes: memory.likes })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/gallery/:id/favorite
exports.toggleFavorite = async (req, res) => {
  try {
    const memory = await Memory.findById(req.params.id)
    if (!memory) return res.status(404).json({ message: 'Memory not found' })
    const userId = req.user._id.toString()
    const idx = memory.favorites.indexOf(userId)
    if (idx === -1) memory.favorites.push(userId)
    else memory.favorites.splice(idx, 1)
    await memory.save()
    res.json({ favorites: memory.favorites })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/gallery/:id/comment
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body
    if (!text?.trim()) return res.status(400).json({ message: 'Comment text required' })
    const memory = await Memory.findById(req.params.id)
    if (!memory) return res.status(404).json({ message: 'Memory not found' })
    memory.comments.push({ user: req.user._id, text: text.trim() })
    await memory.save()
    await memory.populate('comments.user', 'name nickname avatar')
    res.json({ comments: memory.comments })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// DELETE /api/gallery/:id/comment/:commentId
exports.deleteComment = async (req, res) => {
  try {
    const memory = await Memory.findById(req.params.id)
    if (!memory) return res.status(404).json({ message: 'Memory not found' })
    const comment = memory.comments.id(req.params.commentId)
    if (!comment) return res.status(404).json({ message: 'Comment not found' })
    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' })
    }
    comment.deleteOne()
    await memory.save()
    res.json({ message: 'Comment deleted', comments: memory.comments })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
