import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Edit2, Save, X, Camera, Plus, CheckCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { memberService, galleryService } from '../services/services'
import Avatar from '../components/common/Avatar'
import Loader from '../components/common/Loader'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const COVER_GRADIENTS = [
  'linear-gradient(135deg, #fce4ec, #f8bbd0)',
  'linear-gradient(135deg, #e3f2fd, #bbdefb)',
  'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
  'linear-gradient(135deg, #fff3e0, #ffe0b2)',
  'linear-gradient(135deg, #f3e5f5, #e1bee7)',
  'linear-gradient(135deg, #e0f7fa, #b2ebf2)',
]

export default function Profile() {
  const { id } = useParams()
  const { user, updateUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [photos, setPhotos] = useState([])
  const [newFact, setNewFact] = useState('')
  const avatarRef = useRef()

  const targetId = id || user?._id
  const isMe = targetId === user?._id
  const canEdit = isMe || user?.role === 'admin'

  const coverGrad = COVER_GRADIENTS[profile?.name?.charCodeAt(0) % COVER_GRADIENTS.length] || COVER_GRADIENTS[0]

  useEffect(() => {
    if (!targetId) return
    setLoading(true)
    memberService.getOne(targetId)
      .then(r => {
        setProfile(r.data.user)
        setForm(r.data.user)
      })
      .catch(() => toast.error('Could not load profile'))
      .finally(() => setLoading(false))
    galleryService.getAll(1).then(r => {
      const mine = (r.data.memories || []).filter(m => m.uploadedBy?._id === targetId || m.uploadedBy === targetId)
      setPhotos(mine.slice(0, 9))
    }).catch(() => {})
  }, [targetId])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await memberService.update(user._id, {
        name: form.name,
        nickname: form.nickname,
        bio: form.bio,
        funFacts: form.funFacts,
        birthday: form.birthday,
      })
      setProfile(res.data.user)
      updateUser(res.data.user)
      setEditing(false)
      toast.success('Profile updated! ✨')
    } catch { toast.error('Update failed') }
    finally { setSaving(false) }
  }

  const handleAvatarChange = async (e) => {
    const f = e.target.files[0]
    if (!f) return
    const fd = new FormData()
    fd.append('avatar', f)
    try {
      const res = await memberService.uploadAvatar(user._id, fd)
      setProfile(prev => ({ ...prev, avatar: res.data.avatar }))
      updateUser({ avatar: res.data.avatar })
      toast.success('Avatar updated! 📸')
    } catch { toast.error('Avatar upload failed') }
  }

  const addFact = () => {
    if (!newFact.trim()) return
    setForm(p => ({ ...p, funFacts: [...(p.funFacts || []), newFact.trim()] }))
    setNewFact('')
  }

  const removeFact = (i) => {
    setForm(p => ({ ...p, funFacts: p.funFacts.filter((_, idx) => idx !== i) }))
  }

  if (loading) return <Loader fullscreen />
  if (!profile) return <div className="page-container text-center py-20 text-light-muted dark:text-dark-muted">Member not found</div>

  return (
    <div className="page-container max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

        {/* Profile Card */}
        <div className="card overflow-hidden mb-5">
          {/* Cover Banner */}
          <div className="relative h-36" style={{ background: coverGrad }}>
            {/* Edit/Save buttons */}
            {canEdit && (
              <div className="absolute top-3 right-3 flex gap-2">
                {editing ? (
                  <>
                    <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-coral rounded-lg text-xs font-semibold shadow hover:shadow-md transition-all">
                      <Save size={13} /> Save
                    </button>
                    <button onClick={() => { setEditing(false); setForm(profile) }} className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-light-muted rounded-lg text-xs font-semibold shadow hover:shadow-md transition-all">
                      <X size={13} /> Cancel
                    </button>
                  </>
                ) : (
                  <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-light-text rounded-lg text-xs font-semibold shadow hover:shadow-md transition-all">
                    <Edit2 size={13} /> Edit
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="px-5 pb-5">
            {/* Avatar overlapping cover */}
            <div className="relative -mt-10 mb-3 inline-block">
              <div className="w-20 h-20 rounded-2xl ring-4 ring-white dark:ring-dark-card overflow-hidden shadow-card">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white" style={{ background: coverGrad }}>
                    {profile.name?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              {canEdit && (
                <>
                  <button
                    onClick={() => avatarRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-coral text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                  >
                    <Camera size={12} />
                  </button>
                  <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </>
              )}
            </div>

            {/* Name & info */}
            {editing ? (
              <div className="space-y-2 mb-3">
                <input
                  value={form.name || ''}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="input-field text-base font-bold"
                  placeholder="Full name"
                />
                <input
                  value={form.nickname || ''}
                  onChange={e => setForm(p => ({ ...p, nickname: e.target.value }))}
                  className="input-field"
                  placeholder="Nickname"
                />
                <input
                  type="date"
                  value={form.birthday ? new Date(form.birthday).toISOString().split('T')[0] : ''}
                  onChange={e => setForm(p => ({ ...p, birthday: e.target.value }))}
                  className="input-field"
                />
              </div>
            ) : (
              <div className="mb-3">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-light-text dark:text-dark-text">
                    {profile.nickname || profile.name}
                  </h1>
                  <CheckCircle size={18} style={{ fill: '#22C55E', stroke: 'white', strokeWidth: 2 }} className="shrink-0" />
                </div>
                {profile.nickname && (
                  <p className="text-sm text-light-muted dark:text-dark-muted">{profile.name}</p>
                )}
              </div>
            )}

            {/* Badges */}
            <div className="flex gap-2 flex-wrap mb-3">
              <span className={`badge ${profile.role === 'admin' ? 'badge-coral' : 'badge-teal'}`}>
                {profile.role === 'admin' ? '👑 Admin' : '👤 Member'}
              </span>
              {profile.birthday && (
                <span className="badge badge-gold">
                  🎂 {format(new Date(profile.birthday), 'MMMM d')}
                </span>
              )}
              <span className="badge badge-lavender">
                📅 Joined {format(new Date(profile.joinedAt || Date.now()), 'MMM yyyy')}
              </span>
            </div>

            {/* Bio */}
            <div>
              {editing ? (
                <textarea
                  value={form.bio || ''}
                  onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                  placeholder="Write something about yourself..."
                  rows={3}
                  className="input-field resize-none text-sm"
                />
              ) : (
                profile.bio
                  ? <p className="text-sm text-light-muted dark:text-dark-muted leading-relaxed">{profile.bio}</p>
                  : <p className="text-sm text-light-sub dark:text-dark-sub italic">No bio yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Fun Facts */}
        {(profile.funFacts?.length > 0 || editing) && (
          <div className="card p-5 mb-5">
            <h3 className="section-title">🌟 Fun Facts</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {(editing ? form.funFacts : profile.funFacts || []).map((fact, i) => (
                <div key={i} className="badge badge-lavender flex items-center gap-1.5">
                  {fact}
                  {editing && (
                    <button onClick={() => removeFact(i)} className="hover:text-red-500 ml-0.5">
                      <X size={10} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {editing && (
              <div className="flex gap-2">
                <input
                  value={newFact}
                  onChange={e => setNewFact(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addFact()}
                  placeholder="Add a fun fact..."
                  className="input-field flex-1 text-sm"
                />
                <button onClick={addFact} className="btn-primary px-3 py-2">
                  <Plus size={15} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Photos */}
        {photos.length > 0 && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title mb-0">📸 Memories ({photos.length})</h3>
              <Link to="/gallery" className="text-xs font-semibold text-coral hover:underline">See all</Link>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {photos.map(p => (
                <div key={p._id} className="relative rounded-xl overflow-hidden aspect-square">
                  <img src={p.imageUrl} alt={p.caption} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </div>
              ))}
            </div>
          </div>
        )}

      </motion.div>
    </div>
  )
}
