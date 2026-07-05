import { createContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount — try to restore session
  useEffect(() => {
    const token = localStorage.getItem('cmg-token') || sessionStorage.getItem('cmg-token')
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      api.get('/auth/me')
        .then(res => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem('cmg-token')
          sessionStorage.removeItem('cmg-token')
          delete api.defaults.headers.common['Authorization']
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email, password, rememberMe) => {
    const res = await api.post('/auth/login', { email, password, rememberMe })
    const { token, user: userData } = res.data
    
    if (rememberMe) {
      localStorage.setItem('cmg-token', token)
    } else {
      sessionStorage.setItem('cmg-token', token)
    }
    
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(userData)
    toast.success(`Welcome back, ${userData.nickname || userData.name}! 🎉`)
    return userData
  }, [])

  const register = useCallback(async (data) => {
    const res = await api.post('/auth/register', data)
    const { token, user: userData } = res.data
    // Usually login after register is rememberMe true or false depending on UI, but by default false
    sessionStorage.setItem('cmg-token', token)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(userData)
    toast.success(`Welcome to the gang, ${userData.nickname || userData.name}! 🏠 Check your email to verify.`)
    return userData
  }, [])

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout') } catch {}
    localStorage.removeItem('cmg-token')
    sessionStorage.removeItem('cmg-token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
    toast.success('See you soon! 👋')
  }, [])

  const updateUser = useCallback((updates) => {
    setUser(prev => ({ ...prev, ...updates }))
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}
