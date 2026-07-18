const User = require('../models/User')

const MAX_DAILY_POINTS = 50

/**
 * Award points to a user, respecting daily limits and calendar days.
 * @param {String} userId - The user's ID
 * @param {Number} amount - Amount of points to award
 * @param {String} type - Action type ('LOGIN' or 'ACTION')
 */
exports.awardPoints = async (userId, amount, type = 'ACTION') => {
  try {
    const user = await User.findById(userId)
    if (!user) return false

    const now = new Date()
    let pointsToAward = amount

    // Check if we are on a new calendar day
    const isNewDay = !user.lastPointsReset || 
      new Date(user.lastPointsReset).toDateString() !== now.toDateString()

    if (isNewDay) {
      user.dailyPointsEarned = 0
      user.lastPointsReset = now
    }

    if (type === 'LOGIN') {
      // Check login bonus specifically
      const isNewLoginDay = !user.lastLoginDate || 
        new Date(user.lastLoginDate).toDateString() !== now.toDateString()
      
      if (isNewLoginDay) {
        user.lastLoginDate = now
        // Login points DO count towards the total points, 
        // but they don't count towards the daily action limit.
      } else {
        // Already received login points today
        return false
      }
    } else {
      // It's an ACTION, enforce daily limit
      if (user.dailyPointsEarned + pointsToAward > MAX_DAILY_POINTS) {
        pointsToAward = Math.max(0, MAX_DAILY_POINTS - user.dailyPointsEarned)
      }
      user.dailyPointsEarned += pointsToAward
    }

    if (pointsToAward > 0) {
      user.points += pointsToAward
      await user.save()
      return pointsToAward
    }
    
    return 0
  } catch (err) {
    console.error('Error awarding points:', err)
    return false
  }
}
