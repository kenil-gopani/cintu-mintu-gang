import { motion } from 'framer-motion'

export default function Loader({ fullscreen = false }) {
  const content = (
    <div className="flex flex-col items-center gap-4">
      {/* Animated logo */}
      <div className="relative w-16 h-16">
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-warm opacity-30"
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.div
          className="absolute inset-2 rounded-full bg-gradient-warm"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-3 rounded-full bg-light-bg dark:bg-dark-bg flex items-center justify-center text-xl">
          🏠
        </div>
      </div>
      <motion.p
        className="text-sm font-bold text-light-muted dark:text-dark-muted"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        Loading...
      </motion.p>
    </div>
  )

  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-light-bg dark:bg-dark-bg flex items-center justify-center z-50">
        {content}
      </div>
    )
  }
  return <div className="flex items-center justify-center py-12">{content}</div>
}
