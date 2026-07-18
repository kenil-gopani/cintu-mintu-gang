const mongoose = require('mongoose')
require('dotenv').config({ path: '../.env' })

const User = require('../models/User')
const Memory = require('../models/Memory')
const Event = require('../models/Event')
const Poll = require('../models/Poll')

const migratePoints = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to DB for migration...')

    const users = await User.find()
    const memories = await Memory.find()
    const events = await Event.find()
    const polls = await Poll.find()

    for (const user of users) {
      let points = 0
      
      const userMemories = memories.filter(m => m.uploadedBy?.toString() === user._id.toString())
      const userEvents = events.filter(e => e.createdBy?.toString() === user._id.toString())
      const userPolls = polls.filter(p => p.createdBy?.toString() === user._id.toString())

      points += userMemories.length * 5
      points += userEvents.length * 10
      points += userPolls.length * 2

      user.points = points
      user.dailyPointsEarned = 0
      user.lastPointsReset = new Date()
      // Give them login bonus retroactively for today if they want? We'll just set their starting points.

      await user.save({ validateBeforeSave: false })
      console.log(`Updated points for ${user.name}: ${points} pts`)
    }

    console.log('Migration completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

migratePoints()
