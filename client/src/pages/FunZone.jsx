import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, BarChart2, Check } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { pollService } from '../services/services'
import Modal from '../components/common/Modal'
import Loader from '../components/common/Loader'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

const FUN_FACTS = [
  '🌶️ Who in the gang eats the spiciest food?',
  '😴 Who falls asleep at every family gathering?',
  '📱 Who is always on their phone?',
  '🎤 Who thinks they can sing the best?',
  '🍕 Who can eat the most pizza?',
]

export default function FunZone() {
  const { user } = useAuth()
  const [polls, setPolls] = useState([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [saving, setSaving] = useState(false)
  const [randomFact] = useState(() => FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)])

  useEffect(() => {
    pollService.getAll()
      .then(r => setPolls(r.data.polls || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    const validOpts = options.filter(o => o.trim())
    if (!question.trim() || validOpts.length < 2) return toast.error('Need a question and at least 2 options')
    setSaving(true)
    try {
      const res = await pollService.create({ question, options: validOpts.map(text => ({ text })) })
      setPolls(prev => [res.data.poll, ...prev])
      setCreateOpen(false)
      setQuestion(''); setOptions(['', ''])
      toast.success('Poll created! 🗳️')
    } catch { toast.error('Could not create poll') }
    finally { setSaving(false) }
  }

  const handleVote = async (pollId, optionIndex) => {
    try {
      const res = await pollService.vote(pollId, optionIndex)
      setPolls(prev => prev.map(p => p._id === pollId ? res.data.poll : p))
    } catch { toast.error('Vote failed') }
  }

  const hasVoted = (poll) =>
    poll.options.some(opt => opt.votes?.includes(user?._id))

  const getPercent = (poll, optIdx) => {
    const total = poll.options.reduce((s, o) => s + (o.votes?.length || 0), 0)
    if (!total) return 0
    return Math.round(((poll.options[optIdx].votes?.length || 0) / total) * 100)
  }

  return (
    <div className="page-container">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold gradient-text">🎉 Fun Zone</h1>
          <p className="text-light-muted dark:text-dark-muted font-semibold mt-1">Polls, quizzes & family fun!</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Create Poll
        </button>
      </div>

      {/* Random fun prompt */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-5 mb-6 border-2 border-dashed border-primary/30"
      >
        <p className="font-extrabold text-lg mb-1">🎲 Daily Fun Prompt</p>
        <p className="text-light-muted dark:text-dark-muted font-semibold">{randomFact}</p>
        <button
          onClick={() => { setQuestion(randomFact); setCreateOpen(true) }}
          className="btn-secondary text-sm mt-3"
        >
          Create Poll from this →
        </button>
      </motion.div>

      {/* Polls */}
      {loading ? <Loader fullscreen /> : (
        polls.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🗳️</div>
            <p className="text-xl font-bold text-light-muted dark:text-dark-muted">No polls yet!</p>
            <button onClick={() => setCreateOpen(true)} className="btn-primary mt-4">Create First Poll</button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            <AnimatePresence>
              {polls.map((poll, i) => {
                const voted = hasVoted(poll)
                const totalVotes = poll.options.reduce((s, o) => s + (o.votes?.length || 0), 0)
                return (
                  <motion.div
                    key={poll._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="card p-5"
                  >
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <h3 className="font-extrabold text-base leading-snug">{poll.question}</h3>
                      <span className="badge badge-primary shrink-0">{totalVotes} votes</span>
                    </div>

                    <div className="space-y-3">
                      {poll.options.map((opt, j) => {
                        const pct = getPercent(poll, j)
                        const myVote = opt.votes?.includes(user?._id)
                        return (
                          <div key={j}>
                            <button
                              onClick={() => !voted && handleVote(poll._id, j)}
                              disabled={voted}
                              className={`w-full text-left rounded-2xl border-2 px-4 py-3 transition-all duration-200 ${
                                myVote
                                  ? 'border-primary bg-primary/10 font-bold'
                                  : voted
                                  ? 'border-light-border dark:border-dark-border cursor-default'
                                  : 'border-light-border dark:border-dark-border hover:border-primary/50 hover:bg-primary/5'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-semibold">{opt.text}</span>
                                {myVote && <Check size={14} className="text-primary" />}
                                {voted && <span className="text-sm font-bold text-primary">{pct}%</span>}
                              </div>
                              {voted && (
                                <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.8, delay: 0.1 * j }}
                                    className="h-full rounded-full bg-primary"
                                  />
                                </div>
                              )}
                            </button>
                          </div>
                        )
                      })}
                    </div>

                    <p className="text-xs text-light-muted dark:text-dark-muted mt-3 font-semibold">
                      Created {poll.createdAt ? formatDistanceToNow(new Date(poll.createdAt), { addSuffix: true }) : ''}
                      {poll.createdBy ? ` by ${poll.createdBy.nickname || poll.createdBy.name}` : ''}
                    </p>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )
      )}

      {/* Create Poll Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="🗳️ Create a Poll">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-light-muted dark:text-dark-muted mb-1 block">Poll Question *</label>
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Ask the family something fun..."
              className="input-field"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-light-muted dark:text-dark-muted mb-1 block">Options</label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <input
                  key={i}
                  value={opt}
                  onChange={e => setOptions(prev => prev.map((o, idx) => idx === i ? e.target.value : o))}
                  placeholder={`Option ${i + 1}`}
                  className="input-field"
                />
              ))}
            </div>
            {options.length < 6 && (
              <button
                onClick={() => setOptions(prev => [...prev, ''])}
                className="text-primary text-sm font-bold mt-2 hover:underline"
              >
                + Add option
              </button>
            )}
          </div>
          <button onClick={handleCreate} disabled={saving} className="btn-primary w-full">
            {saving ? <Loader scale={0.2} /> : '🗳️ Launch Poll'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
