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

          {/* Right Side: Login Form */}
          <div className="md:w-1/2 p-10 lg:p-14 flex flex-col justify-center">
            
            <div className="mb-8">
              <h1 className="text-3xl lg:text-4xl font-bold text-[#1e293b] mb-3 leading-tight tracking-tight">
                Welcome back<br />to Family Hub!
              </h1>
              <p className="text-gray-600 font-medium">Organize your family's life, stay connected.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter Email"
                  required
                  className="w-full px-5 py-3.5 rounded-full bg-white/90 border border-white/40 text-gray-800 text-sm font-medium shadow-sm outline-none focus:ring-2 focus:ring-teal-500/50 transition-all placeholder-gray-400"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full px-5 py-3.5 pr-12 rounded-full bg-white/90 border border-white/40 text-gray-800 text-sm font-medium shadow-sm outline-none focus:ring-2 focus:ring-teal-500/50 transition-all placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-6 py-3.5 rounded-full font-bold text-white text-base transition-all hover:opacity-90 shadow-lg active:scale-95 flex items-center justify-center bg-[#219673]"
              >
                {loading
                  ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : 'Sign In'
                }
              </motion.button>
            </form>

          </div>
        </div>
      </motion.div>
    </div>
  )
}
