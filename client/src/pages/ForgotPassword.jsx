import { useState } from 'react'
import Loader from '../components/common/Loader'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowRight } from 'lucide-react'
import { authService } from '../services/services'
import { toast } from 'sonner'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authService.forgotPassword(email)
      setSent(true)
      toast.success('Password reset link sent!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
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
          <div className="text-5xl mb-3">🔑</div>
          <h1 className="text-2xl font-extrabold gradient-text">Reset Password</h1>
          
          {sent ? (
            <div className="mt-4">
              <p className="text-dark-muted text-sm font-semibold mb-6">
                If an account exists with {email}, we've sent a password reset link to it. Check your inbox!
              </p>
              <Link to="/login" className="btn-primary w-full flex items-center justify-center text-base">
                Return to Login
              </Link>
            </div>
          ) : (
            <>
              <p className="text-dark-muted text-sm mt-1 font-semibold mb-6">
                Enter your email and we'll send you a link to reset your password.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email address"
                    required
                    className="input-field pl-10"
                    style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)', color: '#E2E8F0' }}
                  />
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
                    <><span>Send Reset Link</span><ArrowRight size={18} /></>
                  )}
                </motion.button>
              </form>
            </>
          )}

          <p className="text-center mt-6">
            <Link to="/login" className="text-sm text-dark-muted hover:text-white font-semibold">
              ← Back to Login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
