import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#fdfaf6]">
      {/* Soft pastel wavy background effect */}
      <div className="absolute w-[800px] h-[800px] rounded-full opacity-60 -top-64 -left-64 blur-3xl"
        style={{ background: 'radial-gradient(circle, #fca5a5 0%, transparent 70%)' }} />
      <div className="absolute w-[900px] h-[900px] rounded-full opacity-60 -bottom-80 -right-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, #fef08a 0%, transparent 70%)' }} />
      <div className="absolute w-[700px] h-[700px] rounded-full opacity-50 top-20 -right-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #93c5fd 0%, transparent 70%)' }} />
      <div className="absolute w-[600px] h-[600px] rounded-full opacity-50 bottom-20 -left-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #a7f3d0 0%, transparent 70%)' }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-4xl"
      >
        <div className="bg-white/40 backdrop-blur-2xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/60 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
          
          {/* Left Side: Illustration */}
          <div className="md:w-1/2 p-8 flex items-center justify-center relative bg-white/20">
             <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
             <img src="/family-hero.png" alt="Family Picnic" className="w-full h-auto max-w-sm object-contain drop-shadow-xl relative z-10" />
          </div>

          {/* Right Side: Welcome Content */}
          <div className="md:w-1/2 p-10 lg:p-14 flex flex-col justify-center">
            
            <div className="mb-8">
              <h1 className="text-3xl lg:text-4xl font-bold text-[#1e293b] mb-3 leading-tight tracking-tight">
                Welcome to<br />Family Hub!
              </h1>
              <p className="text-gray-600 font-medium">Your private space to share memories, plan events, and stay close.</p>
            </div>

            <div className="space-y-4">
              <Link
                to="/login"
                className="w-full mt-6 py-3.5 rounded-full font-bold text-white text-base transition-all hover:opacity-90 shadow-lg active:scale-95 flex items-center justify-center bg-[#219673]"
              >
                Sign In to the Gang
              </Link>
              
              <p className="text-center text-xs text-gray-500 mt-6 font-medium">
                🔒 Invite-only • Your memories are private
              </p>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  )
}
