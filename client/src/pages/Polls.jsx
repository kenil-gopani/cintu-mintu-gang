import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Plus } from 'lucide-react'
import { pollService } from '../services/services'
import { useAuth } from '../hooks/useAuth'
import Modal from '../components/common/Modal'
import Loader from '../components/common/Loader'
import toast from 'react-hot-toast'

export default function Polls() {
  const { user } = useAuth()
  const [polls, setPolls] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newPoll, setNewPoll] = useState({ question: '', options: ['', ''] })

  useEffect(() => {
    fetchPolls()
  }, [])

  const fetchPolls = async () => {
    try {
      const res = await pollService.getAll()
      setPolls(res.data.polls.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
    } catch {
      toast.error('Failed to load polls')
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (pollId, optionIndex) => {
    try {
      await pollService.vote(pollId, optionIndex)
      toast.success('Vote recorded! 🗳️')
      fetchPolls() // Refresh to get updated counts and all votes
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
      await pollService.create(payload)
      setCreateModalOpen(false)
      setNewPoll({ question: '', options: ['', ''] })
      toast.success('Poll created!')
      fetchPolls()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create poll.')
    }
  }

  if (loading) return <Loader fullscreen />

  return (
    <div className="page-container max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold gradient-text flex items-center gap-3">
            <CheckCircle2 size={32} /> Family Polls
          </h1>
          <p className="text-gray-500 font-semibold mt-1">Vote on family decisions and fun questions!</p>
        </div>
        <button onClick={() => setCreateModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> New Poll
        </button>
      </div>

      {polls.length === 0 ? (
        <div className="card p-12 text-center text-gray-500 font-semibold text-lg">
          No polls have been created yet. Be the first!
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {polls.map((poll) => {
            const hasVoted = poll.options.some(o => o.votes.some(v => v._id === user._id || v === user._id))
            const totalVotes = poll.options.reduce((sum, o) => sum + o.votes.length, 0)
            
            return (
              <motion.div key={poll._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <p className="font-extrabold text-lg leading-snug">{poll.question}</p>
                  </div>
                  
                  {hasVoted ? (
                    <div className="space-y-3">
                      {poll.options.map((opt, i) => {
                        const percent = totalVotes === 0 ? 0 : Math.round((opt.votes.length / totalVotes) * 100)
                        const isMyVote = opt.votes.some(v => v._id === user._id || v === user._id)
                        return (
                          <div key={i} className="relative h-10 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center px-4 z-10 border border-gray-200 dark:border-gray-700">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} className={`absolute left-0 top-0 bottom-0 -z-10 ${isMyVote ? 'bg-teal-500/20' : 'bg-gray-300/30 dark:bg-gray-600/30'}`} />
                            <div className="flex justify-between w-full font-bold text-sm">
                              <span className={isMyVote ? 'text-teal-600 dark:text-teal-400' : ''}>{opt.text} {isMyVote && '✓'}</span>
                              <span>{percent}%</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {poll.options.map((opt, i) => (
                        <button key={i} onClick={() => handleVote(poll._id, i)} className="w-full text-left p-3 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-sm hover:border-coral hover:text-coral transition-colors">
                          {opt.text}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs font-bold text-gray-400 flex items-center justify-between">
                  <span>{totalVotes} vote{totalVotes !== 1 && 's'}</span>
                  <span>By {poll.createdBy?.nickname || poll.createdBy?.name}</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Create Poll Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="📊 Create New Poll">
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
