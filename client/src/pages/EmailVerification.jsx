import { useEffect, useState } from 'react'
import Loader from '../components/common/Loader'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { authService } from '../services/services'

export default function EmailVerification() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [status, setStatus] = useState('verifying') // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Verification token missing.')
      return
    }

    authService.verifyEmail(token)
      .then(res => {
        setStatus('success')
        setMessage(res.data.message)
      })
      .catch(err => {
        setStatus('error')
        setMessage(err.response?.data?.message || 'Verification failed. The link may have expired.')
      })
  }, [token])

  return (
    <div className="relative min-h-screen bg-dark-bg flex items-center justify-center p-4 overflow-hidden">
      <div className={`blob w-80 h-80 top-[-60px] left-[-60px] animate-float ${status === 'success' ? 'blob-teal' : 'blob-coral'}`} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="glass rounded-4xl p-8 text-white text-center">
          {status === 'verifying' && (
            <>
              <Loader scale={0.5} />
              <h1 className="text-2xl font-extrabold mb-2">Verifying Email...</h1>
              <p className="text-dark-muted text-sm font-semibold">Please wait a moment.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-6xl mb-4">✅</div>
              <h1 className="text-2xl font-extrabold text-teal-400 mb-2">Email Verified!</h1>
              <p className="text-dark-muted text-sm font-semibold mb-6">{message}</p>
              <Link to="/home" className="btn-primary w-full inline-block">Go to Home</Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-6xl mb-4">❌</div>
              <h1 className="text-2xl font-extrabold text-red-400 mb-2">Verification Failed</h1>
              <p className="text-dark-muted text-sm font-semibold mb-6">{message}</p>
              <Link to="/login" className="btn-primary w-full inline-block">Return to Login</Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
