import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, SkipForward, CheckCircle } from 'lucide-react'
import confetti from 'canvas-confetti'

const DEFAULT_TRUTHS = [
  "What's your most embarrassing family moment?",
  "Who in the family do you call first when you have good news?",
  "What's a secret talent nobody in the family knows about?",
  "If you had to swap lives with one family member, who would it be?",
  "What's the funniest thing that has happened at a family gathering?",
  "What do you think your family members say about you behind your back?",
  "Which family member would survive a zombie apocalypse with you?",
  "What's the worst gift you've received from a family member?",
  "Have you ever blamed a sibling for something you did?",
  "What's one habit you picked up from your parents that you're not proud of?",
]

const DEFAULT_DARES = [
  "Call a family member and sing them Happy Birthday right now",
  "Do your best impression of the family member to your left",
  "Show the most embarrassing photo on your phone",
  "Let the group post something on your social media",
  "Do 15 jumping jacks while reciting the alphabet",
  "Text your crush or best friend 'I need to tell you something' and wait for their response",
  "Eat a spoonful of the spiciest sauce available",
  "Do your best dance move for 30 seconds",
  "Let someone write a word on your forehead with a marker",
  "Call a random contact and speak only in rhymes for 1 minute",
]

const SEGMENTS = 8
const SEGMENT_COLORS = [
  ['#6366f1', '#8b5cf6'], ['#ec4899', '#f43f5e'], ['#f59e0b', '#f97316'],
  ['#10b981', '#06b6d4'], ['#6366f1', '#8b5cf6'], ['#ec4899', '#f43f5e'],
  ['#f59e0b', '#f97316'], ['#10b981', '#06b6d4'],
]
const LABELS = ['TRUTH', 'DARE', 'TRUTH', 'DARE', 'TRUTH', 'DARE', 'TRUTH', 'DARE']

/**
 * TruthDareWheel - Spinning wheel for Truth or Dare
 * @param {Array} truthQuestions
 * @param {Array} dareQuestions
 */
