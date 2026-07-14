import { motion } from 'framer-motion'
import { Home, ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg p-4 relative overflow-hidden">
      
      {/* Decorative background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="card max-w-lg w-full p-10 text-center shadow-2xl relative z-10 border border-white/50 dark:border-white/10 backdrop-blur-xl bg-white/70 dark:bg-dark-card/70"
      >
        <h1 className="text-[120px] font-black leading-none gradient-text drop-shadow-sm mb-4">404</h1>
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">Lost in the sauce?</h2>
        <p className="text-gray-500 font-medium mb-10 text-lg">
          The page you are looking for doesn't exist, has been moved, or is temporarily unavailable.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => navigate(-1)} 
            className="h-14 px-8 rounded-full font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft size={20} /> Go Back
          </button>
          <Link 
            to="/home" 
            className="btn-primary h-14 px-8 flex items-center justify-center gap-2 text-lg shadow-xl shadow-primary/30 hover:-translate-y-1 transition-transform"
          >
            <Home size={20} /> Take me Home
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
