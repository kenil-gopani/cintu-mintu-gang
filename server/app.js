const express    = require('express')
const cors       = require('cors')
const helmet     = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const rateLimit  = require('express-rate-limit')
require('dotenv').config()

const app = express()

// Security headers
app.use(helmet())

// CORS
const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000']
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL.replace(/\/$/, ''))
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    const isAllowed = allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')
    if (isAllowed) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))

// Body parsing
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true }))

// Sanitize MongoDB queries
app.use(mongoSanitize())

// Global rate limiter
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { message: 'Too many requests, please try again later.' },
}))

// Auth rate limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many auth attempts. Please try again in 15 minutes.' },
})

// Routes
app.use('/api/auth',          authLimiter, require('./routes/authRoutes'))
app.use('/api/users',         require('./routes/userRoutes'))
app.use('/api/gallery',       require('./routes/galleryRoutes'))
app.use('/api/events',        require('./routes/eventRoutes'))
app.use('/api/chat',          require('./routes/chatRoutes'))
app.use('/api/notifications', require('./routes/notificationRoutes'))
app.use('/api/polls',         require('./routes/pollRoutes'))
app.use('/api/admin',         require('./routes/adminRoutes'))
app.use('/api/games',         require('./routes/gameRoutes'))

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', gang: '🏠 Cintu-Mintu Gang' }))

// 404
app.use('*', (req, res) => res.status(404).json({ message: 'Route not found' }))

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ 
      message: 'File too large! Maximum allowed sizes are: Profile Pictures (15MB), Chat (25MB), Gallery (50MB). Please choose a smaller file or compress it.' 
    })
  }

  res.status(err.status || 500).json({ message: err.message || 'Server error' })
})

module.exports = app
