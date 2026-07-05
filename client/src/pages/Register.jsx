import { useState, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Mail, Lock, Key, Calendar, Eye, EyeOff, ArrowRight, Camera } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { memberService } from '../services/services'
import toast from 'react-hot-toast'
import Avatar from '../components/common/Avatar'

export default function Register() {
  const [params] = useSearchParams()
  const [form, setForm] = useState({
    name: '', nickname: '', email: '', password: '', birthday: '',
    inviteCode: params.get('code') || '',
    role: 'member' // 'member' or 'guest'
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const { register, updateUser } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.role === 'member' && !form.inviteCode.trim()) {
      return toast.error('An invite code is required to join as a member 🔒')
    }

    setLoading(true)
    try {
      // 1. Register user
      const userData = await register({ 
        ...form, 
        inviteCode: form.role === 'member' ? form.inviteCode.trim().toUpperCase() : '' 
      })

      // 2. Upload avatar if selected
      if (avatarFile && userData?._id) {
        const formData = new FormData()
        formData.append('avatar', avatarFile)
        const res = await memberService.uploadAvatar(userData._id, formData)
        updateUser({ avatar: res.data.avatar })
      }

      navigate('/home')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  const fieldStyle = {
    background: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.15)',
    color: '#E2E8F0',
  }

  return (
    <div className="relative min-h-screen bg-dark-bg flex items-center justify-center p-4 overflow-hidden py-10">
      <div className="blob blob-coral w-80 h-80 top-[-80px] left-[-60px] animate-float" />
      <div className="blob blob-purple w-72 h-72 bottom-[-60px] right-[-40px] animate-float" style={{ animationDelay: '1.5s' }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="glass rounded-4xl p-8 text-white">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🎉</div>
            <h1 className="text-2xl font-extrabold gradient-text">Join the Gang!</h1>
            <p className="text-dark-muted text-sm mt-1 font-semibold">Create your profile</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center mb-2">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <Avatar src={avatarPreview} name={form.name || '?'} size={80} />
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={24} className="text-white" />
                </div>
              </div>
              <p className="text-xs text-dark-muted mt-2 font-semibold">Add profile picture</p>
              <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
            </div>

            {/* Role Selection */}
            <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, role: 'member' }))}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${form.role === 'member' ? 'bg-white/15 text-white' : 'text-dark-muted hover:text-white'}`}
              >
                Family Member
              </button>
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, role: 'guest' }))}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${form.role === 'guest' ? 'bg-white/15 text-white' : 'text-dark-muted hover:text-white'}`}
              >
                Guest
              </button>
            </div>

            <div className="space-y-3">
              {[
                { name: 'name',       icon: User,     placeholder: 'Full name',          type: 'text' },
                { name: 'nickname',   icon: User,     placeholder: 'Nickname (optional)', type: 'text', required: false },
                { name: 'email',      icon: Mail,     placeholder: 'Email address',      type: 'email' },
                { name: 'birthday',   icon: Calendar, placeholder: 'Birthday',           type: 'date' },
              ].map(({ name, icon: Icon, placeholder, type, required = true }) => (
                <div key={name} className="relative">
                  <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-muted" />
                  <input
                    type={type}
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    required={required}
                    className="input-field pl-9 text-sm"
                    style={fieldStyle}
                  />
                </div>
              ))}

              {/* Password */}
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-muted" />
                <input
                  type={showPw ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create password (min 8 chars)"
                  required
                  minLength={8}
                  className="input-field pl-9 pr-10 text-sm"
                  style={fieldStyle}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-muted hover:text-white"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Invite code (Only for members) */}
              <AnimatePresence>
                {form.role === 'member' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="relative overflow-hidden"
                  >
                    <Key size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-coral" />
                    <input
                      type="text"
                      name="inviteCode"
                      value={form.inviteCode}
                      onChange={e => setForm(p => ({ ...p, inviteCode: e.target.value.toUpperCase() }))}
                      placeholder="Invite code (required for members)"
                      required={form.role === 'member'}
                      maxLength={8}
                      className="input-field pl-9 text-sm font-mono tracking-widest text-center"
                      style={{ ...fieldStyle, borderColor: form.inviteCode ? 'rgba(255,107,107,0.5)' : 'rgba(255,255,255,0.15)' }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.97 }}
              className="btn-primary w-full flex items-center justify-center gap-2 text-base mt-2"
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <><span>Join the Gang</span><ArrowRight size={18} /></>
              }
            </motion.button>
          </form>

          <p className="text-center text-sm text-dark-muted mt-5 font-semibold">
            Already a member?{' '}
            <Link to="/login" className="text-coral hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
