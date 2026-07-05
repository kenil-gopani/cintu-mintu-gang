import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import Avatar from '../common/Avatar'
import { Crown } from 'lucide-react'

const FamilyNode = memo(({ data }) => {
  const { user, isSearchMatch } = data

  return (
    <div
      className={`relative transition-all duration-300 cursor-pointer group`}
      style={{ width: 180 }}
    >
      {/* Top handle (parent link) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: 'transparent', border: 'none', width: 1, height: 1, top: 0 }}
      />

      {/* Card */}
      <div
        className={`
          flex flex-col items-center text-center px-4 pt-5 pb-4 rounded-3xl
          border-2 transition-all duration-300
          ${isSearchMatch
            ? 'border-coral shadow-[0_0_0_4px_rgba(255,107,107,0.25),0_12px_40px_rgba(255,107,107,0.3)] bg-white dark:bg-gray-900 scale-110'
            : 'border-white/30 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] bg-white/80 dark:bg-gray-900/80'
          }
          backdrop-blur-2xl
          group-hover:border-coral/60 group-hover:shadow-[0_12px_40px_rgba(255,107,107,0.2)]
          group-hover:-translate-y-1
        `}
      >
        {/* Avatar with ring */}
        <div className="relative mb-3">
          <div
            className={`
              p-0.5 rounded-full
              ${isSearchMatch
                ? 'bg-gradient-to-br from-coral to-orange-400'
                : 'bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700'
              }
              group-hover:bg-gradient-to-br group-hover:from-coral group-hover:to-orange-400
              transition-all duration-300
            `}
          >
            <div className="p-0.5 rounded-full bg-white dark:bg-gray-900">
              <Avatar
                src={user.avatar}
                name={user.name}
                size={56}
                className="rounded-full"
              />
            </div>
          </div>

          {user.role === 'admin' && (
            <span
              className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-400 border-2 border-white dark:border-gray-900 rounded-full flex items-center justify-center shadow-lg"
              title="Admin"
            >
              <Crown size={12} className="text-white" />
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="font-black text-sm leading-tight text-gray-900 dark:text-white mb-0.5 line-clamp-2">
          {user.nickname || user.name.split(' ')[0]}
        </h3>
        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 line-clamp-1">
          {user.name}
        </p>
      </div>

      {/* Bottom handle (children link) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="children"
        style={{ background: 'transparent', border: 'none', width: 1, height: 1, bottom: 0 }}
      />

      {/* Spouse handles */}
      <Handle
        type="source"
        position={Position.Left}
        id="spouse-left"
        style={{ background: 'transparent', border: 'none', width: 1, height: 1, left: 0 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="spouse-right"
        style={{ background: 'transparent', border: 'none', width: 1, height: 1, right: 0 }}
      />
    </div>
  )
})

FamilyNode.displayName = 'FamilyNode'
export default FamilyNode
