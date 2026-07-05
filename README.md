# 🏠 Cintu-Mintu Gang

A modern, premium, private family website for cousins to stay connected, share memories, celebrate birthdays, organize events, and have fun together.

## ✨ Features

- 🔐 Invite-only registration with JWT authentication
- 📸 Memory Wall with Cloudinary photo uploads, likes & comments
- 💬 Real-time family group chat via Socket.io
- 📅 Events & Calendar with RSVP
- 🎂 Birthday Tracker with confetti & wish notifications
- 👨‍👩‍👧‍👦 Family Members directory with fun facts
- 🎉 Fun Zone with family polls
- 🔔 Real-time in-app notifications
- ⚙️ Admin Panel with invite code generator
- 🌙 Dark/Light mode toggle
- 📱 Fully responsive design

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Cloudinary account (free tier works)

### 1. Clone & Setup

```bash
cd "cintu-mintu-gang"
```

### 2. Setup Server

```bash
cd server
cp .env.example .env
# Fill in your MongoDB URI and Cloudinary credentials in .env
npm install
npm run seed    # Creates first admin + invite code
npm run dev
```

### 3. Setup Client

```bash
cd ../client
npm install
npm run dev
```

### 4. Open in Browser

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api/health

### 5. First Login

After seeding, login with:
- Email: `admin@cintumintugang.com`
- Password: `Admin@1234`

Then go to **Admin Panel → Invite Codes → Generate** to create invite codes for family members.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Framer Motion |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB + Mongoose |
| **Auth** | JWT (jsonwebtoken) |
| **Media** | Cloudinary + Multer |
| **Real-time** | Socket.io |
| **Security** | Helmet, CORS, Rate Limiting, bcryptjs |

## 📁 Project Structure

```
cintu-mintu-gang/
├── client/   # React + Vite frontend
└── server/   # Node.js + Express backend
```

## 🔒 Security

- All routes protected with JWT
- Invite-only registration
- Passwords hashed with bcrypt (12 rounds)
- Rate limiting on auth routes (10 req/15 min)
- MongoDB query sanitization
- Helmet security headers
- CORS restricted to frontend origin

## 🚀 Future Scope

- PWA support (offline, installable)
- Push notifications (Web Push API)
- Voice/Video calls (WebRTC)
- Family recipe book
- AI-powered "On This Day" memories
- Annual Year in Review slideshow
