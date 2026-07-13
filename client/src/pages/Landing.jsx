import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Image, Calendar, Users, Shield, Gift } from 'lucide-react'

const features = [
  { icon: Image,    label: 'Memory Wall',  color: '#6366F1' },
  { icon: Calendar, label: 'Family Events', color: '#10B981' },
  { icon: Users,    label: 'Family Tree',  color: '#8B5CF6' },
  { icon: Gift,     label: 'Birthdays',    color: '#F59E0B' },
  { icon: Shield,   label: '100% Private', color: '#EC4899' },
]

export default function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden relative"
      style={{
        background: 'linear-gradient(135deg, #f9c0d0 0%, #c9e4f7 30%, #fde8a0 65%, #c9e4f7 100%)',
      }}
    >
      {/* Pastel swirl blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-50 -top-40 -left-40"
          style={{ background: '#f9c0d0' }} />
        <div className="absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-40 top-10 right-0"
          style={{ background: '#c9e4f7' }} />
        <div className="absolute w-[400px] h-[400px] rounded-full blur-3xl opacity-40 bottom-0 left-1/3"
          style={{ background: '#fde8a0' }} />
        <div className="absolute w-[350px] h-[350px] rounded-full blur-3xl opacity-35 bottom-10 right-10"
          style={{ background: '#b5eae0' }} />
      </div>

      {/* Floating emojis */}
      {['🏠','❤️','🎉','📸','🎂','🌟','👨‍👩‍👧‍👦'].map((e, i) => (
        <motion.span
          key={i}
          className="absolute text-2xl select-none pointer-events-none hidden sm:block"
          style={{ left: `${6 + (i * 13) % 80}%`, top: `${8 + (i * 15) % 78}%` }}
          animate={{ y: [0, -12, 0], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 3.5 + i * 0.5, repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
        >{e}</motion.span>
      ))}

      {/* Main glassmorphism card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-4xl"
      >
        <div className="flex flex-col md:flex-row rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: 'rgba(255,255,255,0.55)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.7)',
          }}
        >
          {/* LEFT — Illustration */}
          <div className="md:w-[45%] flex items-center justify-center p-8 md:p-10"
            style={{ background: 'rgba(255,255,255,0.35)' }}
          >
            <div className="text-center">
              <motion.img
                src="/family-illustration.png"
                alt="Happy family"
                className="w-full max-w-[280px] object-contain mx-auto select-none"
                draggable={false}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="mt-4">
                <h2 className="text-xl font-black text-gray-800 mb-1">
                  Cintu-Mintu Gang 🏠
                </h2>
                <p className="text-sm text-gray-400 font-medium">
                  Your family's private space
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT — Welcome content */}
          <div className="md:w-[55%] flex flex-col justify-center p-8 md:p-10">
            <h1 className="text-2xl md:text-3xl font-black leading-tight mb-1" style={{ color: '#1a2b5e' }}>
              Welcome to the Gang! 👋
            </h1>
            <p className="text-sm text-gray-400 font-medium mb-7">
              Share memories, celebrate birthdays, and stay close — invite only.
            </p>

            {/* Feature grid */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {features.map(({ icon: Icon, label, color }) => (
                <div key={label} className="flex items-center gap-2.5 p-2.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.6)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${color}18` }}>
                    <Icon size={16} style={{ color }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700">{label}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <motion.div whileTap={{ scale: 0.97 }}>
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}
              >
                Sign In to the Gang
                <ArrowRight size={16} />
              </Link>
            </motion.div>

            <p className="text-center text-xs text-gray-300 mt-4">
              🔒 Private & invite-only
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
