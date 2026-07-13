import { motion } from 'framer-motion'
import Loader from './Loader'

const SkeletonPulse = ({ className }) => (
  <motion.div 
    className={`bg-gray-200 dark:bg-gray-800 rounded-xl ${className}`}
    animate={{ opacity: [0.5, 1, 0.5] }}
    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
  />
)

export const GallerySkeleton = () => (
  <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4 py-8">
    {[...Array(12)].map((_, i) => (
      <SkeletonPulse key={i} className={`w-full break-inside-avoid ${i % 3 === 0 ? 'h-64' : i % 2 === 0 ? 'h-96' : 'h-48'}`} />
    ))}
  </div>
)

export const DashboardSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-6">
    <div className="md:col-span-8 space-y-6">
      <SkeletonPulse className="w-full h-48 rounded-3xl" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <SkeletonPulse key={i} className="h-32 rounded-3xl" />)}
      </div>
      <SkeletonPulse className="w-full h-96 rounded-3xl" />
    </div>
    <div className="md:col-span-4 space-y-6">
      <SkeletonPulse className="w-full h-64 rounded-3xl" />
      <SkeletonPulse className="w-full h-80 rounded-3xl" />
    </div>
  </div>
)

export const EventSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pt-6">
    {[...Array(6)].map((_, i) => (
      <SkeletonPulse key={i} className="w-full h-72 rounded-3xl" />
    ))}
  </div>
)

export const PageSpinner = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center">
    <Loader scale={0.8} />
  </div>
)
