const crypto = require('crypto')
const User   = require('../models/User')
const Invite = require('../models/Invite')
const generateToken = require('../utils/generateToken')
const {
  sendOtpEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} = require('../utils/emailService')

// ─────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, nickname, email, password, birthday, inviteCode, role: requestedRole } = req.body

    // Determine role
    // guest → no invite needed, limited access
    // member/admin → invite required
    let finalRole = 'member'
    if (requestedRole === 'guest') {
      finalRole = 'guest'
    } else {
      // Validate invite for member/admin
      if (!inviteCode) return res.status(400).json({ message: 'An invite code is required for family members.' })
      const invite = await Invite.findOne({ code: inviteCode.toUpperCase(), isUsed: false })
      if (!invite) return res.status(400).json({ message: 'Invalid or already used invite code.' })
      if (invite.expiresAt && new Date() > invite.expiresAt) {
        return res.status(400).json({ message: 'Invite code has expired.' })
      }
      // Mark invite as used after account created
      invite.isUsed = true
      invite._pendingUserId = true
      await invite.save()
      req._invite = invite
    }

    // Check duplicate email
    const exists = await User.findOne({ email: email.toLowerCase() })
    if (exists) return res.status(400).json({ message: 'Email already registered.' })

    // Create user (not verified yet)
    const user = await User.create({
      name, nickname, email, password, birthday,
      role: finalRole,
      isEmailVerified: false,
    })

    // Link invite
    if (req._invite) {
      req._invite.usedBy = user._id
      await req._invite.save()
    }

    // Generate email verification token & send
    const verifyToken = user.createEmailVerificationToken()
    await user.save({ validateBeforeSave: false })

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${verifyToken}`
    try {
      await sendVerificationEmail(email, name, verifyUrl)
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message)
      // Don't block registration if email fails
    }

    const token = generateToken(user._id, false)
    res.status(201).json({
      token,
      user,
      message: 'Account created! Please check your email to verify your account.',
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password, rememberMe = false } = req.body

    // Fetch with password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password')
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    const match = await user.comparePassword(password)
    if (!match) return res.status(401).json({ message: 'Invalid email or password.' })

    // Update last seen & rememberMe
    user.lastSeen  = new Date()
    user.rememberMe = rememberMe
    await user.save({ validateBeforeSave: false })

    const token = generateToken(user._id, rememberMe)
    res.json({
      token,
      user,
      rememberMe,
      expiresIn: rememberMe ? '30d' : '7d',
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────────────────────
exports.logout = (req, res) => {
  res.json({ message: 'Logged out successfully' })
}

// ─────────────────────────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  res.json({ user: req.user })
}

// ─────────────────────────────────────────────────────────────
// GET /api/auth/verify-email?token=xxx
// ─────────────────────────────────────────────────────────────
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query
    if (!token) return res.status(400).json({ message: 'Verification token required.' })

    const hashed = crypto.createHash('sha256').update(token).digest('hex')
    const user = await User.findOne({
      emailVerificationToken:   hashed,
      emailVerificationExpires: { $gt: Date.now() },
    }).select('+emailVerificationToken +emailVerificationExpires')

    if (!user) return res.status(400).json({ message: 'Token is invalid or has expired.' })

    user.isEmailVerified          = true
    user.emailVerificationToken   = undefined
    user.emailVerificationExpires = undefined
    await user.save({ validateBeforeSave: false })

    // Send welcome email
    try { await sendWelcomeEmail(user.email, user.name) } catch {}

    res.json({ message: 'Email verified successfully! Welcome to the gang 🎉', user })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/resend-verification
// ─────────────────────────────────────────────────────────────
exports.resendVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('+emailVerificationToken +emailVerificationExpires')
    if (!user) return res.status(404).json({ message: 'User not found.' })
    if (user.isEmailVerified) return res.status(400).json({ message: 'Email is already verified.' })

    const verifyToken = user.createEmailVerificationToken()
    await user.save({ validateBeforeSave: false })
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${verifyToken}`
    await sendVerificationEmail(user.email, user.name, verifyUrl)
    res.json({ message: 'Verification email resent! Check your inbox.' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/send-otp
// body: { email, purpose: 'email-verify' | 'login' | 'forgot' }
// ─────────────────────────────────────────────────────────────
exports.sendOtp = async (req, res) => {
  try {
    const { email, purpose = 'email-verify' } = req.body
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+otp +otpExpires +otpPurpose')
    if (!user) return res.status(404).json({ message: 'No account found with this email.' })

    const otp = user.createOtp(purpose)
    await user.save({ validateBeforeSave: false })

    await sendOtpEmail(user.email, user.name, otp, purpose)
    res.json({ message: `OTP sent to ${email}. Valid for 10 minutes.` })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/verify-otp
// body: { email, otp, purpose }
// ─────────────────────────────────────────────────────────────
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp, purpose } = req.body
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+otp +otpExpires +otpPurpose +password')
    if (!user) return res.status(404).json({ message: 'No account found.' })

    if (user.otpPurpose !== purpose) {
      return res.status(400).json({ message: 'OTP purpose mismatch.' })
    }
    if (!user.verifyOtp(otp)) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' })
    }

    // Clear OTP
    user.otp        = undefined
    user.otpExpires = undefined
    user.otpPurpose = undefined

    // If purpose is email-verify, mark email as verified
    if (purpose === 'email-verify') {
      user.isEmailVerified = true
    }

    await user.save({ validateBeforeSave: false })

    // Return a short-lived token for password-reset flow
    const token = generateToken(user._id, false)
    res.json({ message: 'OTP verified successfully.', token, user })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// body: { email }
// ─────────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+resetPasswordToken +resetPasswordExpires')
    if (!user) {
      // Don't reveal if user exists
      return res.json({ message: 'If an account with that email exists, a reset link has been sent.' })
    }

    const resetToken = user.createPasswordResetToken()
    await user.save({ validateBeforeSave: false })

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`
    await sendPasswordResetEmail(user.email, user.name, resetUrl)

    res.json({ message: 'Password reset link sent! Check your inbox.' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/reset-password
// body: { token, newPassword }
// ─────────────────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required.' })
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' })
    }

    const hashed = crypto.createHash('sha256').update(token).digest('hex')
    const user = await User.findOne({
      resetPasswordToken:   hashed,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpires +password')

    if (!user) return res.status(400).json({ message: 'Reset token is invalid or has expired.' })

    user.password             = newPassword
    user.resetPasswordToken   = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    const jwtToken = generateToken(user._id, false)
    res.json({ message: 'Password reset successfully! You are now logged in.', token: jwtToken, user })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/change-password (authenticated)
// body: { currentPassword, newPassword }
// ─────────────────────────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = await User.findById(req.user._id).select('+password')
    const match = await user.comparePassword(currentPassword)
    if (!match) return res.status(401).json({ message: 'Current password is incorrect.' })
    if (newPassword.length < 8) return res.status(400).json({ message: 'New password must be at least 8 characters.' })

    user.password = newPassword
    await user.save()
    res.json({ message: 'Password changed successfully.' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
