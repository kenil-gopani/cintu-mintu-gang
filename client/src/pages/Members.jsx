import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Search, CheckCircle } from 'lucide-react'
import { memberService } from '../services/services'
import { useSocket } from '../hooks/useSocket'
import Avatar from '../components/common/Avatar'
import Loader from '../components/common/Loader'

// Generate a soft pastel gradient background per member based on name
const COVER_GRADIENTS = [
  'linear-gradient(135deg, #fce4ec, #f8bbd0)',
  'linear-gradient(135deg, #e3f2fd, #bbdefb)',
  'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
  'linear-gradient(135deg, #fff3e0, #ffe0b2)',
  'linear-gradient(135deg, #f3e5f5, #e1bee7)',
  'linear-gradient(135deg, #e0f7fa, #b2ebf2)',
  'linear-gradient(135deg, #fafafa, #eeeeee)',
  'linear-gradient(135deg, #fff8e1, #ffecb3)',
]

const EXCLUDED_NAMES = [
  'nani', 'baa', 'bharat', 'bharat sheta', 'bipin', 'bipin gopani', 
  'chetan', 'chetan sutariya', 'nana', 'dada', 'jagruti', 'jagruti sheta', 
  'jayshree', 'jayshree sutariya', 'minaxi', 'minaxi gopani', 
  'rajesh', 'rajesh miyani', 'shital', 'shital miyani'
]

export default function Members() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const { onlineUsers } = useSocket()

  useEffect(() => {
    memberService.getAll()
      .then(r => setMembers(r.data.users || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = members.filter(m => {
    const nameLower = (m.name || '').toLowerCase()
    const nicknameLower = (m.nickname || '').toLowerCase()
    
    if (EXCLUDED_NAMES.includes(nameLower) || EXCLUDED_NAMES.includes(nicknameLower)) {
      return false
    }

    return nameLower.includes(query.toLowerCase()) || nicknameLower.includes(query.toLowerCase())
  })

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-light-text dark:text-dark-text">Members</h1>
        <p className="text-sm text-light-muted dark:text-dark-muted mt-1">
          {filtered.length} members in the gang
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-light-sub dark:text-dark-sub" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search members..."
          className="input-field pl-9"
        />
      </div>

      {loading ? <Loader /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((member, i) => {
            const isOnline = onlineUsers.includes(member._id)
            const coverGrad = COVER_GRADIENTS[member.name?.charCodeAt(0) % COVER_GRADIENTS.length]
            return (
              <motion.div
                key={member._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 28 }}
              >
                <Link to={`/profile/${member._id}`}>
                  <div className="member-card group">
                    {/* Cover photo area */}
                    <div className="relative overflow-hidden" style={{ height: 160 }}>
                      {member.avatar ? (
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: coverGrad }}>
                          <span className="text-5xl font-black text-white/70 select-none">
                            {member.name?.[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      {/* Online indicator */}
                      {isOnline && (
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-white/90 dark:bg-dark-card/90 backdrop-blur-sm rounded-full px-2 py-0.5 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                          <span className="text-[10px] font-semibold text-green-700 dark:text-green-400">Online</span>
                        </div>
                      )}
                      {/* Admin crown */}
                      {member.role === 'admin' && (
                        <div className="absolute top-2.5 left-2.5 bg-amber-400 text-white rounded-full px-2 py-0.5 text-[10px] font-bold shadow-sm">
                          👑 Admin
                        </div>
                      )}
                    </div>

                    {/* Card body */}
                    <div className="member-card-body">
                      <div className="member-card-name">
                        <span className="truncate">{member.nickname || member.name}</span>
                        <CheckCircle size={16} className="text-verified shrink-0 fill-verified text-white" style={{ fill: '#22C55E', stroke: 'white', strokeWidth: 2 }} />
                      </div>
                      {member.nickname && (
                        <p className="text-xs text-light-sub dark:text-dark-sub">{member.name}</p>
                      )}
                      {member.bio ? (
                        <p className="text-xs text-light-muted dark:text-dark-muted line-clamp-2 mt-0.5">{member.bio}</p>
                      ) : (
                        <p className="text-xs text-light-sub dark:text-dark-sub mt-0.5 italic">Member of the gang 🏠</p>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-3">🔍</div>
          <p className="font-semibold text-light-muted dark:text-dark-muted">No members found</p>
        </div>
      )}
    </div>
  )
}
