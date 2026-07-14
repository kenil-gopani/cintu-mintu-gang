import { useState } from 'react'
import Loader from '../components/common/Loader'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { authService } from '../services/services'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'sonner'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token')
  
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const navigate = useNavigate()
  const { updateUser } = useAuth() // Or we could just redirect to login

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!token) return toast.error('Reset token missing.')
    
    setLoading(true)
    try {
      const res = await authService.resetPassword(token, password)
      
      // The backend returns a JWT token to log the user in immediately
      localStorage.setItem('cmg-token', res.data.token)
      updateUser(res.data.user) // though context doesn't have a direct "set token" besides login. 
      // Safest is to redirect to login so AuthContext picks up token on reload, or just force reload
      
      toast.success('Password reset successfully! 🚀')
      setTimeout(() => {
        window.location.href = '/home'
      }, 1000)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="glass rounded-4xl p-8 text-white text-center max-w-sm w-full">
          <div className="text-5xl mb-3">❌</div>
          <h1 className="text-2xl font-extrabold mb-2">Invalid Link</h1>
          <p className="text-dark-muted text-sm mb-6 font-semibold">
            The password reset link is missing or invalid.
          </p>
          <Link to="/forgot-password" className="btn-primary w-full inline-block">Request New Link</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-dark-bg flex items-center justify-center p-4 overflow-hidden">
      <div className="blob blob-primary w-80 h-80 top-[-60px] left-[-60px] animate-float" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="glass rounded-4xl p-8 text-white text-center">
          <div className="text-5xl mb-3">🔐</div>
          <h1 className="text-2xl font-extrabold gradient-text">New Password</h1>
          <p className="text-dark-muted text-sm mt-1 font-semibold mb-6">
            Enter your new secure password below.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-muted" />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="New password (min 8 chars)"
                required
                minLength={8}
                className="input-field pl-10 pr-11"
                style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)', color: '#E2E8F0' }}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-dark-muted hover:text-white"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.97 }}
              className="btn-primary w-full flex items-center justify-center gap-2 text-base"
            >
              {loading ? (
                <Loader scale={0.2} />
              ) : (
                <><span>Save Password</span><ArrowRight size={18} /></>
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
