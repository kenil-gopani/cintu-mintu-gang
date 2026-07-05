import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  Image, Calendar, Users, ArrowRight, CloudRain, Sun, Cloud, 
  MapPin, Quote, Trophy, Activity, CheckCircle2, ChevronRight, Plus
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useSocket } from '../hooks/useSocket'
import { memberService, galleryService, eventService, pollService } from '../services/services'
import Avatar from '../components/common/Avatar'
import { format, isToday, differenceInDays } from 'date-fns'
import confetti from 'canvas-confetti'
import toast from 'react-hot-toast'
import Modal from '../components/common/Modal'

// --- Quotes Data ---
const FAMILY_QUOTES = [
  "Family is not an important thing. It's everything.",
  "The memories we make with our family is everything.",
  "Family: Where life begins and love never ends.",
  "Time spent with family is worth every second.",
  "Together is our favorite place to be.",
  "In time of test, family is best."
]

// --- Weather Helper ---
const getWeatherIcon = (code) => {
  if (code <= 3) return <Sun size={32} className="text-yellow-400" />
  if (code <= 48) return <Cloud size={32} className="text-gray-400" />
  return <CloudRain size={32} className="text-blue-400" />
}

const stagger = {
  parent: { transition: { staggerChildren: 0.1 } },
  child: { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } },
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

