import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const { login }   = useAuth()
  const navigate    = useNavigate()

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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 40%, #ECFDF5 100%)' }}
    >
      {/* Blurred gradient blobs */}
      <div className="absolute w-96 h-96 rounded-full opacity-40 -top-20 -right-20 blur-3xl"
        style={{ background: 'linear-gradient(135deg, #a5b4fc, #c4b5fd)' }} />
      <div className="absolute w-80 h-80 rounded-full opacity-30 -bottom-16 -left-16 blur-3xl"
        style={{ background: 'linear-gradient(135deg, #6ee7b7, #34d399)' }} />
      <div className="absolute w-48 h-48 rounded-full opacity-20 top-1/3 left-1/4 blur-2xl"
        style={{ background: '#818cf8' }} />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-white/60">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 text-2xl shadow-md"
              style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
              🏠
            </div>
            <h1 className="text-2xl font-black text-gray-900">Hello Again!</h1>
            <p className="text-gray-400 text-sm mt-1 font-medium">Welcome back, sign in to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Email */}
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full pl-10 pr-11 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Forgot password */}
            <div className="text-right">
              <Link to="/forgot-password" className="text-xs font-semibold text-indigo-500 hover:text-indigo-700">
                Forgot Password?
              </Link>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.97 }}
              className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 hover:shadow-lg active:scale-95 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #10B981, #14B8A6)' }}
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : 'Sign In'
              }
            </motion.button>
          </form>



          <p className="text-center mt-2">
            <Link to="/" className="text-xs text-gray-300 hover:text-gray-500 transition-colors">← Back to home</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
