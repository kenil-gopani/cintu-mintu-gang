import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import Avatar from '../common/Avatar'
import { Briefcase, Calendar } from 'lucide-react'
import { format } from 'date-fns'

const FamilyNode = memo(({ data }) => {
  const { user, isSearchMatch } = data

  return (
    <div 
      className={`relative p-4 rounded-3xl backdrop-blur-xl border-2 transition-all duration-300 w-64 shadow-lg
        ${isSearchMatch ? 'border-coral shadow-glow-coral bg-white/90 dark:bg-dark-card/90 scale-105' : 'border-white/20 bg-white/60 dark:bg-dark-card/60'}
      `}
    >
      {/* Top Handle for Parents connecting to this node */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 bg-coral border-2 border-white rounded-full -top-1.5"
      />

      <div className="flex flex-col items-center text-center">
        <div className="relative mb-3">
          <Avatar src={user.avatar} name={user.name} size={64} className="border-4 border-white dark:border-dark-bg shadow-sm" />
          {user.role === 'admin' && (
            <span className="absolute bottom-0 right-0 w-5 h-5 bg-yellow-400 border-2 border-white rounded-full flex items-center justify-center text-[10px] shadow" title="Admin">
              ⭐
            </span>
          )}
        </div>

        <h3 className="font-extrabold text-lg leading-tight mb-1 text-gray-900 dark:text-white">
          {user.nickname || user.name}
        </h3>
        
        {user.occupation && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1 bg-black/5 dark:bg-white/10 px-2 py-1 rounded-md">
            <Briefcase size={12} />
            <span className="truncate max-w-[150px]">{user.occupation}</span>
          </div>
        )}

        {user.birthday && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-coral mt-2">
            <Calendar size={12} />
            <span>{format(new Date(user.birthday), 'MMM d, yyyy')}</span>
          </div>
        )}
      </div>

      {/* Bottom Handle for this node connecting to Children */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="children"
        className="w-3 h-3 bg-teal-500 border-2 border-white rounded-full -bottom-1.5"
      />

      {/* Left/Right Handles for Spouses */}
      <Handle 
        type="source" 
        position={Position.Left} 
        id="spouse-left"
        className="w-3 h-3 bg-purple-500 border-2 border-white rounded-full -left-1.5"
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        id="spouse-right"
        className="w-3 h-3 bg-purple-500 border-2 border-white rounded-full -right-1.5"
      />
    </div>
  )
})

FamilyNode.displayName = 'FamilyNode'
export default FamilyNode
