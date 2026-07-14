import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Gamepad2, Trophy, Medal, ChevronLeft, Dices, CircleDashed, 
  HelpCircle, Grid, Image as ImageIcon, Star
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { gameService, memberService, galleryService } from '../services/services'
import Avatar from '../components/common/Avatar'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'

// --- GAME COMPONENTS ---

const TruthOrDare = ({ onScore }) => {
  const [members, setMembers] = useState([])
  const [active, setActive] = useState(null)
  
  useEffect(() => { memberService.getAll().then(r => setMembers(r.data.users)) }, [])
  
  const spin = () => {
    if (members.length === 0) return
    const randomMember = members[Math.floor(Math.random() * members.length)]
    const isTruth = Math.random() > 0.5
    
    const truths = ["What's your most embarrassing moment?", "Who is your favorite cousin?", "What's a secret you kept from your parents?"]
    const dares = ["Do 10 pushups", "Sing a song loudly", "Let someone draw on your face with a pen"]
    
    setActive({
      user: randomMember,
      type: isTruth ? 'Truth' : 'Dare',
      text: isTruth ? truths[Math.floor(Math.random()*truths.length)] : dares[Math.floor(Math.random()*dares.length)]
    })
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 h-full">
      <Dices size={64} className="text-primary mb-6" />
      <h2 className="text-3xl font-extrabold mb-8">Truth or Dare</h2>
      
      {active && (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card p-8 mb-8 text-center max-w-md w-full border-2 border-primary">
          <Avatar src={active.user.avatar} name={active.user.name} size={64} className="mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">{active.user.nickname || active.user.name}</h3>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold mb-4 ${active.type === 'Truth' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>{active.type}</span>
          <p className="text-lg font-medium">{active.text}</p>
        </motion.div>
      )}

      <button onClick={spin} className="btn-primary text-xl px-12 py-4 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
        {active ? 'Spin Again' : 'Start Playing'}
      </button>
      
      {active && <button onClick={() => { onScore(50); setActive(null) }} className="mt-4 text-gray-500 font-bold hover:text-primary transition-colors">Task Completed (+50 pts)</button>}
    </div>
  )
}

const Quiz = ({ onScore }) => {
  const questions = [
    { q: "What year was the Cintu-Mintu Gang officially formed?", options: ["1999", "2005", "2010", "2020"], a: 3 },
    { q: "Who is the oldest cousin in the family?", options: ["Rahul", "Priya", "Arjun", "Sneha"], a: 2 },
    { q: "Which city has the family visited the most for vacations?", options: ["Goa", "Manali", "Ooty", "Jaipur"], a: 0 },
    { q: "Who is known as the biggest foodie in the house?", options: ["Rohan", "Karan", "Aisha", "Kabir"], a: 1 }
  ]
  const [current, setCurrent] = useState(0)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const handleAnswer = (idx) => {
    if (idx === questions[current].a) setScore(s => s + 100)
    if (current + 1 < questions.length) setCurrent(current + 1)
    else {
      setDone(true)
      onScore(score + (idx === questions[current].a ? 100 : 0))
    }
  }

  if (done) return (
    <div className="flex flex-col items-center justify-center p-8 h-full text-center">
      <Trophy size={80} className="text-yellow-400 mb-6" />
      <h2 className="text-3xl font-extrabold mb-2">Quiz Completed!</h2>
      <p className="text-xl font-bold text-gray-500 mb-8">You scored {score} points</p>
      <button onClick={() => { setCurrent(0); setScore(0); setDone(false) }} className="btn-primary">Play Again</button>
    </div>
  )

  return (
    <div className="flex flex-col items-center justify-center p-8 h-full max-w-2xl mx-auto">
      <HelpCircle size={48} className="text-primary mb-6" />
      <div className="w-full bg-gray-200 h-2 rounded-full mb-8 overflow-hidden">
        <div className="bg-primary h-full transition-all duration-300" style={{ width: `${(current / questions.length) * 100}%` }} />
      </div>
      <h3 className="text-2xl font-extrabold mb-8 text-center">{questions[current].q}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {questions[current].options.map((opt, i) => (
          <button key={i} onClick={() => handleAnswer(i)} className="p-4 card hover:border-primary hover:shadow-md transition-all font-bold text-lg">{opt}</button>
        ))}
      </div>
    </div>
  )
}

const MemoryGame = ({ onScore }) => {
  const [members, setMembers] = useState([])
  const [cards, setCards] = useState([])
  const [flipped, setFlipped] = useState([])
  const [solved, setSolved] = useState([])
  const [moves, setMoves] = useState(0)

  useEffect(() => {
    memberService.getAll().then(r => {
      const topMembers = r.data.users.slice(0, 6) // 6 unique cards
      const deck = [...topMembers, ...topMembers]
        .sort(() => Math.random() - 0.5)
        .map((m, i) => ({ id: i, user: m }))
      setMembers(topMembers)
      setCards(deck)
    })
  }, [])

  const handleCardClick = (idx) => {
    if (flipped.length === 2 || flipped.includes(idx) || solved.includes(idx)) return
    const newFlipped = [...flipped, idx]
    setFlipped(newFlipped)

    if (newFlipped.length === 2) {
      setMoves(m => m + 1)
      if (cards[newFlipped[0]].user._id === cards[newFlipped[1]].user._id) {
        setSolved(s => [...s, ...newFlipped])
        setFlipped([])
        if (solved.length + 2 === cards.length) {
          const points = Math.max(500 - (moves * 10), 100)
          setTimeout(() => onScore(points), 500)
        }
      } else {
        setTimeout(() => setFlipped([]), 1000)
      }
    }
  }

  if (cards.length === 0) return <div>Loading...</div>

  if (solved.length === cards.length) return (
    <div className="flex flex-col items-center justify-center p-8 h-full text-center">
      <Trophy size={80} className="text-secondary mb-6" />
      <h2 className="text-3xl font-extrabold mb-2">You matched everyone!</h2>
      <p className="text-xl font-bold text-gray-500 mb-8">Completed in {moves} moves</p>
    </div>
  )

  return (
    <div className="flex flex-col items-center p-8">
      <div className="flex justify-between w-full max-w-2xl mb-6">
        <h2 className="text-2xl font-extrabold">Memory Match</h2>
        <span className="font-bold text-gray-500">Moves: {moves}</span>
      </div>
      <div className="grid grid-cols-4 md:grid-cols-4 gap-4 max-w-2xl w-full perspective-[1000px]">
        {cards.map((card, i) => {
          const isFlipped = flipped.includes(i) || solved.includes(i)
          return (
            <motion.div 
              key={card.id} 
              onClick={() => handleCardClick(i)}
              className="aspect-square relative cursor-pointer"
              style={{ transformStyle: 'preserve-3d' }}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: 'spring' }}
            >
              {/* Front (Hidden state) */}
              <div className="absolute inset-0 backface-hidden bg-primary rounded-xl shadow-md border-2 border-white/20 flex items-center justify-center">
                <Grid size={32} className="text-white/50" />
              </div>
              {/* Back (Revealed state) */}
              <div className="absolute inset-0 backface-hidden bg-white dark:bg-dark-card rounded-xl shadow-lg border-2 border-secondary overflow-hidden flex flex-col items-center justify-center p-2" style={{ transform: 'rotateY(180deg)' }}>
                <Avatar src={card.user.avatar} name={card.user.name} size={48} className="mb-2" />
                <span className="text-[10px] font-bold text-center truncate w-full">{card.user.nickname || card.user.name}</span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// --- MAIN ARCADE PAGE ---

export default function Games() {
  const { user, setUser } = useAuth()
  const [activeGame, setActiveGame] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [history, setHistory] = useState([])

  const gamesList = [
    { id: 'truth-dare', title: 'Truth or Dare', icon: Dices, color: 'text-primary', bg: 'bg-primary/10' },
    { id: 'quiz', title: 'Family Quiz', icon: HelpCircle, color: 'text-primary', bg: 'bg-primary/10' },
    { id: 'memory', title: 'Memory Match', icon: Grid, color: 'text-secondary', bg: 'bg-secondary/10' },
    { id: 'spin', title: 'Spin the Wheel', icon: CircleDashed, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { id: 'puzzle', title: 'Photo Puzzle', icon: ImageIcon, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  ]

  useEffect(() => {
    fetchLeaderboard()
    fetchHistory()
  }, [])

  const fetchLeaderboard = () => gameService.getLeaderboard().then(r => setLeaderboard(r.data.leaderboard)).catch(()=>{})
  const fetchHistory = () => gameService.getHistory().then(r => setHistory(r.data.scores)).catch(()=>{})

  const handleScore = async (score) => {
    try {
      const { data } = await gameService.submitScore(activeGame, score)
      setUser(prev => ({ ...prev, gamePoints: data.gamePoints, badges: data.badges }))
      
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
      toast.success(`You earned ${score} points! 🏆`)
      
      if (data.newBadgesEarned) {
        setTimeout(() => toast('You unlocked a new BADGE! 🎖️', { icon: '🎖️', duration: 5000 }), 1500)
      }
      
      fetchLeaderboard()
      fetchHistory()
    } catch { toast.error('Failed to submit score') }
  }

  const renderActiveGame = () => {
    switch(activeGame) {
      case 'truth-dare': return <TruthOrDare onScore={handleScore} />
      case 'quiz': return <Quiz onScore={handleScore} />
      case 'memory': return <MemoryGame onScore={handleScore} />
      case 'spin':
      case 'puzzle':
        return (
          <div className="flex flex-col items-center justify-center p-20 text-center">
            <h2 className="text-3xl font-extrabold mb-4">Coming Soon!</h2>
            <p className="text-gray-500 font-bold mb-8">This game is currently under construction in the Arcade.</p>
            <button onClick={() => setActiveGame(null)} className="btn-primary">Back to Lobby</button>
          </div>
        )
      default: return null
    }
  }

  return (
    <div className="page-container max-w-7xl mx-auto py-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
            <Gamepad2 size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold gradient-text">Arcade</h1>
            <p className="text-light-muted dark:text-dark-muted font-semibold mt-1">Play, compete, and earn badges!</p>
          </div>
        </div>
        
        {/* User Stats Mini-Card */}
        <div className="card p-4 flex items-center gap-6">
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Total Score</p>
            <p className="text-2xl font-extrabold text-primary">{user?.gamePoints || 0} pts</p>
          </div>
          <div className="h-10 w-px bg-gray-200 dark:bg-gray-800" />
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Badges</p>
            <div className="flex items-center gap-1 mt-1">
              {user?.badges?.length > 0 ? user.badges.map(b => (
                <span key={b} title={b} className="w-6 h-6 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-xs shadow-sm"><Star size={12} className="fill-current"/></span>
              )) : <span className="text-xs font-bold text-gray-300">None yet</span>}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeGame ? (
          /* GAME WINDOW */
          <motion.div key="game" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="card min-h-[600px] flex flex-col relative overflow-hidden bg-white/50 dark:bg-black/20 backdrop-blur-3xl">
            <button onClick={() => setActiveGame(null)} className="absolute top-6 left-6 btn-icon z-10 bg-white dark:bg-dark-card shadow-sm hover:bg-primary hover:text-white transition-colors">
              <ChevronLeft size={24} />
            </button>
            {renderActiveGame()}
          </motion.div>
        ) : (
          /* ARCADE LOBBY */
          <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid lg:grid-cols-3 gap-8">
            
            {/* Game Selection Grid */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2"><Gamepad2 className="text-primary" size={20} /> Select a Game</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {gamesList.map(game => (
                  <div key={game.id} onClick={() => setActiveGame(game.id)} className={`card p-6 cursor-pointer group hover:shadow-xl hover:-translate-y-1 transition-all border-2 border-transparent hover:border-${game.color.split('-')[1]} overflow-hidden relative`}>
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-gradient-to-br from-white/0 to-black/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className={`w-14 h-14 rounded-2xl ${game.bg} ${game.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <game.icon size={28} />
                    </div>
                    <h3 className="text-xl font-extrabold mb-1">{game.title}</h3>
                    <p className="text-sm font-semibold text-gray-500">Earn points and unlock family badges!</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar: Leaderboard & History */}
            <div className="space-y-8">
              
              {/* Leaderboard */}
              <div className="card p-6 border-2 border-yellow-400/20 shadow-lg shadow-yellow-400/5">
                <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2"><Trophy className="text-yellow-500" size={20} /> Hall of Fame</h2>
                <div className="space-y-3">
                  {leaderboard.length === 0 ? <p className="text-sm font-bold text-gray-400">No scores yet. Be the first!</p> : 
                   leaderboard.map((member, idx) => (
                    <div key={member._id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-400 text-white shadow-md' : idx === 1 ? 'bg-gray-300 text-white' : idx === 2 ? 'bg-amber-600 text-white' : 'text-gray-400'}`}>
                        {idx + 1}
                      </div>
                      <Avatar src={member.avatar} name={member.name} size={36} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{member.nickname || member.name}</p>
                      </div>
                      <span className="font-black text-primary">{member.gamePoints}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent History */}
              <div className="card p-6">
                <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2"><Medal className="text-blue-500" size={20} /> Your Activity</h2>
                <div className="space-y-4">
                  {history.length === 0 ? <p className="text-sm font-bold text-gray-400">You haven't played anything yet.</p> : 
                   history.map(score => {
                     const game = gamesList.find(g => g.id === score.game)
                     return (
                       <div key={score._id} className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2 last:border-0 last:pb-0">
                         <div className="flex items-center gap-2">
                           {game && <game.icon size={16} className={game.color} />}
                           <div>
                             <p className="text-sm font-bold">{game?.title || score.game}</p>
                             <p className="text-[10px] text-gray-500 font-semibold">{new Date(score.createdAt).toLocaleDateString()}</p>
                           </div>
                         </div>
                         <span className="text-sm font-black text-green-500">+{score.score}</span>
                       </div>
                     )
                   })
                  }
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Global CSS for 3D Flips */}
      <style>{`
        .perspective-[1000px] { perspective: 1000px; }
        .backface-hidden { backface-visibility: hidden; }
      `}</style>
    </div>
  )
}
