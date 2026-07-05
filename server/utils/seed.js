/**
 * Seed script — creates the first admin user and a starter invite code.
 * Run: node utils/seed.js
 */
require('dotenv').config()
const mongoose = require('mongoose')
const User     = require('../models/User')
const Invite   = require('../models/Invite')
const generateInviteCode = require('./inviteGenerator')

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('✅ Connected to MongoDB')

  // Check if admin already exists
  const existing = await User.findOne({ email: process.env.SEED_ADMIN_EMAIL })
  if (existing) {
    console.log('ℹ️  Admin already exists:', existing.email)
    await mongoose.disconnect()
    return
  }

  // Create admin
  const admin = await User.create({
    name:     process.env.SEED_ADMIN_NAME || 'Gang Admin',
    nickname: 'Admin',
    email:    process.env.SEED_ADMIN_EMAIL || 'admin@cintumintugang.com',
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin@1234',
    role:     'admin',
    bio:      'I manage the Cintu-Mintu Gang! 🏠',
  })

  console.log('👑 Admin created:', admin.email)

  // Create a starter invite code for the first family member
  const code = generateInviteCode()
  await Invite.create({ code, createdBy: admin._id })
  console.log(`🎟️  First invite code: ${code}`)
  console.log('📋 Share this code with family members to let them register!')

  await mongoose.disconnect()
  console.log('✅ Seeding complete!')
}

seed().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
