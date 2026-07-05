const Event = require('../models/Event')
const User = require('../models/User')
const { createNotification } = require('./notificationController')
const { sendNotificationEmail } = require('../utils/emailService')

exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate('createdBy', 'name nickname avatar')
      .populate('rsvp.user', 'name nickname avatar')
      .populate('expenses.paidBy', 'name nickname avatar')
      .sort({ date: 1 })
    res.json({ events })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, location, locationUrl, type } = req.body
    const event = await Event.create({ title, description, date, location, locationUrl, type, createdBy: req.user._id })
    await event.populate('createdBy', 'name nickname avatar')
    
    // Notify users
    const users = await User.find({ _id: { $ne: req.user._id }, isActive: true }).select('_id email')
    if (users.length > 0) {
      // In-app push
      await createNotification({
        recipients: users.map(u => u._id),
        type: 'event',
        message: `${req.user.nickname || req.user.name} scheduled a new event: ${title}`,
        link: '/events'
      })
      // Email Notification
      const emails = users.map(u => u.email).filter(Boolean)
      await sendNotificationEmail(
        emails,
        `New Family Event: ${title}`,
        `${req.user.nickname || req.user.name} scheduled a new event: ${title} on ${new Date(date).toDateString()}.`,
        `<h3>New Event: ${title}</h3><p>${req.user.nickname || req.user.name} scheduled a new event on ${new Date(date).toDateString()}.</p><p>Check the family dashboard for more details.</p>`
      )
    }

    res.status(201).json({ event })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) return res.status(404).json({ message: 'Event not found' })
    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' })
    }
    const fields = ['title','description','date','location','locationUrl','type']
    fields.forEach(f => { if (req.body[f] !== undefined) event[f] = req.body[f] })
    await event.save()
    res.json({ event })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) return res.status(404).json({ message: 'Event not found' })
    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' })
    }
    await event.deleteOne()
    res.json({ message: 'Event deleted' })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.rsvpEvent = async (req, res) => {
  try {
    const { status } = req.body
    if (!['going','maybe','notGoing'].includes(status)) {
      return res.status(400).json({ message: 'Invalid RSVP status' })
    }
    const event = await Event.findById(req.params.id)
    if (!event) return res.status(404).json({ message: 'Event not found' })
    // Remove existing RSVP from this user, add new one
    event.rsvp = event.rsvp.filter(r => r.user.toString() !== req.user._id.toString())
    event.rsvp.push({ user: req.user._id, status })
    await event.save()
    await event.populate('rsvp.user', 'name nickname avatar')
    res.json({ rsvp: event.rsvp })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.addExpense = async (req, res) => {
  try {
    const { description, amount } = req.body
    if (!description || !amount) return res.status(400).json({ message: 'Description and amount required' })
    const event = await Event.findById(req.params.id)
    if (!event) return res.status(404).json({ message: 'Event not found' })
    
    event.expenses.push({ description, amount: Number(amount), paidBy: req.user._id })
    await event.save()
    await event.populate('expenses.paidBy', 'name nickname avatar')
    
    res.json({ expenses: event.expenses })
  } catch (err) { res.status(500).json({ message: err.message }) }
}
