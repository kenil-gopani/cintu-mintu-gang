const router = require('express').Router()
const {
  register,
  login,
  logout,
  getMe,
  verifyEmail,
  resendVerification,
  sendOtp,
  verifyOtp,
  forgotPassword,
  resetPassword,
  changePassword,
} = require('../controllers/authController')
const protect = require('../middleware/authMiddleware')

// Public routes
router.post('/register',        register)
router.post('/login',           login)
router.get('/verify-email',     verifyEmail)
router.post('/send-otp',        sendOtp)
router.post('/verify-otp',      verifyOtp)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password',  resetPassword)

// Protected routes
router.use(protect)
router.post('/logout',              logout)
router.get('/me',                   getMe)
router.post('/resend-verification', resendVerification)
router.post('/change-password',     changePassword)

module.exports = router
