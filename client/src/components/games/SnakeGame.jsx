import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, Trophy, Zap } from 'lucide-react'

const GRID = 20
const CELL = 20

const DIRS = {
  ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 }, s: { x: 0, y: 1 },
  a: { x: -1, y: 0 }, d: { x: 1, y: 0 },
  W: { x: 0, y: -1 }, S: { x: 0, y: 1 },
  A: { x: -1, y: 0 }, D: { x: 1, y: 0 },
}

const randomFood = (snake) => {
  let pos
  do {
    pos = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) }
  } while (snake.some(s => s.x === pos.x && s.y === pos.y))
  return pos
}

export default function SnakeGame({ onGameEnd }) {
  const canvasRef = useRef(null)
  const stateRef = useRef({
    snake: [{ x: 10, y: 10 }],
    dir: { x: 1, y: 0 },
    nextDir: { x: 1, y: 0 },
    food: { x: 15, y: 10 },
    score: 0,
    running: false,
    dead: false,
    particles: [],
    glowPulse: 0,
  })
  const loopRef = useRef(null)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('snake_high') || '0'))
  const [gameState, setGameState] = useState('idle') // idle | playing | paused | dead
  const touchStart = useRef(null)

  // Sound
  const playSound = useCallback((type) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      if (type === 'eat') { osc.frequency.value = 440; gain.gain.value = 0.08; osc.type = 'sine' }
      if (type === 'die') { osc.frequency.value = 100; gain.gain.value = 0.1; osc.type = 'sawtooth' }
      osc.start(); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3); osc.stop(ctx.currentTime + 0.3)
    } catch {}
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const st = stateRef.current
    st.glowPulse = (st.glowPulse + 0.05) % (Math.PI * 2)
    const glowAlpha = 0.6 + 0.4 * Math.sin(st.glowPulse)

    // Background
    ctx.fillStyle = '#0a0a1a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Grid dots
    ctx.fillStyle = 'rgba(255,255,255,0.03)'
    for (let x = 0; x < GRID; x++)
      for (let y = 0; y < GRID; y++)
        ctx.fillRect(x * CELL + CELL / 2 - 1, y * CELL + CELL / 2 - 1, 2, 2)

    // Food glow
    const fx = st.food.x * CELL + CELL / 2, fy = st.food.y * CELL + CELL / 2
    const foodGrad = ctx.createRadialGradient(fx, fy, 0, fx, fy, CELL)
    foodGrad.addColorStop(0, `rgba(255,80,120,${glowAlpha})`)
    foodGrad.addColorStop(1, 'rgba(255,80,120,0)')
    ctx.fillStyle = foodGrad
    ctx.beginPath(); ctx.arc(fx, fy, CELL, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#ff5078'
    ctx.beginPath(); ctx.arc(fx, fy, CELL / 2.5, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.beginPath(); ctx.arc(fx - 2, fy - 2, 2, 0, Math.PI * 2); ctx.fill()

    // Snake
    st.snake.forEach((seg, i) => {
      const t = i / st.snake.length
      const r = Math.round(0 + (0 - 0) * t)
      const g = Math.round(200 + (100 - 200) * t)
      const b = Math.round(255 + (200 - 255) * t)
      const alpha = i === 0 ? glowAlpha : 0.6 + 0.4 * (1 - t)

      // Glow
      const sx = seg.x * CELL + CELL / 2, sy = seg.y * CELL + CELL / 2
      if (i < st.snake.length / 2) {
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, CELL)
        grad.addColorStop(0, `rgba(${r},${g},${b},${alpha * 0.4})`)
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad
        ctx.fillRect(seg.x * CELL - CELL / 2, seg.y * CELL - CELL / 2, CELL * 2, CELL * 2)
      }

      ctx.shadowColor = `rgba(${r},${g},${b},0.9)`
      ctx.shadowBlur = i === 0 ? 20 : 10
      ctx.fillStyle = `rgba(${r},${g},${b},${i === 0 ? 1 : 0.85 - t * 0.3})`
      const pad = i === 0 ? 1 : 2
      const rad = i === 0 ? 6 : 4
      roundRect(ctx, seg.x * CELL + pad, seg.y * CELL + pad, CELL - pad * 2, CELL - pad * 2, rad)
      ctx.fill()
      ctx.shadowBlur = 0

      // Head eyes
      if (i === 0) {
        ctx.fillStyle = '#000'
        const ex1 = seg.x * CELL + (st.dir.x === 0 ? 5 : st.dir.x > 0 ? 13 : 5)
        const ey1 = seg.y * CELL + (st.dir.y === 0 ? 5 : st.dir.y > 0 ? 13 : 5)
        ctx.beginPath(); ctx.arc(ex1, ey1, 2.5, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.beginPath(); ctx.arc(ex1 + 0.5, ey1 - 0.5, 1, 0, Math.PI * 2); ctx.fill()
      }
    })

    // Particles
    st.particles = st.particles.filter(p => p.life > 0)
    st.particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.life -= 2; p.vy += 0.2
      ctx.globalAlpha = p.life / 100
      ctx.fillStyle = p.color
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill()
      ctx.globalAlpha = 1
    })
  }, [])

  const roundRect = (ctx, x, y, w, h, r) => {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }

  const spawnParticles = (x, y) => {
    const colors = ['#ff5078', '#ff80a0', '#ffc0d0', '#ffffff']
    for (let i = 0; i < 12; i++) {
      stateRef.current.particles.push({
        x: x * CELL + CELL / 2, y: y * CELL + CELL / 2,
        vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 2) * 3,
        r: Math.random() * 3 + 1, life: 80 + Math.random() * 40,
        color: colors[Math.floor(Math.random() * colors.length)]
      })
    }
  }

  const tick = useCallback(() => {
    const st = stateRef.current
    if (!st.running) return

    st.dir = { ...st.nextDir }
    const head = { x: st.snake[0].x + st.dir.x, y: st.snake[0].y + st.dir.y }

    // Wall collision
    if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) {
      endGame(); return
    }
    // Self collision
    if (st.snake.some(s => s.x === head.x && s.y === head.y)) {
      endGame(); return
    }

    const ate = head.x === st.food.x && head.y === st.food.y
    st.snake = [head, ...st.snake]
    if (!ate) st.snake.pop()
    else {
      st.score += 10
      spawnParticles(head.x, head.y)
      setScore(st.score)
      playSound('eat')
      st.food = randomFood(st.snake)
    }

    draw()
    const speed = Math.max(80, 200 - Math.floor(st.score / 50) * 10)
    loopRef.current = setTimeout(tick, speed)
  }, [draw, playSound])

  const endGame = useCallback(() => {
    const st = stateRef.current
    st.running = false; st.dead = true
    clearTimeout(loopRef.current)
    playSound('die')
    const hs = Math.max(st.score, parseInt(localStorage.getItem('snake_high') || '0'))
    localStorage.setItem('snake_high', String(hs))
    setHighScore(hs)
    setGameState('dead')
    onGameEnd?.(st.score)
  }, [playSound, onGameEnd])

  const startGame = useCallback(() => {
    const st = stateRef.current
    st.snake = [{ x: 10, y: 10 }]; st.dir = { x: 1, y: 0 }; st.nextDir = { x: 1, y: 0 }
    st.food = randomFood(st.snake); st.score = 0; st.running = true; st.dead = false; st.particles = []
    setScore(0); setGameState('playing')
    clearTimeout(loopRef.current)
    loopRef.current = setTimeout(tick, 150)
  }, [tick])

  const togglePause = useCallback(() => {
    const st = stateRef.current
    if (st.dead) return
    st.running = !st.running
    if (st.running) { setGameState('playing'); loopRef.current = setTimeout(tick, 150) }
    else { setGameState('paused'); clearTimeout(loopRef.current) }
  }, [tick])

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      const dir = DIRS[e.key]
      if (!dir) return
      e.preventDefault()
      const st = stateRef.current
      // Prevent reverse
      if (dir.x !== -st.dir.x || dir.y !== -st.dir.y) st.nextDir = dir
      if (e.key === ' ') togglePause()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [togglePause])

  // Touch
  const onTouchStart = (e) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }
  const onTouchEnd = (e) => {
    if (!touchStart.current) return
    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = e.changedTouches[0].clientY - touchStart.current.y
    const st = stateRef.current
    if (Math.abs(dx) > Math.abs(dy)) {
      const dir = dx > 0 ? DIRS.ArrowRight : DIRS.ArrowLeft
      if (dir.x !== -st.dir.x) st.nextDir = dir
    } else {
      const dir = dy > 0 ? DIRS.ArrowDown : DIRS.ArrowUp
      if (dir.y !== -st.dir.y) st.nextDir = dir
    }
    touchStart.current = null
  }

  // Initial draw
  useEffect(() => { draw() }, [draw])
  useEffect(() => () => clearTimeout(loopRef.current), [])

  return (
    <div className="flex flex-col items-center gap-4 p-4 select-none">
      {/* Score bar */}
      <div className="flex items-center gap-6 w-full max-w-[400px]">
        <div className="flex items-center gap-2 bg-black/80 border border-cyan-500/30 rounded-xl px-4 py-2 flex-1">
          <Zap size={16} className="text-cyan-400" />
          <span className="text-xs text-cyan-300 font-bold uppercase tracking-wider">Score</span>
          <span className="text-xl font-black text-white ml-auto">{score}</span>
        </div>
        <div className="flex items-center gap-2 bg-black/80 border border-yellow-500/30 rounded-xl px-4 py-2 flex-1">
          <Trophy size={16} className="text-yellow-400" />
          <span className="text-xs text-yellow-300 font-bold uppercase tracking-wider">Best</span>
          <span className="text-xl font-black text-white ml-auto">{highScore}</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,200,255,0.2)] border border-cyan-500/20">
        <canvas
          ref={canvasRef}
          width={GRID * CELL}
          height={GRID * CELL}
          className="block"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          style={{ touchAction: 'none', maxWidth: '100%' }}
        />

        {/* Overlays */}
        <AnimatePresence>
          {gameState === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-4">
              <div className="text-6xl">🐍</div>
              <h2 className="text-3xl font-black text-white">Snake</h2>
              <p className="text-cyan-300 text-sm font-semibold">Arrow keys / WASD / Swipe</p>
              <button onClick={startGame} className="mt-2 bg-cyan-500 hover:bg-cyan-400 text-black font-black px-8 py-3 rounded-2xl text-lg transition-all hover:scale-105 shadow-lg shadow-cyan-500/40">
                <Play size={20} className="inline mr-2" />Play
              </button>
            </motion.div>
          )}

          {gameState === 'paused' && (
            <motion.div key="paused" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-4">
              <div className="text-5xl">⏸️</div>
              <h2 className="text-2xl font-black text-white">Paused</h2>
              <button onClick={togglePause} className="bg-cyan-500 hover:bg-cyan-400 text-black font-black px-8 py-3 rounded-2xl transition-all hover:scale-105">
                <Play size={20} className="inline mr-2" />Resume
              </button>
            </motion.div>
          )}

          {gameState === 'dead' && (
            <motion.div key="dead" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center gap-4">
              <div className="text-5xl">💀</div>
              <h2 className="text-3xl font-black text-white">Game Over</h2>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-xs text-cyan-400 font-bold uppercase tracking-wider">Score</p>
                  <p className="text-3xl font-black text-white">{score}</p>
                </div>
                <div className="w-px bg-white/20" />
                <div className="text-center">
                  <p className="text-xs text-yellow-400 font-bold uppercase tracking-wider">Best</p>
                  <p className="text-3xl font-black text-white">{highScore}</p>
                </div>
              </div>
              <button onClick={startGame} className="mt-2 bg-cyan-500 hover:bg-cyan-400 text-black font-black px-8 py-3 rounded-2xl text-lg transition-all hover:scale-105 shadow-lg shadow-cyan-500/40">
                <RotateCcw size={18} className="inline mr-2" />Play Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      {gameState === 'playing' && (
        <div className="flex gap-3">
          <button onClick={togglePause} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-bold px-4 py-2 rounded-xl transition-all text-sm">
            <Pause size={16} />Pause
          </button>
          <button onClick={startGame} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-bold px-4 py-2 rounded-xl transition-all text-sm">
            <RotateCcw size={16} />Restart
          </button>
        </div>
      )}

      {/* Mobile D-pad */}
      <div className="md:hidden grid grid-cols-3 gap-1 w-36">
        {[
          [null, { key: 'ArrowUp', label: '▲' }, null],
          [{ key: 'ArrowLeft', label: '◄' }, null, { key: 'ArrowRight', label: '►' }],
          [null, { key: 'ArrowDown', label: '▼' }, null],
        ].map((row, ri) =>
          row.map((btn, ci) => btn ? (
            <button key={`${ri}-${ci}`}
              onTouchStart={() => {
                const dir = DIRS[btn.key]
                const st = stateRef.current
                if (dir.x !== -st.dir.x || dir.y !== -st.dir.y) st.nextDir = dir
              }}
              className="aspect-square bg-gray-800 text-white font-bold rounded-lg text-lg flex items-center justify-center active:bg-cyan-600 transition-colors"
            >{btn.label}</button>
          ) : <div key={`${ri}-${ci}`} />)
        )}
      </div>
    </div>
  )
}
