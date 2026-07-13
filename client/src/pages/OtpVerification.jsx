import { useState } from 'react'
import Loader from '../components/common/Loader'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { authService } from '../services/services'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function OtpVerification() {
  const [params] = useSearchParams()
  const emailParam = params.get('email')
  const purposeParam = params.get('purpose') || 'email-verify'

  const [email, setEmail] = useState(emailParam || '')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { updateUser } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !otp) return toast.error('Email and OTP are required.')
    
    setLoading(true)
    try {
      const res = await authService.verifyOtp(email, otp, purposeParam)
      toast.success(res.data.message)
      
      // If we are resetting password via OTP (not implemented directly, but possible)
      // Usually we just mark email verified here. 
      if (purposeParam === 'email-verify') {
        updateUser({ isEmailVerified: true })
        navigate('/home')
      } else {
        // If it's a login verification or password reset OTP
        localStorage.setItem('cmg-token', res.data.token)
        navigate('/home')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email) return toast.error('Enter email first.')
    try {
      await authService.sendOtp(email, purposeParam)
      toast.success('OTP sent! Check your inbox.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send OTP.')
    }
  }

  return (
    <div className="relative min-h-screen bg-dark-bg flex items-center justify-center p-4 overflow-hidden">
      <div className="blob blob-purple w-80 h-80 top-[-60px] right-[-60px] animate-float" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="glass rounded-4xl p-8 text-white text-center">
          <div className="text-5xl mb-3">🔢</div>
          <h1 className="text-2xl font-extrabold gradient-text">Enter OTP</h1>
          <p className="text-dark-muted text-sm mt-1 font-semibold mb-6">
            Enter the 6-digit code sent to your email.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {!emailParam && (
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="input-field"
                style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)', color: '#E2E8F0' }}
              />
            )}
            
            <input
              type="text"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="000000"
              required
              maxLength={6}
              className="input-field text-center text-2xl font-mono tracking-widest"
              style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)', color: '#E2E8F0' }}
            />

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.97 }}
              className="btn-primary w-full"
            >
              {loading ? <Loader scale={0.2} /> : 'Verify OTP'}
            </motion.button>
          </form>

          <div className="mt-4">
            <button onClick={handleResend} className="text-coral text-sm font-semibold hover:underline">
              Resend OTP
            </button>
          </div>

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
