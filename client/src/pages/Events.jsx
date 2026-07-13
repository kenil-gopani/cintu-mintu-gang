import { useState, useEffect } from 'react'
import Loader from '../components/common/Loader'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Calendar as CalIcon, MapPin, Users, X, Map, CreditCard, Image as ImageIcon,
  ChevronLeft, ChevronRight, Share2, Wallet
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { eventService, galleryService } from '../services/services'
import Modal from '../components/common/Modal'
import Avatar from '../components/common/Avatar'
import { 
  format, differenceInDays, isToday, isFuture, startOfMonth, 
  endOfMonth, startOfWeek, endOfWeek, addDays, subMonths, 
  addMonths, isSameMonth, isSameDay
} from 'date-fns'
import toast from 'react-hot-toast'

const EVENT_TYPES = ['birthday', 'reunion', 'festival', 'trip', 'other']
const RSVP_LABELS = { going: '✅ Going', maybe: '🤔 Maybe', notGoing: '❌ Not Going' }

const typeColors = { birthday: 'coral', reunion: 'teal', festival: 'gold', trip: 'lavender', other: 'mint' }
const typeEmojis = { birthday: '🎂', reunion: '👨‍👩‍👧‍👦', festival: '🎊', trip: '✈️', other: '📌' }

export default function Events() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Views
  const [view, setView] = useState('upcoming') // 'upcoming', 'past', 'calendar'
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Modals
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  
  // Forms
  const [form, setForm] = useState({ title: '', description: '', date: '', location: '', locationUrl: '', type: 'other' })
  const [saving, setSaving] = useState(false)
  
  // Event Details State
  const [activeTab, setActiveTab] = useState('overview') // 'overview', 'ledger', 'gallery'
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '' })
  const [eventMemories, setEventMemories] = useState([])

  useEffect(() => {
    eventService.getAll()
      .then(r => setEvents(r.data.events || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // --- Handlers ---
  const handleCreate = async () => {
    if (!form.title || !form.date) return toast.error('Title and date are required')
    setSaving(true)
    try {
      const res = await eventService.create(form)
      setEvents(prev => [...prev, res.data.event])
      setCreateOpen(false)
      setForm({ title: '', description: '', date: '', location: '', locationUrl: '', type: 'other' })
      toast.success('Event created! 🎉')
    } catch { toast.error('Could not create event') }
    finally { setSaving(false) }
  }

  const handleRsvp = async (id, status) => {
    try {
      const res = await eventService.rsvp(id, status)
      setEvents(prev => prev.map(e => e._id === id ? { ...e, rsvp: res.data.rsvp } : e))
      if (selectedEvent?._id === id) setSelectedEvent(e => ({ ...e, rsvp: res.data.rsvp }))
    } catch { toast.error('RSVP failed') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return
    try {
      await eventService.delete(id)
      setEvents(prev => prev.filter(e => e._id !== id))
      setSelectedEvent(null)
      toast.success('Event deleted')
    } catch { toast.error('Delete failed') }
  }

  const handleAddExpense = async (e) => {
    e.preventDefault()
    if (!expenseForm.description || !expenseForm.amount) return
    try {
      const res = await eventService.addExpense(selectedEvent._id, expenseForm)
      setEvents(prev => prev.map(ev => ev._id === selectedEvent._id ? { ...ev, expenses: res.data.expenses } : ev))
      setSelectedEvent(prev => ({ ...prev, expenses: res.data.expenses }))
      setExpenseForm({ description: '', amount: '' })
      toast.success('Expense added')
    } catch { toast.error('Failed to add expense') }
  }

  // Fetch Gallery when tab changes
  useEffect(() => {
    if (selectedEvent && activeTab === 'gallery') {
      galleryService.getAll({ event: selectedEvent._id })
        .then(r => setEventMemories(r.data.memories || []))
        .catch(() => {})
    }
  }, [selectedEvent?._id, activeTab])

  // --- Render Helpers ---
  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(endOfMonth(currentMonth))
    const rows = []
    let days = []
    let day = startDate
    let formattedDate = ""

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd')
        const cloneDay = day
        const dayEvents = events.filter(e => isSameDay(new Date(e.date), cloneDay))
        
        days.push(
          <div key={day} className={`min-h-[100px] p-2 border border-gray-100 dark:border-gray-800 flex flex-col ${!isSameMonth(day, monthStart) ? 'bg-gray-50/50 dark:bg-black/20 text-gray-400' : 'bg-white dark:bg-dark-card'}`}>
            <span className={`text-xs font-bold mb-1 ${isSameDay(day, new Date()) ? 'bg-coral text-white w-6 h-6 flex items-center justify-center rounded-full' : ''}`}>{formattedDate}</span>
            <div className="flex-1 overflow-y-auto space-y-1">
              {dayEvents.map(e => (
                <div key={e._id} onClick={() => setSelectedEvent(e)} className={`text-[10px] font-bold p-1 rounded bg-${typeColors[e.type]}/10 text-${typeColors[e.type]} truncate cursor-pointer hover:opacity-80`}>
                  {typeEmojis[e.type]} {e.title}
                </div>
              ))}
            </div>
          </div>
        )
        day = addDays(day, 1)
      }
      rows.push(<div className="grid grid-cols-7" key={day}>{days}</div>)
      days = []
    }

    return (
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="btn-icon"><ChevronLeft /></button>
          <h3 className="font-extrabold text-lg">{format(currentMonth, 'MMMM yyyy')}</h3>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="btn-icon"><ChevronRight /></button>
        </div>
        <div className="grid grid-cols-7 bg-gray-50 dark:bg-black/20 border-b border-gray-100 dark:border-gray-800 text-center text-xs font-bold py-2 text-gray-500 uppercase tracking-widest">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div>{rows}</div>
      </div>
    )
  }

  const now = new Date()
  const filtered = events.filter(e => {
    if (view === 'upcoming') return isFuture(new Date(e.date)) || isToday(new Date(e.date))
    if (view === 'past') return !isFuture(new Date(e.date)) && !isToday(new Date(e.date))
    return true
  }).sort((a, b) => new Date(a.date) - new Date(b.date))

  return (
    <div className="page-container max-w-7xl mx-auto py-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold gradient-text">📅 Events</h1>
          <p className="text-light-muted dark:text-dark-muted font-semibold mt-1">Plan and celebrate together.</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Create Event
        </button>
      </div>

      {/* View toggle */}
      <div className="flex gap-2 mb-8 bg-gray-100 dark:bg-black/20 p-1 rounded-2xl w-fit">
        {[
          { id: 'upcoming', label: '🔮 Upcoming' },
          { id: 'past', label: '📚 Past' },
          { id: 'calendar', label: '🗓️ Calendar' }
        ].map(v => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              view === v.id ? 'bg-white dark:bg-dark-card text-coral shadow' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader scale={0.3} /></div>
      ) : view === 'calendar' ? (
        renderCalendar()
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 card">
          <div className="text-6xl mb-4">{view === 'upcoming' ? '🔮' : '📚'}</div>
          <p className="text-xl font-bold text-gray-500">{view === 'upcoming' ? 'No upcoming events — create one!' : 'No past events yet'}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {filtered.map((ev, i) => {
              const daysLeft = differenceInDays(new Date(ev.date), now)
              const goingCount = ev.rsvp?.filter(r => r.status === 'going').length || 0
              return (
                <motion.div
                  key={ev._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => setSelectedEvent(ev)}
                  className="card group cursor-pointer hover:border-coral/30 hover:shadow-xl transition-all overflow-hidden flex flex-col"
                >
                  <div className={`h-2 bg-${typeColors[ev.type]}`} />
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`badge badge-${typeColors[ev.type]} text-xs`}>{typeEmojis[ev.type]} {ev.type}</span>
                      {view === 'upcoming' && (
                        <span className="text-xs font-black text-coral bg-coral/10 px-2 py-1 rounded-lg">
                          {daysLeft === 0 ? 'TODAY' : `${daysLeft}d left`}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-extrabold leading-tight mb-2 group-hover:text-coral transition-colors">{ev.title}</h3>
                    
                    <div className="space-y-2 mt-auto text-sm font-semibold text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2"><CalIcon size={14} className="text-teal-500" /> {format(new Date(ev.date), 'MMM d, yyyy - h:mm a')}</div>
                      {ev.location && <div className="flex items-center gap-2"><MapPin size={14} className="text-blue-500" /> {ev.location}</div>}
                      <div className="flex items-center gap-2"><Users size={14} className="text-purple-500" /> {goingCount} going</div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* --- EVENT DETAILS MODAL (Command Center) --- */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-light-bg dark:bg-dark-bg w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-white/10 relative">
              
              {/* Header */}
              <div className="p-6 bg-white dark:bg-dark-card border-b border-gray-100 dark:border-gray-800 flex justify-between items-start">
                <div className="pr-12">
                  <span className={`badge badge-${typeColors[selectedEvent.type]} text-xs mb-2`}>{typeEmojis[selectedEvent.type]} {selectedEvent.type}</span>
                  <h2 className="text-3xl font-extrabold mb-1">{selectedEvent.title}</h2>
                  <p className="text-gray-500 font-semibold">{format(new Date(selectedEvent.date), 'EEEE, MMMM do, yyyy - h:mm a')}</p>
                </div>
                <div className="flex gap-2 absolute top-6 right-6">
                  {(user?.role === 'admin' || user?._id === selectedEvent.createdBy._id) && (
                    <button onClick={() => handleDelete(selectedEvent._id)} className="w-10 h-10 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"><X size={18} /></button>
                  )}
                  <button onClick={() => setSelectedEvent(null)} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"><X size={18} /></button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black/20 px-6">
                {[
                  { id: 'overview', icon: MapPin, label: 'Overview & RSVP' },
                  { id: 'ledger', icon: Wallet, label: 'Ledger' },
                  { id: 'gallery', icon: ImageIcon, label: 'Gallery' }
                ].map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 py-4 px-4 font-bold text-sm border-b-2 transition-colors ${activeTab === t.id ? 'border-coral text-coral' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}>
                    <t.icon size={16} /> {t.label}
                  </button>
                ))}
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-6 sidebar-scroll">
                
                {/* 1. OVERVIEW TAB */}
                {activeTab === 'overview' && (
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      {selectedEvent.description && (
                        <div>
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Details</h3>
                          <p className="text-sm font-medium bg-white dark:bg-dark-card p-4 rounded-xl border border-gray-100 dark:border-gray-800 leading-relaxed">{selectedEvent.description}</p>
                        </div>
                      )}
                      
                      <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Location</h3>
                        <div className="bg-white dark:bg-dark-card p-4 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center"><MapPin size={20} /></div>
                            <span className="font-bold text-sm">{selectedEvent.location || 'TBD'}</span>
                          </div>
                          {selectedEvent.locationUrl && (
                            <a href={selectedEvent.locationUrl} target="_blank" rel="noreferrer" className="btn-primary text-xs py-1.5 px-3">Open Maps</a>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Your RSVP</h3>
                        <div className="flex gap-2">
                          {Object.entries(RSVP_LABELS).map(([status, label]) => {
                            const myRsvp = selectedEvent.rsvp?.find(r => r.user._id === user?._id)?.status
                            return (
                              <button key={status} onClick={() => handleRsvp(selectedEvent._id, status)} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border ${myRsvp === status ? 'bg-gradient-warm text-white border-transparent' : 'bg-white dark:bg-dark-card border-gray-200 dark:border-gray-700 hover:border-coral/50'}`}>
                                {label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                        Who's Going? <span className="bg-coral text-white px-2 py-0.5 rounded-full">{selectedEvent.rsvp?.filter(r=>r.status==='going').length || 0}</span>
                      </h3>
                      <div className="bg-white dark:bg-dark-card p-4 rounded-xl border border-gray-100 dark:border-gray-800 min-h-[200px]">
                        <div className="flex flex-wrap gap-3">
                          {selectedEvent.rsvp?.filter(r => r.status === 'going').map(r => (
                            <div key={r.user._id} className="flex flex-col items-center group cursor-help">
                              <Avatar src={r.user.avatar} name={r.user.name} size={48} className="border-2 border-transparent group-hover:border-coral transition-colors" />
                              <span className="text-[10px] font-bold mt-1 max-w-[60px] truncate text-center">{r.user.nickname || r.user.name.split(' ')[0]}</span>
                            </div>
                          ))}
                          {!selectedEvent.rsvp?.some(r => r.status === 'going') && <p className="text-sm font-semibold text-gray-400 m-auto py-10">No RSVPs yet.</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. LEDGER TAB */}
                {activeTab === 'ledger' && (
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                      {selectedEvent.expenses?.map((exp, i) => (
                        <div key={i} className="bg-white dark:bg-dark-card p-4 rounded-xl flex items-center justify-between border border-gray-100 dark:border-gray-800">
                          <div className="flex items-center gap-3">
                            <Avatar src={exp.paidBy.avatar} name={exp.paidBy.name} size={36} />
                            <div>
                              <p className="font-bold text-sm">{exp.description}</p>
                              <p className="text-xs font-semibold text-gray-500">Paid by {exp.paidBy.nickname || exp.paidBy.name} on {format(new Date(exp.date), 'MMM d')}</p>
                            </div>
                          </div>
                          <span className="font-extrabold text-lg text-coral">₹{exp.amount}</span>
                        </div>
                      ))}
                      {!selectedEvent.expenses?.length && (
                        <div className="text-center py-10 bg-white dark:bg-dark-card rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                          <CreditCard size={32} className="mx-auto text-gray-400 mb-2" />
                          <p className="font-bold text-gray-500 text-sm">No expenses logged yet.</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg mb-6">
                        <p className="text-sm font-bold opacity-80 uppercase tracking-widest mb-1">Total Cost</p>
                        <h3 className="text-4xl font-extrabold">₹{selectedEvent.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0}</h3>
                      </div>
                      <form onSubmit={handleAddExpense} className="bg-white dark:bg-dark-card p-4 rounded-xl border border-gray-100 dark:border-gray-800 space-y-3">
                        <p className="font-bold text-sm mb-2">Add Expense</p>
                        <input type="text" placeholder="Description (e.g. Cake)" value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} className="input-field h-10 text-sm" />
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">₹</span>
                          <input type="number" placeholder="Amount" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} className="input-field h-10 pl-8 text-sm" />
                        </div>
                        <button type="submit" className="btn-primary w-full h-10 text-sm">Add</button>
                      </form>
                    </div>
                  </div>
                )}

                {/* 3. GALLERY TAB */}
                {activeTab === 'gallery' && (
                  <div>
                    {eventMemories.length === 0 ? (
                      <div className="text-center py-20 bg-white dark:bg-dark-card rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        <ImageIcon size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="font-bold text-gray-500">No photos uploaded for this event yet.</p>
                        <p className="text-xs text-gray-400 mt-1">Go to the Memories section and link uploads to this event.</p>
                      </div>
                    ) : (
                      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                        {eventMemories.map(mem => (
                          <div key={mem._id} className="break-inside-avoid relative rounded-xl overflow-hidden group">
                            {mem.type === 'video' ? (
                              <video src={mem.imageUrl} autoPlay muted loop className="w-full h-full object-cover" />
                            ) : (
                              <img src={mem.imageUrl} alt="" className="w-full h-full object-cover" />
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col justify-end p-2 transition-opacity">
                              <span className="text-white text-[10px] font-bold">{mem.uploadedBy.nickname || mem.uploadedBy.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Event Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="📅 Create Event">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto sidebar-scroll p-1">
          {[
            { key: 'title',       label: 'Event Title *', type: 'text',     placeholder: 'e.g. Diwali Celebration' },
            { key: 'date',        label: 'Date *',        type: 'datetime-local', placeholder: '' },
            { key: 'location',    label: 'Location',      type: 'text',     placeholder: 'e.g. Grandma\'s house' },
            { key: 'locationUrl', label: 'Google Maps Link', type: 'url',     placeholder: 'https://maps.google.com/...' },
            { key: 'description', label: 'Description',   type: 'text',     placeholder: 'Tell more about this event...' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="text-xs font-bold text-light-muted dark:text-dark-muted mb-1 block">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                className="input-field"
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-bold text-light-muted dark:text-dark-muted mb-1 block">Event Type</label>
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="input-field">
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <button onClick={handleCreate} disabled={saving} className="btn-primary w-full mt-4">
            {saving ? <Loader scale={0.2} /> : '🎉 Create Event'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