export default function TruthDareWheel({ truthQuestions = DEFAULT_TRUTHS, dareQuestions = DEFAULT_DARES }) {
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [result, setResult] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [completedCount, setCompletedCount] = useState(0)
  const svgRef = useRef(null)

  const playSpinSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'; osc.frequency.value = 800
      gain.gain.value = 0.05
      osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 2.5)
      osc.start(); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5); osc.stop(ctx.currentTime + 2.5)
    } catch {}
  }, [])

  const spin = useCallback(() => {
    if (spinning) return
    setSpinning(true)
    setShowResult(false)
    playSpinSound()

    const spins = 5 + Math.random() * 5
    const extra = Math.random() * 360
    const totalDeg = spins * 360 + extra
    const newRotation = rotation + totalDeg
    setRotation(newRotation)

    setTimeout(() => {
      setSpinning(false)
      // Determine which segment landed at top (pointer at 270deg = top)
      const norm = newRotation % 360
      const segAngle = 360 / SEGMENTS
      // Pointer at top = 270deg offset
      const landed = Math.floor(((360 - (norm % 360) + 270) % 360) / segAngle) % SEGMENTS
      const type = LABELS[landed]
      const pool = type === 'TRUTH' ? truthQuestions : dareQuestions
      const question = pool[Math.floor(Math.random() * pool.length)]
      setResult({ type, question })
      setTimeout(() => setShowResult(true), 100)
    }, 3000)
  }, [spinning, rotation, playSpinSound, truthQuestions, dareQuestions])

  const handleComplete = () => {
    setShowResult(false)
    setCompletedCount(c => c + 1)
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } })
  }

  const handleSkip = () => { setShowResult(false); setResult(null) }

  // Build SVG wheel
  const wheelPath = (i) => {
    const angle = (2 * Math.PI) / SEGMENTS
    const start = i * angle - Math.PI / 2
    const end = start + angle
    const r = 140, cx = 150, cy = 150
    const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start)
    const x2 = cx + r * Math.cos(end), y2 = cy + r * Math.sin(end)
    return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`
  }
  const textPos = (i) => {
    const angle = (2 * Math.PI) / SEGMENTS
    const mid = i * angle - Math.PI / 2 + angle / 2
    const r = 90
    return { x: 150 + r * Math.cos(mid), y: 150 + r * Math.sin(mid), rotate: (mid * 180 / Math.PI) + 90 }
  }

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <div className="text-center">
        <h2 className="text-2xl font-black text-light-text dark:text-dark-text">Truth or Dare</h2>
        <p className="text-light-sub dark:text-dark-sub text-sm font-semibold mt-1">
          {completedCount > 0 ? `${completedCount} challenges completed! 🔥` : 'Spin the wheel to play!'}
        </p>
      </div>

      {/* Wheel */}
      <div className="relative flex items-center justify-center">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10 w-0 h-0
          border-l-[12px] border-r-[12px] border-b-[28px] border-l-transparent border-r-transparent border-b-white
          drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]" />

        <motion.svg
          ref={svgRef}
          viewBox="0 0 300 300"
          className="w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] drop-shadow-2xl"
          animate={{ rotate: rotation }}
          transition={{ duration: 3, ease: [0.17, 0.67, 0.12, 1.0] }}
        >
          {/* Outer glow ring */}
          <circle cx="150" cy="150" r="148" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />

          {/* Segments */}
          {Array.from({ length: SEGMENTS }).map((_, i) => {
            const [c1, c2] = SEGMENT_COLORS[i]
            const gradId = `seg-grad-${i}`
            const tp = textPos(i)
            return (
              <g key={i}>
                <defs>
                  <linearGradient id={gradId} gradientTransform={`rotate(${tp.rotate}, 150, 150)`}>
                    <stop offset="0%" stopColor={c1} />
                    <stop offset="100%" stopColor={c2} />
                  </linearGradient>
                </defs>
                <path d={wheelPath(i)} fill={`url(#${gradId})`} stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                <text
                  x={tp.x} y={tp.y}
                  textAnchor="middle" dominantBaseline="middle"
                  transform={`rotate(${tp.rotate}, ${tp.x}, ${tp.y})`}
                  fill="white" fontSize="11" fontWeight="800" fontFamily="Inter, sans-serif"
                  letterSpacing="1"
                >
                  {LABELS[i]}
                </text>
              </g>
            )
          })}

          {/* Center hub */}
          <circle cx="150" cy="150" r="22" fill="white" />
          <circle cx="150" cy="150" r="18" fill="#1e293b" />
          <text x="150" y="154" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="16">🎡</text>
        </motion.svg>
      </div>

      {/* Spin Button */}
      <motion.button
        onClick={spin}
        disabled={spinning}
        whileHover={!spinning ? { scale: 1.05 } : {}}
        whileTap={!spinning ? { scale: 0.95 } : {}}
        className="bg-gradient-to-r from-primary to-secondary text-white font-black px-10 py-4 rounded-2xl text-lg shadow-lg shadow-primary/40 disabled:opacity-60 transition-all"
      >
        {spinning ? '🌀 Spinning...' : '🎡 Spin!'}
      </motion.button>

      {/* Result Popup */}
      <AnimatePresence>
        {showResult && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.7, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.7, y: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-light-card dark:bg-dark-card rounded-3xl p-8 max-w-md w-full shadow-2xl border border-light-border dark:border-dark-border text-center"
            >
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring' }}
                className={`inline-block px-6 py-2 rounded-full text-white font-black text-xl mb-5 shadow-lg ${result.type === 'TRUTH' ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-gradient-to-r from-pink-500 to-red-500'}`}
              >
                {result.type === 'TRUTH' ? '💬 TRUTH' : '🔥 DARE'}
              </motion.div>

              <p className="text-xl font-bold text-light-text dark:text-dark-text leading-relaxed mb-8">
                "{result.question}"
              </p>

              <div className="flex flex-col gap-3">
                <button onClick={handleComplete}
                  className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-white font-black py-3 rounded-2xl transition-all hover:scale-105 shadow-lg shadow-green-500/30">
                  <CheckCircle size={18} /> Challenge Complete! 🎉
                </button>
                <div className="flex gap-3">
                  <button onClick={handleSkip}
                    className="flex-1 flex items-center justify-center gap-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted hover:bg-light-card dark:hover:bg-dark-card font-bold py-2.5 rounded-xl transition-all text-sm">
                    <SkipForward size={15} /> Skip
                  </button>
                  <button onClick={() => { setShowResult(false); setTimeout(spin, 300) }}
                    className="flex-1 flex items-center justify-center gap-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted hover:bg-light-card dark:hover:bg-dark-card font-bold py-2.5 rounded-xl transition-all text-sm">
                    <RotateCcw size={15} /> Spin Again
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
