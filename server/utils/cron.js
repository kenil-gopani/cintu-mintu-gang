const User = require('../models/User')
const { createNotification } = require('../controllers/notificationController')
const { sendNotificationEmail } = require('./emailService')

const checkBirthdays = async () => {
  try {
    const today = new Date()
    const currentMonth = today.getMonth() + 1
    const currentDay = today.getDate()

    // Find all active users
    const allUsers = await User.find({ isActive: true }).select('_id email nickname name dob')
    
    // Find users whose birthday is today
    const birthdayUsers = allUsers.filter(u => {
      if (!u.dob) return false
      const dob = new Date(u.dob)
      return (dob.getMonth() + 1) === currentMonth && dob.getDate() === currentDay
    })

    if (birthdayUsers.length === 0) return

    for (const bUser of birthdayUsers) {
      const name = bUser.nickname || bUser.name
      const others = allUsers.filter(u => u._id.toString() !== bUser._id.toString())
      
      // In-app push
      await createNotification({
        recipients: others.map(u => u._id),
        type: 'birthday',
        message: `🎂 It's ${name}'s birthday today! Send them a wish!`,
        link: '/dashboard'
      })

      // Email Notification
      const emails = others.map(u => u.email).filter(Boolean)
      await sendNotificationEmail(
        emails,
        `🎂 Happy Birthday ${name}!`,
        `It's ${name}'s birthday today! Log in to the family dashboard to send your wishes.`,
        `<h3>Happy Birthday ${name}! 🎈</h3><p>Don't forget to wish them on their special day.</p>`
      )
    }
  } catch (err) {
    console.error('Error in daily birthday check:', err)
  }
}

// Run once a day (86400000 ms)
const startCron = () => {
  console.log('⏳ Starting daily birthday cron job...')
  // Check immediately on boot
  checkBirthdays()
  // Then check every 24 hours
  setInterval(checkBirthdays, 24 * 60 * 60 * 1000)
}

module.exports = { startCron }
