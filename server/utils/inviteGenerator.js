const crypto = require('crypto')

/**
 * Generate an 8-character alphanumeric invite code (uppercase)
 */
module.exports = function generateInviteCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase()
}
