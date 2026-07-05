import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Edit2, Save, X, Camera, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { memberService, galleryService } from '../services/services'
import Avatar from '../components/common/Avatar'
import Loader from '../components/common/Loader'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

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
    <div className="page-container max-w-3xl mx-auto">
      {/* Cover / Avatar section */}
      <div className="card overflow-hidden mb-6">
        {/* Cover gradient */}
        <div className="h-32 bg-gradient-family relative">
          <div className="absolute inset-0 bg-black/10" />
        </div>
        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="relative inline-block -mt-10 mb-4">
            <Avatar src={profile.avatar} name={profile.name} size={80} />
            {isMe && (
              <>
                <button
                  onClick={() => avatarRef.current?.click()}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-gradient-warm text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                >
                  <Camera size={14} />
                </button>
                <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </>
            )}
          </div>

          {/* Name & Edit */}
          <div className="flex items-start justify-between gap-4">
            <div>
              {editing ? (
                <div className="space-y-2">
                  <input
                    value={form.name || ''}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="input-field text-xl font-extrabold"
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
                    placeholder="Birthday"
                  />
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-extrabold">{profile.nickname || profile.name}</h1>
                  {profile.nickname && <p className="text-light-muted dark:text-dark-muted font-semibold">{profile.name}</p>}
                </>
              )}
              <div className="flex gap-2 mt-2 flex-wrap">
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
            </div>
            {isMe && (
              editing ? (
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-1.5 text-sm">
                    <Save size={14} /> Save
                  </button>
                  <button onClick={() => { setEditing(false); setForm(profile) }} className="btn-ghost flex items-center gap-1.5 text-sm">
                    <X size={14} /> Cancel
                  </button>
                </div>
              ) : (
                <button onClick={() => setEditing(true)} className="btn-secondary flex items-center gap-1.5 text-sm">
                  <Edit2 size={14} /> Edit
                </button>
              )
            )}
          </div>

          {/* Bio */}
          <div className="mt-4">
            {editing ? (
              <textarea
                value={form.bio || ''}
                onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                placeholder="Write something about yourself..."
                rows={3}
                className="input-field resize-none"
              />
            ) : (
              profile.bio && <p className="text-light-muted dark:text-dark-muted font-semibold">{profile.bio}</p>
            )}
          </div>

          {/* Fun Facts */}
          {(profile.funFacts?.length > 0 || editing) && (
            <div className="mt-4">
              <h3 className="font-extrabold mb-2 text-sm">🌟 Fun Facts</h3>
              <div className="flex flex-wrap gap-2 mb-2">
                {(editing ? form.funFacts : profile.funFacts || []).map((fact, i) => (
                  <div key={i} className="badge badge-lavender flex items-center gap-1.5">
                    {fact}
                    {editing && (
                      <button onClick={() => removeFact(i)} className="hover:text-red-400">
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
                  <button onClick={addFact} className="btn-primary text-sm px-3">
                    <Plus size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Photos */}
      {photos.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold">📸 Memories ({photos.length})</h2>
            <Link to="/gallery" className="text-coral text-sm font-bold">See all</Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {photos.map(p => (
              <div key={p._id} className="relative rounded-2xl overflow-hidden aspect-square">
                <img src={p.imageUrl} alt={p.caption} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
