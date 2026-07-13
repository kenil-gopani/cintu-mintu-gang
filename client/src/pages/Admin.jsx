import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, Trash2, UserX, Crown, Copy, Plus, Check, 
  BarChart3, Users, LayoutDashboard, Send, Settings, Image as ImageIcon,
  Calendar, Moon, Sun, Bell
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { adminService, galleryService, eventService } from '../services/services'
import Avatar from '../components/common/Avatar'
import Loader from '../components/common/Loader'
import { Navigate } from 'react-router-dom'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useTheme } from '../hooks/useTheme'

export default function Admin() {
  const { user } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState('dashboard')

  // Global Admin State
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState({ users: 0, memories: 0, events: 0, messages: 0 })
  const [members, setMembers] = useState([])
  const [invites, setInvites] = useState([])
  
  // Basic moderation state
  const [recentMemories, setRecentMemories] = useState([])
  const [recentEvents, setRecentEvents] = useState([])

  // Push Notification State
  const [pushData, setPushData] = useState({ title: '', message: '' })
  const [pushing, setPushing] = useState(false)

  const [copiedCode, setCopiedCode] = useState(null)

  if (user?.role !== 'admin') return <Navigate to="/home" replace />

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [an, mem, inv, gal, ev] = await Promise.all([
        adminService.getAnalytics(),
        adminService.getMembers(),
        adminService.getInvites(),
        galleryService.getAll({ limit: 10 }),
        eventService.getAll()
      ])
      setAnalytics(an.data.analytics || {})
      setMembers(mem.data.members || [])
      setInvites(inv.data.invites || [])
      setRecentMemories(gal.data.memories || [])
      setRecentEvents(ev.data.events || [])
    } catch {
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  // --- Handlers: Users & Invites ---
  const handleRoleChange = async (id, role) => {
    try {
      await adminService.changeRole(id, role)
      setMembers(prev => prev.map(m => m._id === id ? { ...m, role } : m))
      toast.success(`Role updated to ${role}`)
    } catch { toast.error('Role change failed') }
  }

  const handleRemove = async (id) => {
    if (!window.confirm('Remove this member? This cannot be undone.')) return
    try {
      await adminService.removeMember(id)
      setMembers(prev => prev.filter(m => m._id !== id))
      toast.success('Member removed')
    } catch { toast.error('Remove failed') }
  }

  const handleGenerateInvite = async () => {
    try {
      const res = await adminService.createInvite()
      setInvites(prev => [res.data.invite, ...prev])
      toast.success('Invite code generated! 🎉')
    } catch { toast.error('Could not generate invite') }
  }

  const copyCode = (code) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
    toast.success('Invite code copied!')
  }

  // --- Handlers: Moderation ---
  const handleDeleteMemory = async (id) => {
    if (!window.confirm('Force delete this memory globally?')) return
    try {
      // Re-using the gallery service delete which handles admin bypass
      await galleryService.delete(id)
      setRecentMemories(prev => prev.filter(m => m._id !== id))
      toast.success('Memory deleted')
    } catch { toast.error('Failed to delete memory') }
  }

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Force delete this event globally?')) return
    try {
      await eventService.delete(id)
      setRecentEvents(prev => prev.filter(e => e._id !== id))
      toast.success('Event deleted')
    } catch { toast.error('Failed to delete event') }
  }

  const handleFixPasswords = async () => {
    if (!window.confirm('Reset and hash all non-admin passwords to Password@123?')) return
    try {
      const res = await adminService.fixPasswords()
      toast.success(res.data.message)
    } catch { toast.error('Failed to fix passwords') }
  }

  // --- Handlers: Communications ---
  const handleSendPush = async (e) => {
    e.preventDefault()
    setPushing(true)
    try {
      await adminService.pushNotification(pushData)
      toast.success('Broadcast sent to all users! 📣')
      setPushData({ title: '', message: '' })
    } catch {
      toast.error('Failed to send broadcast')
    } finally {
      setPushing(false)
    }
  }

  // --- Render Tabs ---
  const renderDashboard = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6 border-t-4 border-coral bg-gradient-to-b from-coral/5 to-transparent">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-coral/10 rounded-lg text-coral"><Users size={24} /></div>
          </div>
          <p className="text-3xl font-extrabold">{analytics.users}</p>
          <p className="text-sm font-bold text-gray-500 mt-1">Total Members</p>
        </div>
        <div className="card p-6 border-t-4 border-purple-500 bg-gradient-to-b from-purple-500/5 to-transparent">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500"><ImageIcon size={24} /></div>
          </div>
          <p className="text-3xl font-extrabold">{analytics.memories}</p>
          <p className="text-sm font-bold text-gray-500 mt-1">Gallery Memories</p>
        </div>
        <div className="card p-6 border-t-4 border-blue-500 bg-gradient-to-b from-blue-500/5 to-transparent">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Calendar size={24} /></div>
          </div>
          <p className="text-3xl font-extrabold">{analytics.events}</p>
          <p className="text-sm font-bold text-gray-500 mt-1">Family Events</p>
        </div>
        <div className="card p-6 border-t-4 border-teal-500 bg-gradient-to-b from-teal-500/5 to-transparent">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-teal-500/10 rounded-lg text-teal-500"><BarChart3 size={24} /></div>
          </div>
          <p className="text-3xl font-extrabold">{analytics.messages || 0}</p>
          <p className="text-sm font-bold text-gray-500 mt-1">Chat Messages</p>
        </div>
      </div>
    </div>
  )

  const renderUsers = () => (
    <div className="grid lg:grid-cols-2 gap-8 animate-fade-in">
      {/* Members table */}
      <div className="card p-6 shadow-xl border border-gray-100 dark:border-gray-800">
        <h2 className="font-extrabold text-xl mb-6 flex items-center gap-2"><Users className="text-coral" /> Manage Members</h2>
        <div className="space-y-4">
          {members.map(member => (
            <div key={member._id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
              <Avatar src={member.avatar} name={member.name} size={48} className="shadow-md" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base truncate">{member.nickname || member.name}</p>
                <p className="text-xs text-gray-500 font-semibold truncate">{member.email}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {member._id !== user._id && (
                  <>
                    <button
                      onClick={() => handleRoleChange(member._id, member.role === 'admin' ? 'member' : 'admin')}
                      className={`btn-icon shadow-sm ${member.role === 'admin' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500 hover:bg-amber-50 hover:text-amber-500'}`}
                      title={member.role === 'admin' ? 'Demote' : 'Promote'}
                    >
                      <Crown size={16} />
                    </button>
                    <button onClick={() => handleRemove(member._id)} className="btn-icon shadow-sm bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500">
                      <UserX size={16} />
                    </button>
                  </>
                )}
                <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${member.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700'}`}>
                  {member.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite codes */}
      <div className="card p-6 shadow-xl border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-extrabold text-xl flex items-center gap-2">🎟️ Invite Codes</h2>
          <button onClick={handleGenerateInvite} className="btn-primary flex items-center gap-1 text-sm px-4 py-2 shadow-lg shadow-coral/30">
            <Plus size={16} /> Generate
          </button>
        </div>
        {invites.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 dark:bg-black/20 rounded-2xl">
            <p className="text-gray-400 font-bold mb-4">No invite codes yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invites.map(inv => (
              <div key={inv._id} className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all shadow-sm ${inv.isUsed ? 'border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-black/10 opacity-60' : 'border-coral/30 bg-gradient-to-r from-coral/5 to-transparent'}`}>
                <div>
                  <p className="font-mono font-black text-xl tracking-widest text-gray-900 dark:text-white">{inv.code}</p>
                  <p className="text-xs text-gray-500 font-bold mt-1">
                    {inv.isUsed ? `Used by ${inv.usedBy?.nickname || inv.usedBy?.name}` : `Expires ${inv.expiresAt ? format(new Date(inv.expiresAt), 'MMM d') : 'never'}`}
                  </p>
                </div>
                {!inv.isUsed && (
                  <button onClick={() => copyCode(inv.code)} className="btn-icon bg-white dark:bg-dark-card shadow-md text-coral hover:scale-110 transition-transform">
                    {copiedCode === inv.code ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                )}
                {inv.isUsed && <span className="bg-gray-200 dark:bg-gray-800 text-gray-500 px-3 py-1 rounded-full text-xs font-bold">Used</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const renderContent = () => (
    <div className="grid lg:grid-cols-2 gap-8 animate-fade-in">
      <div className="card p-6">
        <h2 className="font-extrabold text-xl mb-6 flex items-center gap-2"><ImageIcon className="text-purple-500" /> Recent Gallery Uploads</h2>
        <div className="space-y-4">
          {recentMemories.map(memory => (
            <div key={memory._id} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-black/20">
              <img src={memory.imageUrl} className="w-16 h-16 object-cover rounded-lg shadow-sm" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{memory.caption || 'No caption'}</p>
                <p className="text-xs text-gray-500 font-semibold">By {memory.uploadedBy?.nickname || memory.uploadedBy?.name}</p>
              </div>
              <button onClick={() => handleDeleteMemory(memory._id)} className="btn-icon text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 size={16}/></button>
            </div>
          ))}
        </div>
      </div>
      
      <div className="card p-6">
        <h2 className="font-extrabold text-xl mb-6 flex items-center gap-2"><Calendar className="text-blue-500" /> All Events</h2>
        <div className="space-y-4">
          {recentEvents.map(event => (
            <div key={event._id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-black/20">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex flex-col items-center justify-center font-bold">
                <span className="text-xs uppercase">{format(new Date(event.date), 'MMM')}</span>
                <span className="text-lg leading-none">{format(new Date(event.date), 'dd')}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base truncate">{event.title}</p>
                <p className="text-xs text-gray-500 font-semibold truncate">By {event.createdBy?.nickname || event.createdBy?.name}</p>
              </div>
              <button onClick={() => handleDeleteEvent(event._id)} className="btn-icon text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 size={16}/></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderCommunications = () => (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="card p-8 shadow-2xl border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-coral/10 text-coral rounded-xl flex items-center justify-center"><Bell size={24}/></div>
          <div>
            <h2 className="font-extrabold text-2xl">Global Broadcast</h2>
            <p className="text-gray-500 font-semibold text-sm">Send a push notification to all family members.</p>
          </div>
        </div>
        
        <form onSubmit={handleSendPush} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Notification Title (Optional)</label>
            <input type="text" value={pushData.title} onChange={e => setPushData({...pushData, title: e.target.value})} placeholder="e.g. 🚨 Emergency or 🎉 Reunion Update" className="input-field w-full h-12 text-base bg-gray-50 dark:bg-black/20" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Message Content *</label>
            <textarea required value={pushData.message} onChange={e => setPushData({...pushData, message: e.target.value})} placeholder="Type your broadcast message here..." className="input-field w-full h-32 text-base resize-none bg-gray-50 dark:bg-black/20" />
          </div>
          <button type="submit" disabled={pushing} className="btn-primary w-full h-14 text-lg shadow-xl shadow-coral/30 flex items-center justify-center gap-2">
            {pushing ? <Loader scale={0.2} /> : <><Send size={20} /> Send to {analytics.users} Users</>}
          </button>
        </form>
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="card p-8 shadow-xl border border-gray-100 dark:border-gray-800">
        <h2 className="font-extrabold text-2xl mb-8 flex items-center gap-3"><Settings className="text-gray-500" /> Platform Settings</h2>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div>
              <p className="font-bold text-lg">System Theme Preference</p>
              <p className="text-sm font-semibold text-gray-500">Toggle your active dark mode state.</p>
            </div>
            <button onClick={toggleTheme} className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors ${isDark ? 'bg-indigo-600 text-white' : 'bg-yellow-400 text-white'}`}>
              {isDark ? <Moon size={24} /> : <Sun size={24} />}
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30">
            <div>
              <p className="font-bold text-lg text-red-600 dark:text-red-400">Fix Account Passwords</p>
              <p className="text-sm font-semibold text-red-500/70">Reset all member passwords to the hashed default (Password@123).</p>
            </div>
            <button onClick={handleFixPasswords} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-colors">Fix Passwords</button>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30 mt-4">
            <div>
              <p className="font-bold text-lg text-red-600 dark:text-red-400">Danger Zone</p>
              <p className="text-sm font-semibold text-red-500/70">Wipe all gallery data or reset platform (Coming soon).</p>
            </div>
            <button disabled className="px-6 py-2 bg-red-200 dark:bg-red-900/50 text-red-600 dark:text-red-400 font-bold rounded-xl opacity-50 cursor-not-allowed">Reset Platform</button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="page-container max-w-7xl mx-auto py-8">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-black dark:from-white dark:to-gray-300 rounded-2xl flex items-center justify-center text-white dark:text-black shadow-xl">
          <Shield size={32} />
        </div>
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Admin Command Center</h1>
          <p className="text-light-muted dark:text-dark-muted font-semibold mt-1">Manage and moderate your family platform.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader scale={0.5} />
      ) : (
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Navigation Sidebar */}
          <div className="w-full md:w-64 shrink-0">
            <div className="card p-2 shadow-lg sticky top-24">
              <nav className="space-y-1">
                {[
                  { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
                  { id: 'users', icon: Users, label: 'Users & Invites' },
                  { id: 'content', icon: ImageIcon, label: 'Content Moderation' },
                  { id: 'comms', icon: Bell, label: 'Push Notifications' },
                  { id: 'settings', icon: Settings, label: 'Settings' },
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${activeTab === tab.id ? 'bg-gradient-warm text-white shadow-md shadow-coral/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                  >
                    <tab.icon size={18} />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                {activeTab === 'dashboard' && renderDashboard()}
                {activeTab === 'users' && renderUsers()}
                {activeTab === 'content' && renderContent()}
                {activeTab === 'comms' && renderCommunications()}
                {activeTab === 'settings' && renderSettings()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}
