import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Image, Calendar, Users, Shield } from 'lucide-react'

const features = [
  { icon: Image,    label: 'Memory Wall',  desc: 'Share photos & videos with the whole family.' },
  { icon: Calendar, label: 'Events',       desc: 'Plan gatherings and never miss a date.' },
  { icon: Users,    label: 'Family Tree',  desc: 'Visualise your family connections.' },
  { icon: Shield,   label: '100% Private', desc: 'Invite-only. Your memories stay yours.' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#F5F6FA] flex flex-col lg:flex-row overflow-hidden">

      {/* ── LEFT PANEL ── */}
      <div className="relative lg:w-1/2 flex items-center justify-center p-10 min-h-[45vh] lg:min-h-screen overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #6366F1 0%, #8B5CF6 55%, #10B981 100%)' }}
      >
        {/* soft circle decorations */}
        <div className="absolute w-80 h-80 rounded-full bg-white/10 -top-20 -left-20" />
        <div className="absolute w-56 h-56 rounded-full bg-white/10 -bottom-14 right-10" />
        <div className="absolute w-32 h-32 rounded-full bg-black/10 top-1/2 -right-10" />

        {/* floating emojis */}
        {['🏠','❤️','🎉','📸','🌟','🎂','👨‍👩‍👧‍👦','🌈'].map((e, i) => (
          <motion.span
            key={i}
            className="absolute text-3xl select-none pointer-events-none"
            style={{ left: `${8 + (i * 11) % 78}%`, top: `${12 + (i * 14) % 75}%` }}
            animate={{ y: [0, -14, 0], opacity: [0.4, 0.85, 0.4] }}
            transition={{ duration: 4 + i * 0.6, repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
          >
            {e}
          </motion.span>
        ))}

        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-white text-center lg:text-left"
        >
          {/* logo badge */}
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
            <span className="text-lg">🏠</span>
            <span className="text-sm font-bold tracking-wide">Cintu-Mintu Gang</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-black leading-tight mb-4">
            Your family's<br/>
            <span className="text-white/80">private space</span>
          </h1>
          <p className="text-white/70 text-base font-medium max-w-xs leading-relaxed">
            Share memories, plan events, and stay close — all in one invite-only space built just for your family.
          </p>

          {/* feature pills */}
          <div className="flex flex-wrap gap-2 mt-6 justify-center lg:justify-start">
            {['📸 Memories', '🎉 Events', '🌳 Family Tree', '🔒 Private'].map(tag => (
              <span key={tag} className="bg-white/15 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="w-full max-w-sm"
        >
          <h2 className="text-3xl font-black text-gray-900 mb-2">Welcome to the Gang 👋</h2>
          <p className="text-gray-500 text-sm mb-8 font-medium">Sign in to your private family space.</p>

          {/* Feature list */}
          <div className="space-y-4 mb-10">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, #EEF2FF, #F5F3FF)' }}>
                  <Icon size={17} className="text-indigo-500" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-800">{label}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="space-y-3">
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90 hover:shadow-lg active:scale-95"
              style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
            >
              Sign In to the Gang
              <ArrowRight size={17} />
            </Link>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6 font-medium">
            🔒 Invite-only • Your memories are private
          </p>
        </motion.div>
      </div>
    </div>
  )
}
