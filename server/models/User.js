const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')
const crypto   = require('crypto')

const userSchema = new mongoose.Schema({
  // ─── Core ───────────────────────────────────────────────
  name:         { type: String, required: true, trim: true },
  nickname:     { type: String, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:     { type: String, required: true, minlength: 8, select: false },
  avatar:       { type: String, default: '' },
  avatarPublicId: { type: String, default: '' },
  birthday:     { type: Date },
  bio:          { type: String, maxlength: 300, default: '' },
  funFacts:     [{ type: String }],
  occupation:   { type: String, default: '' },
  badges:       [{ type: String }],
  gamePoints:   { type: Number, default: 0 },

  // ─── Family Tree Relations ───────────────────────────────
  spouse:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  parents:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  children:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // ─── Role ────────────────────────────────────────────────
  role: {
    type: String,
    enum: ['admin', 'member', 'guest'],
    default: 'member',
  },

  // ─── Status ──────────────────────────────────────────────
  isActive:       { type: Boolean, default: true },
  lastSeen:       { type: Date, default: Date.now },
  joinedAt:       { type: Date, default: Date.now },

  // ─── Email Verification ──────────────────────────────────
  isEmailVerified:          { type: Boolean, default: false },
  emailVerificationToken:   { type: String, select: false },
  emailVerificationExpires: { type: Date, select: false },

  // ─── OTP ─────────────────────────────────────────────────
  otp:            { type: String, select: false },       // hashed 6-digit OTP
  otpExpires:     { type: Date, select: false },
  otpPurpose:     { type: String, select: false },       // 'email-verify' | 'login' | 'forgot'

  // ─── Password Reset ───────────────────────────────────────
  resetPasswordToken:   { type: String, select: false },
  resetPasswordExpires: { type: Date, select: false },

  // ─── Remember Me / Session ────────────────────────────────
  rememberMe: { type: Boolean, default: false },

}, { timestamps: true })

// ── Indexes ──────────────────────────────────────────────────
userSchema.index({ email: 1 })
userSchema.index({ emailVerificationToken: 1 })
userSchema.index({ resetPasswordToken: 1 })

// ── Hash password before save ────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

// ── Instance: compare password ────────────────────────────────
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password)
}

// ── Instance: generate email verification token ───────────────
userSchema.methods.createEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString('hex')
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex')
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000 // 24h
  return token // return raw (sent in email)
}

// ── Instance: generate password reset token ────────────────────
userSchema.methods.createPasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString('hex')
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex')
  this.resetPasswordExpires = Date.now() + 15 * 60 * 1000 // 15 min
  return token
}

// ── Instance: generate & store OTP ────────────────────────────
userSchema.methods.createOtp = function (purpose = 'verify') {
  const otp = String(Math.floor(100000 + Math.random() * 900000)) // 6-digit
  this.otp        = crypto.createHash('sha256').update(otp).digest('hex')
  this.otpExpires = Date.now() + 10 * 60 * 1000 // 10 min
  this.otpPurpose = purpose
  return otp // raw OTP sent to user
}

// ── Instance: verify OTP ───────────────────────────────────────
userSchema.methods.verifyOtp = function (candidateOtp) {
  const hashed = crypto.createHash('sha256').update(candidateOtp).digest('hex')
  return (
    this.otp === hashed &&
    this.otpExpires > Date.now()
  )
}

// ── toJSON: remove sensitive fields ───────────────────────────
userSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  delete obj.otp
  delete obj.otpExpires
  delete obj.otpPurpose
  delete obj.emailVerificationToken
  delete obj.emailVerificationExpires
  delete obj.resetPasswordToken
  delete obj.resetPasswordExpires
  return obj
}

module.exports = mongoose.model('User', userSchema)
