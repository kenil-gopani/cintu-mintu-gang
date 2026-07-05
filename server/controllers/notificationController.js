const Notification = require('../models/Notification')

// Helper function used by other controllers to create and emit notifications
exports.createNotification = async ({ recipients, type, message, link }) => {
  try {
    const notifications = recipients.map(recipient => ({ recipient, type, message, link }))
    const created = await Notification.insertMany(notifications)
    
    const io = require('../config/socket').getIo()
    if (io) {
      created.forEach(n => {
        io.to(n.recipient.toString()).emit('new-notification', n)
      })
    }
  } catch (err) {
    console.error('Error creating notifications:', err)
  }
}

exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
    res.json({ notifications })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user._id, read: false })
    res.json({ count })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true })
    res.json({ message: 'Marked as read' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true })
    res.json({ message: 'All marked as read' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
