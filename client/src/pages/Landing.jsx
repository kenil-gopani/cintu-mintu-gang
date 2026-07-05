import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { ArrowRight, Heart, Lock, Star } from 'lucide-react'

const floatingEmojis = ['🏠', '❤️', '🎉', '🌟', '🎂', '📸', '🌈', '🎊', '👨‍👩‍👧‍👦', '💫']

export default function Landing() {
  const [inviteCode, setInviteCode] = useState('')

  return (
    <div className="relative min-h-screen overflow-hidden bg-dark-bg flex flex-col items-center justify-center">
      {/* Animated blobs */}
      <div className="blob blob-coral w-96 h-96 top-[-100px] left-[-100px] animate-float" />
      <div className="blob blob-teal w-80 h-80 bottom-[-80px] right-[-80px] animate-float" style={{ animationDelay: '2s' }} />
      <div className="blob blob-purple w-64 h-64 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse-slow" />

      {/* Floating emojis */}
      {floatingEmojis.map((emoji, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl select-none pointer-events-none"
          style={{
            left: `${8 + (i * 9) % 84}%`,
            top:  `${10 + (i * 13) % 80}%`,
          }}
          animate={{
            y: [0, -20, 0],
            rotate: [-5, 5, -5],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.3,
            ease: 'easeInOut',
          }}
        >
          {emoji}
        </motion.div>
      ))}

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="glass rounded-4xl p-10 text-center text-white">
          {/* Logo */}
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="text-7xl mb-4 inline-block"
          >
            🏠
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-black mb-2"
            style={{
              background: 'linear-gradient(135deg, #FF6B6B, #FF8E53, #4ECDC4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Cintu-Mintu Gang
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-dark-muted text-sm mb-8 font-semibold"
          >
            A private space for our family to laugh, share & celebrate together 💕
          </motion.p>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center gap-6 mb-8"
          >
            {[
              { icon: Heart, label: 'Memories' },
              { icon: Star,  label: 'Events' },
              { icon: Lock,  label: 'Private' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Icon size={18} className="text-coral" />
                </div>
                <span className="text-xs font-bold text-dark-muted">{label}</span>
              </div>
            ))}
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="space-y-3"
          >
            <Link to="/login" className="btn-primary w-full flex items-center justify-center gap-2 text-base">
              Sign In to the Gang
              <ArrowRight size={18} />
            </Link>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-dark-muted font-semibold">have an invite?</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <div className="flex gap-2">
              <input
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Invite code (e.g. XK9J2M)"
                maxLength={8}
                className="input-field flex-1 text-sm text-center tracking-widest font-mono"
                style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)', color: '#E2E8F0' }}
              />
              <Link
                to={`/register?code=${inviteCode}`}
                className={`btn-primary px-4 text-sm ${!inviteCode ? 'pointer-events-none opacity-40' : ''}`}
              >
                Join
              </Link>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-xs text-dark-muted mt-6 font-semibold"
          >
            🔒 Private • Invite-only • Family members only
          </motion.p>
        </div>
      </motion.div>
    </div>
  )
}
