import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Clock, Hash, Trophy } from 'lucide-react'
import confetti from 'canvas-confetti'

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5)

/**
 * MemoryGame - Family Photo Memory Match
 * @param {Array} images - Array of { id, name, image } objects
 * @param {Function} onComplete - Called with (time, moves) on win
 */
export default function MemoryGame({ images = [], onComplete }) {
  const [cards, setCards] = useState([])
  const [flipped, setFlipped] = useState([])
  const [matched, setMatched] = useState([])
  const [moves, setMoves] = useState(0)
  const [time, setTime] = useState(0)
  const [started, setStarted] = useState(false)
  const [won, setWon] = useState(false)
  const [bestTime, setBestTime] = useState(() => parseInt(localStorage.getItem('mem_best_time') || '0'))
  const [bestMoves, setBestMoves] = useState(() => parseInt(localStorage.getItem('mem_best_moves') || '0'))
  const lockRef = useRef(false)
  const timerRef = useRef(null)

  const initGame = useCallback(() => {
    const pairs = shuffle([...images, ...images].map((img, i) => ({ ...img, uid: i })))
    setCards(pairs)
    setFlipped([])
    setMatched([])
    setMoves(0)
    setTime(0)
    setWon(false)
    setStarted(false)
    clearInterval(timerRef.current)
    lockRef.current = false
  }, [images])

  useEffect(() => { initGame() }, [initGame])

  useEffect(() => {
    if (started && !won) {
      timerRef.current = setInterval(() => setTime(t => t + 1), 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [started, won])

  const handleFlip = (uid, idx) => {
    if (lockRef.current || won) return
    if (flipped.some(f => f.idx === idx)) return
    if (matched.includes(uid)) return
    if (flipped.length >= 2) return

    if (!started) setStarted(true)

    const next = [...flipped, { uid, idx }]
    setFlipped(next)

    if (next.length === 2) {
      lockRef.current = true
      setMoves(m => m + 1)

      if (next[0].uid !== next[1].uid && cards[next[0].idx].id === cards[next[1].idx].id) {
        // Match (same id, different uid)
        setTimeout(() => {
          setMatched(prev => {
            const newMatched = [...prev, next[0].uid, next[1].uid]
            if (newMatched.length === cards.length) {
              // Win!
              clearInterval(timerRef.current)
              setWon(true)
              confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } })
              setTimeout(() => confetti({ particleCount: 80, spread: 100, angle: 60, origin: { x: 0 } }), 200)
              setTimeout(() => confetti({ particleCount: 80, spread: 100, angle: 120, origin: { x: 1 } }), 400)
              const finalTime = time + 1
              const finalMoves = moves + 1
              if (!bestTime || finalTime < bestTime) {
                localStorage.setItem('mem_best_time', String(finalTime))
                setBestTime(finalTime)
              }
              if (!bestMoves || finalMoves < bestMoves) {
                localStorage.setItem('mem_best_moves', String(finalMoves))
                setBestMoves(finalMoves)
              }
              onComplete?.(finalTime, finalMoves)
            }
            return newMatched
          })
          setFlipped([])
          lockRef.current = false
        }, 600)
      } else {
        setTimeout(() => { setFlipped([]); lockRef.current = false }, 1000)
      }
    }
  }

  const fmt = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const isFlipped = (uid, idx) => flipped.some(f => f.idx === idx) || matched.includes(uid)
  const isMatched = (uid) => matched.includes(uid)

  return (
    <div className="flex flex-col items-center gap-4 p-4 w-full">
      {/* Stats Bar */}
      <div className="flex items-center gap-3 w-full max-w-lg flex-wrap justify-center">
        <div className="flex items-center gap-2 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl px-4 py-2">
          <Clock size={15} className="text-primary" />
          <span className="text-sm font-bold text-light-text dark:text-dark-text font-mono">{fmt(time)}</span>
        </div>
        <div className="flex items-center gap-2 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl px-4 py-2">
          <Hash size={15} className="text-secondary" />
          <span className="text-sm font-bold text-light-text dark:text-dark-text">{moves} moves</span>
        </div>
        {bestTime > 0 && (
          <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-xl px-4 py-2">
            <Trophy size={15} className="text-yellow-500" />
            <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400">Best {fmt(bestTime)} / {bestMoves}m</span>
          </div>
        )}
        <button onClick={initGame} className="flex items-center gap-1.5 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border hover:bg-primary hover:text-white hover:border-primary rounded-xl px-4 py-2 transition-all text-sm font-bold">
          <RotateCcw size={14} />Restart
        </button>
      </div>

      {/* Progress */}
      <div className="w-full max-w-lg">
        <div className="h-1.5 bg-light-border dark:bg-dark-border rounded-full overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
            animate={{ width: `${(matched.length / cards.length) * 100}%` }} transition={{ duration: 0.4 }} />
        </div>
        <p className="text-xs text-light-sub dark:text-dark-sub font-semibold mt-1 text-center">{matched.length / 2} / {cards.length / 2} matched</p>
      </div>

      {/* Card Grid */}
      <div className="grid gap-3 w-full max-w-lg"
        style={{ gridTemplateColumns: `repeat(${Math.min(4, Math.ceil(Math.sqrt(cards.length)))}, 1fr)` }}>
        {cards.map((card, idx) => {
          const flip = isFlipped(card.uid, idx)
          const match = isMatched(card.uid)
          return (
            <motion.div key={card.uid}
              className="aspect-square cursor-pointer"
              style={{ perspective: 600 }}
              whileHover={!flip ? { scale: 1.05 } : {}}
              onClick={() => handleFlip(card.uid, idx)}
            >
              <motion.div className="relative w-full h-full"
                style={{ transformStyle: 'preserve-3d' }}
                animate={{ rotateY: flip ? 180 : 0 }}
                transition={{ duration: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
              >
                {/* Back (question) */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg"
                  style={{ backfaceVisibility: 'hidden' }}>
                  <span className="text-3xl">❓</span>
                </div>
                {/* Front (photo) */}
                <motion.div className="absolute inset-0 rounded-2xl overflow-hidden shadow-lg flex flex-col"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  animate={match ? { boxShadow: ['0 0 0 0 rgba(99,102,241,0)', '0 0 0 6px rgba(99,102,241,0.7)', '0 0 0 0 rgba(99,102,241,0)'] } : {}}
                  transition={match ? { duration: 0.6, times: [0, 0.5, 1] } : {}}
                >
                  {card.image ? (
                    <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <span className="text-4xl font-black text-primary">{card.name?.[0] || '?'}</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-white text-[10px] font-bold text-center truncate">{card.name}</p>
                  </div>
                  {match && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            </motion.div>
          )
        })}
      </div>

      {/* Win Popup */}
      <AnimatePresence>
        {won && (
          <motion.div key="win"
            initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div className="bg-light-card dark:bg-dark-card rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-light-border dark:border-dark-border"
              initial={{ y: 40 }} animate={{ y: 0 }}
            >
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-black text-light-text dark:text-dark-text mb-2">You Won!</h2>
              <p className="text-light-sub dark:text-dark-sub font-semibold mb-6">All pairs matched!</p>
              <div className="flex gap-4 justify-center mb-6">
                <div className="bg-primary/10 rounded-2xl px-5 py-3">
                  <p className="text-xs text-primary font-bold uppercase tracking-wider">Time</p>
                  <p className="text-2xl font-black text-light-text dark:text-dark-text">{fmt(time)}</p>
                </div>
                <div className="bg-secondary/10 rounded-2xl px-5 py-3">
                  <p className="text-xs text-secondary font-bold uppercase tracking-wider">Moves</p>
                  <p className="text-2xl font-black text-light-text dark:text-dark-text">{moves}</p>
                </div>
              </div>
              {bestTime > 0 && time <= bestTime && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-xl px-4 py-2 mb-4 flex items-center gap-2 justify-center">
                  <Trophy size={16} className="text-yellow-500" />
                  <span className="text-yellow-700 dark:text-yellow-400 font-bold text-sm">New Best Time! 🏆</span>
                </motion.div>
              )}
              <button onClick={initGame} className="w-full bg-primary hover:bg-primary-hover text-white font-black py-3 rounded-2xl transition-all hover:scale-105 shadow-lg shadow-primary/30">
                Play Again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
