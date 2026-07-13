import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const { login }  = useAuth()
  const navigate   = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      navigate('/home')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    /* ── Pastel swirl background ── */
    <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden relative"
      style={{
        background: 'linear-gradient(135deg, #f9c0d0 0%, #c9e4f7 30%, #fde8a0 65%, #c9e4f7 100%)',
      }}
    >
      {/* swirl blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-60 -top-40 -left-40"
          style={{ background: '#f9c0d0' }} />
        <div className="absolute w-[400px] h-[400px] rounded-full blur-3xl opacity-50 top-0 right-0"
          style={{ background: '#c9e4f7' }} />
        <div className="absolute w-[350px] h-[350px] rounded-full blur-3xl opacity-50 bottom-0 left-1/3"
          style={{ background: '#fde8a0' }} />
        <div className="absolute w-[300px] h-[300px] rounded-full blur-3xl opacity-40 bottom-10 right-10"
          style={{ background: '#b5eae0' }} />
      </div>

      {/* ── Glassmorphism Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-3xl"
      >
        <div className="flex flex-col md:flex-row rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: 'rgba(255,255,255,0.55)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.7)',
          }}
        >
          {/* ── LEFT: Illustration ── */}
          <div className="md:w-1/2 flex items-center justify-center p-8"
            style={{ background: 'rgba(255,255,255,0.3)' }}
          >
            <img
              src="/family-illustration.png"
              alt="Happy family"
              className="w-full max-w-xs object-contain select-none"
              draggable={false}
            />
          </div>

          {/* ── RIGHT: Form ── */}
          <div className="md:w-1/2 flex flex-col justify-center p-8 md:p-10">
            <h1 className="text-2xl font-black text-gray-800 leading-tight mb-1">
              Welcome back to<br />
              <span style={{ color: '#1a2b5e' }}>Cintu-Mintu Gang!</span>
            </h1>
            <p className="text-sm text-gray-400 font-medium mb-6">
              Your private family space. Stay connected.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Email */}
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter Email"
                required
                className="w-full px-4 py-3 rounded-xl text-sm text-gray-700 placeholder-gray-400 outline-none transition-all border"
                style={{
                  background: 'rgba(255,255,255,0.8)',
                  borderColor: 'rgba(0,0,0,0.08)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
                onFocus={e => e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'}
                onBlur={e => e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'}
              />

              {/* Password */}
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full px-4 py-3 pr-10 rounded-xl text-sm text-gray-700 placeholder-gray-400 outline-none transition-all border"
                  style={{
                    background: 'rgba(255,255,255,0.8)',
                    borderColor: 'rgba(0,0,0,0.08)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                  onFocus={e => e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'}
                  onBlur={e => e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Forgot password */}
              <div className="text-right">
                <Link to="/forgot-password" className="text-xs text-gray-400 hover:text-indigo-500 transition-colors">
                  Forgot Password?
                </Link>
              </div>

              {/* Sign In button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
              >
                {loading
                  ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : 'Sign In'
                }
              </motion.button>
            </form>

            {/* Back to home */}
            <p className="text-center mt-5">
              <Link to="/" className="text-xs text-gray-300 hover:text-gray-500 transition-colors">← Back to home</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
