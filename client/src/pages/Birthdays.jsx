import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { memberService } from '../services/services'
import Avatar from '../components/common/Avatar'
import Loader from '../components/common/Loader'
import { format, isToday, differenceInDays, setYear } from 'date-fns'
import confetti from 'canvas-confetti'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import { useSocket } from '../hooks/useSocket'

function getNextBirthday(birthday) {
  const today = new Date()
  const bday = new Date(birthday)
  let next = setYear(bday, today.getFullYear())
  if (next < today) next = setYear(bday, today.getFullYear() + 1)
  return next
}

export default function Birthdays() {
  const { user } = useAuth()
  const { socket } = useSocket()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    memberService.getAll()
      .then(r => {
        const withBday = (r.data.users || [])
          .filter(m => m.birthday)
          .map(m => ({ ...m, nextBirthday: getNextBirthday(m.birthday) }))
          .sort((a, b) => a.nextBirthday - b.nextBirthday)
        setMembers(withBday)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleWish = (member) => {
    confetti({ particleCount: 100, spread: 60, origin: { y: 0.7 }, colors: ['#FF6B6B','#FFD700','#4ECDC4'] })
    socket?.emit('send-wish', { toUserId: member._id, fromName: user.nickname || user.name })
    toast.success(`🎉 Wished ${member.nickname || member.name} a Happy Birthday!`)
  }

  const todayBdays  = members.filter(m => isToday(m.nextBirthday))
  const soonBdays   = members.filter(m => !isToday(m.nextBirthday) && differenceInDays(m.nextBirthday, new Date()) <= 30)
  const otherBdays  = members.filter(m => !isToday(m.nextBirthday) && differenceInDays(m.nextBirthday, new Date()) > 30)

  const BirthdayCard = ({ member, highlight }) => {
    const daysLeft = differenceInDays(member.nextBirthday, new Date())
    const age = new Date().getFullYear() - new Date(member.birthday).getFullYear() + (isToday(member.nextBirthday) ? 0 : 0)
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className={`card p-4 flex items-center gap-4 ${highlight ? 'border-coral/30 shadow-glow-coral' : ''}`}
      >
        <Avatar src={member.avatar} name={member.name} size={56} />
        <div className="flex-1">
          <h3 className="font-extrabold">{member.nickname || member.name}</h3>
          <p className="text-sm text-light-muted dark:text-dark-muted font-semibold">
            🎂 {format(new Date(member.birthday), 'MMMM d')}
          </p>
          <p className={`text-sm font-bold mt-0.5 ${isToday(member.nextBirthday) ? 'text-coral' : 'text-light-muted dark:text-dark-muted'}`}>
            {isToday(member.nextBirthday) ? '🎉 Today!' : `in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`}
          </p>
        </div>
        {isToday(member.nextBirthday) && (
          <button onClick={() => handleWish(member)} className="btn-primary text-sm px-4 py-2">
            🎁 Wish!
          </button>
        )}
        {!isToday(member.nextBirthday) && daysLeft <= 7 && (
          <span className="badge badge-gold">Soon!</span>
        )}
      </motion.div>
    )
  }

  if (loading) return <Loader />

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold gradient-text">🎂 Birthday Tracker</h1>
        <p className="text-light-muted dark:text-dark-muted font-semibold mt-1">Never miss a birthday in the gang!</p>
      </div>

      {todayBdays.length > 0 && (
        <div className="mb-8">
          <h2 className="section-title flex items-center gap-2">🎉 Celebrating Today!</h2>
          <div className="space-y-3">
            {todayBdays.map(m => <BirthdayCard key={m._id} member={m} highlight />)}
          </div>
        </div>
      )}

      {soonBdays.length > 0 && (
        <div className="mb-8">
          <h2 className="section-title flex items-center gap-2">⏳ Coming Up (Next 30 Days)</h2>
          <div className="space-y-3">
            {soonBdays.map(m => <BirthdayCard key={m._id} member={m} />)}
          </div>
        </div>
      )}

      {otherBdays.length > 0 && (
        <div>
          <h2 className="section-title">📅 All Birthdays</h2>
          <div className="space-y-3">
            {otherBdays.map(m => <BirthdayCard key={m._id} member={m} />)}
          </div>
        </div>
      )}

      {members.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🎂</div>
          <p className="text-xl font-bold text-light-muted dark:text-dark-muted">No birthdays found</p>
          <p className="text-sm text-light-muted dark:text-dark-muted mt-1">Members can add their birthday in their profile</p>
        </div>
      )}
    </div>
  )
}