export default function Home() {
  const { user } = useAuth()
  const { onlineUsers } = useSocket()
  
  // State
  const [birthdays, setBirthdays] = useState([])
  const [recentPhotos, setRecentPhotos] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [latestPoll, setLatestPoll] = useState(null)
  
  const [stats, setStats] = useState({ totalMembers: 0, totalMemories: 0, upcomingEventsCount: 0, totalPolls: 0, leaderboard: [] })
  const [activities, setActivities] = useState([])
  const [weather, setWeather] = useState(null)
  
  const [createPollModal, setCreatePollModal] = useState(false)
  const [newPoll, setNewPoll] = useState({ question: '', options: ['', ''] })
  
  const confettiFired = useRef(false)
  const [quote] = useState(() => FAMILY_QUOTES[new Date().getDay() % FAMILY_QUOTES.length])

  useEffect(() => {
    // 1. Fetch Birthdays
    memberService.getBirthdays().then(r => {
      const all = r.data.birthdays || []
      setBirthdays(all)
      const hasBday = all.some(b => isToday(new Date(b.nextBirthday)))
      if (hasBday && !confettiFired.current) {
        confettiFired.current = true
        confetti({ particleCount: 200, spread: 80, origin: { y: 0.5 }, colors: ['#FF6B6B', '#6C63FF', '#FFD93D'] })
      }
    }).catch(() => {})
    
    // 2. Fetch Photos
    galleryService.getAll(1).then(r => setRecentPhotos((r.data.memories || []).slice(0, 6))).catch(() => {})
    
    // 3. Fetch Events
    eventService.getAll().then(r => {
      const upcoming = (r.data.events || [])
        .filter(e => new Date(e.date) >= new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 3)
      setUpcomingEvents(upcoming)
    }).catch(() => {})

    // 4. Fetch Polls
    pollService.getAll().then(r => {
      if (r.data.polls?.length > 0) {
        // Find most recent active poll
        const active = r.data.polls.filter(p => p.isActive).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        setLatestPoll(active[0] || null)
      }
    }).catch(() => {})

    // 5. Fetch Dashboard Stats & Activities
    memberService.getDashboardStats().then(r => setStats(r.data)).catch(() => {})
    memberService.getActivities().then(r => setActivities(r.data.activities || [])).catch(() => {})

    // 6. Fetch Weather (Geo IP fallback to static)
    fetch('https://api.open-meteo.com/v1/forecast?latitude=21.1702&longitude=72.8311&current_weather=true')
      .then(res => res.json())
      .then(data => {
        setWeather({ temp: Math.round(data.current_weather.temperature), code: data.current_weather.weathercode, city: 'Surat' })
      })
      .catch(() => {})
  }, [])

  const handleVote = async (optionIndex) => {
    try {
      await pollService.vote(latestPoll._id, optionIndex)
      toast.success('Vote recorded! 🗳️')
      // Optimistic update
      const updatedPoll = { ...latestPoll }
      updatedPoll.options[optionIndex].votes.push(user._id)
      setLatestPoll(updatedPoll)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to vote.')
    }
  }

  const handleCreatePoll = async () => {
    if (!newPoll.question.trim() || newPoll.options.filter(o => o.trim()).length < 2) {
      return toast.error('Enter a question and at least 2 options.')
    }
    try {
      const payload = {
        question: newPoll.question,
        options: newPoll.options.filter(o => o.trim()).map(o => ({ text: o }))
      }
      const res = await pollService.create(payload)
      setLatestPoll(res.data.poll)
      setCreatePollModal(false)
      setNewPoll({ question: '', options: ['', ''] })
      toast.success('Poll created!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create poll.')
    }
  }

  const todayBdays = birthdays.filter(b => isToday(new Date(b.nextBirthday)))

  return (
    <div className="page-container max-w-7xl mx-auto py-8">
      
      {/* Dynamic Grid Layout */}
      <motion.div 
        variants={stagger.parent}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6"
      >
        
        {/* ROW 1 ------------------------------------------------ */}
        
        {/* Welcome Banner (Span 2) */}
        <motion.div variants={stagger.child} className="md:col-span-2 lg:col-span-2 rounded-3xl p-8 relative overflow-hidden flex flex-col justify-center min-h-[200px]" style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #6C63FF 100%)' }}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
          
          <div className="relative z-10 text-white">
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">
              {getGreeting()}, {user?.nickname || user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-white/80 font-medium text-lg">
              {format(new Date(), 'EEEE, MMMM do')} • <span className="font-bold text-white">{onlineUsers.length}</span> family members online right now.
            </p>
          </div>
        </motion.div>

        {/* Weather Widget */}
        <motion.div variants={stagger.child} className="card p-6 flex flex-col justify-between min-h-[200px] bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-dark-card relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-gray-500 dark:text-gray-400 text-sm tracking-widest uppercase">Weather</p>
              <h2 className="text-3xl font-extrabold mt-1">{weather ? `${weather.temp}°C` : '--°C'}</h2>
              <div className="flex items-center text-sm font-semibold text-gray-600 dark:text-gray-300 mt-2 gap-1">
                <MapPin size={14} /> {weather ? weather.city : 'Loading...'}
              </div>
            </div>
            {weather && getWeatherIcon(weather.code)}
          </div>
        </motion.div>

        {/* Quote of the Day */}
        <motion.div variants={stagger.child} className="card p-6 flex flex-col justify-between min-h-[200px] bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-900/10 dark:to-dark-card relative">
          <Quote size={40} className="text-yellow-400/30 absolute top-4 left-4" />
          <div className="relative z-10 flex-1 flex items-center justify-center text-center mt-4">
            <p className="font-bold text-lg leading-snug italic text-gray-800 dark:text-gray-200">
              "{quote}"
            </p>
          </div>
          <p className="text-xs text-center font-bold text-yellow-500 uppercase tracking-widest mt-4">Quote of the Day</p>
        </motion.div>


        {/* ROW 2 ------------------------------------------------ */}

        {/* Today's Birthday or Stats placeholder */}
        <motion.div variants={stagger.child} className="md:col-span-1 lg:col-span-1">
          {todayBdays.length > 0 ? (
            <div className="card p-6 h-full flex flex-col items-center justify-center text-center border-2 border-coral bg-coral/5 relative overflow-hidden">
              <div className="text-4xl mb-3">🎂</div>
              <h3 className="font-extrabold text-xl mb-1 text-coral">Happy Birthday!</h3>
              <p className="font-bold text-sm">{todayBdays.map(b => b.nickname || b.name).join(' & ')}</p>
              <Link to="/birthday" className="mt-4 text-xs font-bold bg-coral text-white px-4 py-2 rounded-full">Send Wishes 💌</Link>
            </div>
          ) : (
             <div className="card p-6 h-full flex flex-col justify-between bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/10 dark:to-dark-card">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
                    <Users size={20} />
                  </div>
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Total Family</p>
                  <h3 className="text-4xl font-extrabold mt-1">{stats.totalMembers}</h3>
                </div>
                <Link to="/members" className="text-sm font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 hover:gap-2 transition-all">View all <ArrowRight size={14} /></Link>
             </div>
          )}
        </motion.div>

        {/* Quick Poll (Span 2) */}
        <motion.div variants={stagger.child} className="md:col-span-2 lg:col-span-2 card p-6">
           <div className="flex justify-between items-start mb-4">
              <h2 className="font-extrabold text-lg flex items-center gap-2"><CheckCircle2 className="text-teal-500" size={20} /> Quick Poll</h2>
              <Link to="/fun-zone" className="text-sm font-bold text-coral">More polls</Link>
           </div>
           
           {latestPoll ? (
              <div>
                <p className="font-semibold text-lg mb-4">{latestPoll.question}</p>
                {latestPoll.options.some(o => o.votes.includes(user._id)) ? (
                  <div className="space-y-3">
                    {latestPoll.options.map((opt, i) => {
                      const totalVotes = latestPoll.options.reduce((sum, o) => sum + o.votes.length, 0)
                      const percent = totalVotes === 0 ? 0 : Math.round((opt.votes.length / totalVotes) * 100)
                      const isVoted = opt.votes.includes(user._id)
                      return (
                        <div key={i} className="relative h-10 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center px-4 z-10 border border-gray-200 dark:border-gray-700">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} className={`absolute left-0 top-0 bottom-0 -z-10 ${isVoted ? 'bg-teal-500/20' : 'bg-gray-300/30 dark:bg-gray-600/30'}`} />
                          <div className="flex justify-between w-full font-bold text-sm">
                            <span className={isVoted ? 'text-teal-600 dark:text-teal-400' : ''}>{opt.text} {isVoted && '✓'}</span>
                            <span>{percent}%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {latestPoll.options.map((opt, i) => (
                      <button key={i} onClick={() => handleVote(i)} className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-sm hover:border-coral hover:text-coral transition-colors">
                        {opt.text}
                      </button>
                    ))}
                  </div>
                )}
              </div>
           ) : (
             <div className="h-24 flex flex-col items-center justify-center gap-3">
               <span className="text-sm font-semibold text-gray-500">No active polls right now.</span>
               <button onClick={() => setCreatePollModal(true)} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                 <Plus size={14} /> Create Poll
               </button>
             </div>
           )}
        </motion.div>

        {/* Stats 2 */}
        <motion.div variants={stagger.child} className="md:col-span-1 lg:col-span-1 card p-6 h-full flex flex-col justify-between bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/10 dark:to-dark-card">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                <Image size={20} />
              </div>
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Total Memories</p>
              <h3 className="text-4xl font-extrabold mt-1">{stats.totalMemories}</h3>
            </div>
            <Link to="/gallery" className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:gap-2 transition-all">Go to gallery <ArrowRight size={14} /></Link>
        </motion.div>


        {/* ROW 3 ------------------------------------------------ */}

        {/* Recent Photos (Span 3) */}
        <motion.div variants={stagger.child} className="md:col-span-2 lg:col-span-3 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold text-lg flex items-center gap-2">📸 Recent Memories</h2>
            <Link to="/gallery" className="text-sm font-bold text-coral">See all</Link>
          </div>
          {recentPhotos.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-sm font-semibold text-gray-500">No memories uploaded yet.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {recentPhotos.map((photo, i) => (
                <Link to="/gallery" key={photo._id} className="relative rounded-2xl overflow-hidden aspect-square group cursor-pointer">
                  <img src={photo.imageUrl} alt={photo.caption} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <p className="text-white text-xs font-bold truncate">{photo.caption}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Upcoming Birthdays */}
        <motion.div variants={stagger.child} className="md:col-span-1 lg:col-span-1 card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-extrabold text-lg flex items-center gap-2">🎁 Birthdays</h2>
              <Link to="/birthday" className="text-sm font-bold text-coral">All</Link>
            </div>
            <div className="space-y-4">
              {birthdays.filter(b => !isToday(new Date(b.nextBirthday))).slice(0, 3).map(b => (
                <div key={b._id} className="flex items-center gap-3">
                  <Avatar src={b.avatar} name={b.name} size={40} />
                  <div>
                    <p className="font-bold text-sm leading-tight">{b.nickname || b.name}</p>
                    <p className="text-xs text-gray-500 font-semibold">in {differenceInDays(new Date(b.nextBirthday), new Date())} days</p>
                  </div>
                </div>
              ))}
            </div>
        </motion.div>


        {/* ROW 4 ------------------------------------------------ */}

        {/* Recent Activities (Span 2) */}
        <motion.div variants={stagger.child} className="md:col-span-2 lg:col-span-2 card p-6">
            <h2 className="font-extrabold text-lg flex items-center gap-2 mb-6"><Activity className="text-coral" size={20} /> Family Timeline</h2>
            
            {activities.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-sm font-semibold text-gray-500">No recent activity.</div>
            ) : (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[19px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 dark:before:via-gray-700 before:to-transparent">
                {activities.slice(0, 4).map((act, i) => (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    
                    {/* Marker */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-dark-bg bg-coral text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow absolute left-0 md:left-1/2 -translate-x-[2px] md:translate-x-0 z-10">
                      {act.type === 'memory' ? <Image size={14} /> : act.type === 'event' ? <Calendar size={14} /> : <CheckCircle2 size={14} />}
                    </div>

                    {/* Card */}
                    <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] card p-4 ml-12 md:ml-0 shadow-sm border border-transparent group-hover:border-coral/20 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar src={act.user?.avatar} name={act.user?.name} size={24} />
                        <p className="font-bold text-sm">{act.user?.nickname || act.user?.name}</p>
                      </div>
                      <p className="text-xs text-gray-500 font-semibold mb-2">{act.title}</p>
                      {act.extra && <p className="text-sm font-bold bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg italic truncate">"{act.extra}"</p>}
                    </div>

                  </div>
                ))}
              </div>
            )}
        </motion.div>

        {/* Leaderboard */}
        <motion.div variants={stagger.child} className="md:col-span-1 lg:col-span-1 card p-6">
            <h2 className="font-extrabold text-lg flex items-center gap-2 mb-4"><Trophy className="text-yellow-500" size={20} /> Top Contributors</h2>
            <div className="space-y-4">
              {stats.leaderboard?.length > 0 ? stats.leaderboard.map((u, i) => (
                <div key={u._id} className="flex items-center gap-3 relative">
                  <div className="w-6 text-center font-black text-gray-300 dark:text-gray-600 text-lg">#{i+1}</div>
                  <Avatar src={u.avatar} name={u.name} size={36} />
                  <div className="flex-1">
                    <p className="font-bold text-sm">{u.name}</p>
                    <p className="text-xs text-coral font-bold">{u.points} pts</p>
                  </div>
                </div>
              )) : (
                <div className="text-sm font-semibold text-gray-500 text-center py-4">No points yet.</div>
              )}
            </div>
        </motion.div>

        {/* Upcoming Events */}
        <motion.div variants={stagger.child} className="md:col-span-1 lg:col-span-1 card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-extrabold text-lg flex items-center gap-2">📅 Events</h2>
              <Link to="/events" className="text-sm font-bold text-coral">All</Link>
            </div>
            <div className="space-y-4">
              {upcomingEvents.length === 0 ? (
                <div className="text-sm font-semibold text-gray-500 text-center py-4">No upcoming events.</div>
              ) : (
                upcomingEvents.map(ev => (
                  <Link to="/events" key={ev._id} className="flex gap-3 items-start group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-col items-center justify-center shrink-0 text-white shadow-md group-hover:scale-105 transition-transform">
                      <p className="text-[10px] font-bold leading-none uppercase">{format(new Date(ev.date), 'MMM')}</p>
                      <p className="text-lg font-extrabold leading-none mt-0.5">{format(new Date(ev.date), 'd')}</p>
                    </div>
                    <div>
                      <p className="font-bold text-sm leading-tight group-hover:text-coral transition-colors">{ev.title}</p>
                      <p className="text-xs text-gray-500 font-semibold mt-1">in {differenceInDays(new Date(ev.date), new Date())} days</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
        </motion.div>

      </motion.div>

      <Modal isOpen={createPollModal} onClose={() => setCreatePollModal(false)} title="📊 Create Quick Poll">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Question</label>
            <input 
              className="input-field w-full"
              placeholder="e.g. What should we do this weekend?"
              value={newPoll.question}
              onChange={e => setNewPoll(p => ({ ...p, question: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Options</label>
            {newPoll.options.map((opt, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input 
                  className="input-field flex-1"
                  placeholder={`Option ${i + 1}`}
                  value={opt}
                  onChange={e => {
                    const newOptions = [...newPoll.options]
                    newOptions[i] = e.target.value
                    setNewPoll(p => ({ ...p, options: newOptions }))
                  }}
                />
              </div>
            ))}
            {newPoll.options.length < 5 && (
              <button 
                onClick={() => setNewPoll(p => ({ ...p, options: [...p.options, ''] }))}
                className="text-coral text-xs font-bold flex items-center gap-1 mt-2"
              >
                <Plus size={14} /> Add Option
              </button>
            )}
          </div>
          <button onClick={handleCreatePoll} className="btn-primary w-full mt-4">Create Poll</button>
        </div>
      </Modal>

    </div>
  )
}
