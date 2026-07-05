import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { memberService } from '../services/services'
import { useSocket } from '../hooks/useSocket'
import Avatar from '../components/common/Avatar'
import Loader from '../components/common/Loader'

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

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(query.toLowerCase()) ||
    (m.nickname || '').toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold gradient-text">👨‍👩‍👧‍👦 Family Members</h1>
        <p className="text-light-muted dark:text-dark-muted font-semibold mt-1">
          {members.length} members in the gang
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-light-muted dark:text-dark-muted" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search members..."
          className="input-field pl-10"
        />
      </div>

      {loading ? <Loader /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((member, i) => {
            const isOnline = onlineUsers.includes(member._id)
            const flipCard = i % 3 === 0 // Some cards show fun facts on hover flip
            return (
              <motion.div
                key={member._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group perspective-1000"
              >
                <Link to={`/profile/${member._id}`}>
                  <div className="card card-hover p-5 flex flex-col items-center text-center gap-3 relative overflow-hidden">
                    {/* Gradient blob */}
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-warm opacity-10 translate-x-8 -translate-y-8" />

                    <div className="relative">
                      <Avatar
                        src={member.avatar}
                        name={member.name}
                        size={72}
                        online={isOnline}
                      />
                    </div>

                    <div>
                      <h3 className="font-extrabold text-base leading-tight">
                        {member.nickname || member.name}
                      </h3>
                      {member.nickname && (
                        <p className="text-xs text-light-muted dark:text-dark-muted">{member.name}</p>
                      )}
                      <span className={`badge mt-1 ${member.role === 'admin' ? 'badge-coral' : 'badge-teal'}`}>
                        {member.role === 'admin' ? '👑 Admin' : '👤 Member'}
                      </span>
                    </div>

                    {/* Online/offline status */}
                    <div className={`flex items-center gap-1.5 text-xs font-bold ${isOnline ? 'text-green-500' : 'text-light-muted dark:text-dark-muted'}`}>
                      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
                      {isOnline ? 'Online' : 'Offline'}
                    </div>

                    {/* Bio preview */}
                    {member.bio && (
                      <p className="text-xs text-light-muted dark:text-dark-muted line-clamp-2 font-semibold">
                        {member.bio}
                      </p>
                    )}

                    {/* Fun facts on hover */}
                    {member.funFacts?.length > 0 && (
                      <div className="absolute inset-0 bg-gradient-warm rounded-3xl p-4 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <p className="text-white font-extrabold text-sm mb-2">🌟 Fun Fact</p>
                        <p className="text-white/90 text-xs font-semibold text-center">
                          {member.funFacts[0]}
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
