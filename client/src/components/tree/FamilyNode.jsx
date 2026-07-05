import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import Avatar from '../common/Avatar'
import { Briefcase, Calendar, Crown } from 'lucide-react'
import { format } from 'date-fns'

const FamilyNode = memo(({ data }) => {
  const { user, isSearchMatch } = data

  return (
    <div
      className={`relative rounded-2xl transition-all duration-300 w-52 overflow-visible select-none
        ${isSearchMatch
          ? 'ring-2 ring-coral shadow-[0_0_24px_rgba(255,107,107,0.4)]'
          : 'shadow-[0_4px_24px_rgba(0,0,0,0.10)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.18)]'
        }
      `}
    >
      {/* Handles */}
      <Handle type="target" position={Position.Top}    className="!w-2 !h-2 !bg-teal-400 !border-0 !rounded-full !-top-1" />
      <Handle type="source" position={Position.Bottom} id="children" className="!w-2 !h-2 !bg-teal-400 !border-0 !rounded-full !-bottom-1" />
      <Handle type="source" position={Position.Left}   id="spouse-left"  className="!w-2 !h-2 !bg-purple-400 !border-0 !rounded-full !-left-1" />
      <Handle type="source" position={Position.Right}  id="spouse-right" className="!w-2 !h-2 !bg-purple-400 !border-0 !rounded-full !-right-1" />
      <Handle type="target" position={Position.Left}   id="spouse-target-left"  className="!w-2 !h-2 !bg-purple-400 !border-0 !rounded-full !-left-1" />
      <Handle type="target" position={Position.Right}  id="spouse-target-right" className="!w-2 !h-2 !bg-purple-400 !border-0 !rounded-full !-right-1" />

      {/* Card Body */}
      <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10">
        {/* Colored top band */}
        <div className={`h-1.5 w-full ${user.role === 'admin' ? 'bg-gradient-to-r from-yellow-400 via-coral to-pink-500' : 'bg-gradient-to-r from-teal-400 to-indigo-500'}`} />

        <div className="flex flex-col items-center px-4 py-4 gap-2">
          {/* Avatar */}
          <div className="relative">
            <Avatar
              src={user.avatar}
              name={user.name}
              size={60}
              className="ring-4 ring-white dark:ring-[#1a1a2e] shadow-md"
            />
            {user.role === 'admin' && (
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-yellow-400 border-2 border-white rounded-full flex items-center justify-center shadow">
                <Crown size={10} className="text-white" />
              </span>
            )}
          </div>

          {/* Name */}
          <div className="text-center">
            <h3 className="font-extrabold text-sm leading-tight text-gray-900 dark:text-white">
              {user.nickname || user.name.split(' ')[0]}
            </h3>
            {user.nickname && (
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">{user.name}</p>
            )}
          </div>

          {/* Occupation / Birthday */}
          <div className="flex flex-col items-center gap-1 w-full">
            {user.occupation && (
              <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-50 dark:bg-white/5 px-2 py-0.5 rounded-full">
                <Briefcase size={10} />
                <span className="truncate max-w-[120px]">{user.occupation}</span>
              </div>
            )}
            {user.birthday && (
              <div className="flex items-center gap-1 text-[10px] font-bold text-coral">
                <Calendar size={10} />
                <span>{format(new Date(user.birthday), 'MMM d, yyyy')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

FamilyNode.displayName = 'FamilyNode'
export default FamilyNode
