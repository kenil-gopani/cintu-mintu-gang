import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  Panel,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from 'dagre'
import { Search, X, Loader2, Info, Edit, Plus, Save } from 'lucide-react'
import { memberService } from '../services/services'
import FamilyNode from '../components/tree/FamilyNode'
import { motion, AnimatePresence } from 'framer-motion'
import Avatar from '../components/common/Avatar'
import { useAuth } from '../hooks/useAuth'
import Modal from '../components/common/Modal'
import toast from 'react-hot-toast'

const nodeTypes = { family: FamilyNode }

// --- Layout Engine (Dagre) ---
const getLayoutedElements = (nodes, edges) => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  
  // TB = Top to Bottom
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 160 })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 180, height: 150 })
  })

  // Only pass parent-child edges to dagre to avoid cyclic routing errors with spouses
  edges.forEach((edge) => {
    if (edge.data?.type === 'parent-child') {
      dagreGraph.setEdge(edge.source, edge.target)
    }
  })

  dagre.layout(dagreGraph)

  return {
    nodes: nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id)
      return {
        ...node,
        targetPosition: 'top',
        sourcePosition: 'bottom',
        position: {
          x: nodeWithPosition.x - 180 / 2,
          y: nodeWithPosition.y - 150 / 2,
        },
      }
    }),
    edges,
  }
}

export default function FamilyTree() {
  const { user } = useAuth()
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [loading, setLoading] = useState(true)
  const [allUsers, setAllUsers] = useState([])
  
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [usersMap, setUsersMap] = useState({})

  // Admin Edit Mode State
  const [isEditMode, setIsEditMode] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [newMemberData, setNewMemberData] = useState({ name: '', nickname: '' })
  
  const [editRelationsUser, setEditRelationsUser] = useState(null)
  const [relationsData, setRelationsData] = useState({ parents: [], spouse: '', children: [] })

  const loadTree = useCallback(async () => {
    try {
      const res = await memberService.getFamilyTree()
      const users = res.data.tree || []
      setAllUsers(users)
      
      const uMap = {}
      users.forEach(u => uMap[u._id] = u)
      setUsersMap(uMap)

      const initialNodes = []
      const initialEdges = []
      const spouseProcessed = new Set() 

      users.forEach(u => {
        initialNodes.push({
          id: u._id,
          type: 'family',
          position: { x: 0, y: 0 }, 
          data: { user: u, isSearchMatch: false },
        })

        if (u.children?.length > 0) {
          u.children.forEach(childId => {
            if (uMap[childId]) {
              initialEdges.push({
                id: `e-${u._id}-${childId}`,
                source: u._id,
                target: childId,
                sourceHandle: 'children',
                type: 'bezier',
                data: { type: 'parent-child' },
                style: {
                  stroke: 'url(#edge-parent)',
                  strokeWidth: 2.5,
                  strokeLinecap: 'round',
                },
              })
            }
          })
        }

        if (u.spouse && uMap[u.spouse]) {
          const edgeId = [u._id, u.spouse].sort().join('-')
          if (!spouseProcessed.has(edgeId)) {
            spouseProcessed.add(edgeId)
            initialEdges.push({
              id: `spouse-${edgeId}`,
              source: u._id,
              target: u.spouse,
              sourceHandle: 'spouse-right',
              type: 'straight',
              data: { type: 'spouse' },
              style: {
                stroke: '#f472b6',
                strokeWidth: 2,
                strokeDasharray: '6 4',
                strokeLinecap: 'round',
              },
              animated: true,
            })
          }
        }
      })

      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges)
      setNodes(layoutedNodes)
      setEdges(layoutedEdges)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTree()
  }, [loadTree])

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), [])
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), [])
  
  const onNodeClick = useCallback((event, node) => {
    if (isEditMode) {
      setEditRelationsUser(node.data.user)
      setRelationsData({
        parents: node.data.user.parents || [],
        spouse: node.data.user.spouse || '',
        children: node.data.user.children || []
      })
    } else {
      setSelectedUser(node.data.user)
    }
  }, [isEditMode])

  useEffect(() => {
    if (!search.trim()) {
      setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, isSearchMatch: false } })))
      return
    }
    const term = search.toLowerCase()
    setNodes(nds => nds.map(n => {
      const u = n.data.user
      const match = u.name.toLowerCase().includes(term) || (u.nickname && u.nickname.toLowerCase().includes(term))
      return { ...n, data: { ...n.data, isSearchMatch: match } }
    }))
  }, [search])

  const handleAddMember = async () => {
    try {
      await memberService.createFamilyMember(newMemberData)
      toast.success('Member added to family tree!')
      setAddModalOpen(false)
      setNewMemberData({ name: '', nickname: '' })
      loadTree()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member')
    }
  }

  const handleSaveRelations = async () => {
    try {
      const payload = {
        parents: relationsData.parents,
        spouse: relationsData.spouse || null,
        children: relationsData.children
      }
      await memberService.updateRelations(editRelationsUser._id, payload)
      toast.success('Relations updated')
      setEditRelationsUser(null)
      loadTree()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update relations')
    }
  }

  const toggleSelection = (field, id) => {
    setRelationsData(prev => {
      const list = prev[field]
      if (list.includes(id)) {
        return { ...prev, [field]: list.filter(x => x !== id) }
      } else {
        return { ...prev, [field]: [...list, id] }
      }
    })
  }

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-coral" size={48} /></div>

  return (
    <div className="relative w-full h-[calc(100dvh-72px)] bg-gray-50 dark:bg-[#0a0a0f]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        {/* SVG gradient for parent-child edges */}
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            <linearGradient id="edge-parent" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4ECDC4" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#6C63FF" stopOpacity="0.9" />
            </linearGradient>
          </defs>
        </svg>
        <Background variant="dots" color="#d1d5db" gap={28} size={1.5} className="dark:opacity-20" />
        <Controls className="bg-white/90 dark:bg-dark-card/90 border border-gray-100 dark:border-gray-800 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-xl" />
        
        <Panel position="top-left" className="m-4">
          <div className="glass rounded-2xl p-4 shadow-xl flex items-center gap-4">
            <div>
              <h1 className="text-xl font-extrabold gradient-text">Family Tree</h1>
              <p className="text-xs font-bold text-gray-500">Pan & Zoom to explore</p>
            </div>
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Find member..."
                className="pl-9 pr-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-black/20 border-transparent focus:border-coral outline-none text-gray-800 dark:text-gray-200 w-48 transition-all focus:w-64"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-coral">
                  <X size={14} />
                </button>
              )}
            </div>
            
            {/* Edit Mode toggle — visible to ALL members */}
              <>
                <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
                <button 
                  onClick={() => setIsEditMode(!isEditMode)} 
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${isEditMode ? 'bg-coral text-white shadow-lg shadow-coral/30' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                >
                  <Edit size={14} /> {isEditMode ? 'Exit Edit Mode' : '✏️ Edit Tree'}
                </button>
                {isEditMode && (
                  <button onClick={() => setAddModalOpen(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-bold bg-teal-500 text-white shadow-lg shadow-teal-500/30 hover:bg-teal-600 transition-colors">
                    <Plus size={14} /> Add Member
                  </button>
                )}
              </>
          </div>
        </Panel>

        <Panel position="bottom-left" className="m-4">
          <div className="glass rounded-xl p-3 shadow-lg flex flex-col gap-2 text-xs font-bold text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-2"><div className="w-4 h-1 bg-teal-400 rounded-full" /> Parent-Child</div>
            <div className="flex items-center gap-2"><div className="w-4 h-1 bg-purple-400 border-b-2 border-dashed border-white rounded-full" /> Marriage</div>
          </div>
        </Panel>
      </ReactFlow>

      {/* Side Panel for Selected User Details */}
      <AnimatePresence>
        {selectedUser && !isEditMode && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 w-80 h-full glass border-l border-white/20 shadow-[-10px_0_30px_rgba(0,0,0,0.1)] z-50 overflow-y-auto"
          >
            <div className="p-6">
              <button 
                onClick={() => setSelectedUser(null)} 
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>

              <div className="flex flex-col items-center mt-6 text-center">
                <Avatar src={selectedUser.avatar} name={selectedUser.name} size={96} className="border-4 border-white shadow-xl mb-4" />
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">{selectedUser.name}</h2>
                {selectedUser.nickname && <p className="text-sm font-bold text-coral">"{selectedUser.nickname}"</p>}
                
                <div className="mt-6 w-full space-y-4 text-left">
                  {selectedUser.occupation && (
                    <div className="bg-gray-100 dark:bg-black/20 p-3 rounded-xl">
                      <p className="text-xs font-bold text-gray-500 uppercase">Occupation</p>
                      <p className="text-sm font-semibold">{selectedUser.occupation}</p>
                    </div>
                  )}
                  {selectedUser.bio && (
                    <div className="bg-gray-100 dark:bg-black/20 p-3 rounded-xl">
                      <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Info size={14}/> Bio</p>
                      <p className="text-sm font-medium mt-1 leading-relaxed text-gray-700 dark:text-gray-300">{selectedUser.bio}</p>
                    </div>
                  )}
                  
                  {/* Relations Summary */}
                  <div className="bg-gray-100 dark:bg-black/20 p-3 rounded-xl space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Family Links</p>
                    
                    {selectedUser.spouse && usersMap[selectedUser.spouse] && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold w-16 text-purple-500">Spouse</span>
                        <Avatar src={usersMap[selectedUser.spouse].avatar} name={usersMap[selectedUser.spouse].name} size={20} />
                        <span className="text-sm font-semibold truncate">{usersMap[selectedUser.spouse].name}</span>
                      </div>
                    )}
                    
                    {selectedUser.parents?.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-bold w-16 text-gray-500 mt-1">Parents</span>
                        <div className="flex flex-col gap-1">
                          {selectedUser.parents.map(pid => usersMap[pid] && (
                            <div key={pid} className="flex items-center gap-2">
                              <Avatar src={usersMap[pid].avatar} name={usersMap[pid].name} size={20} />
                              <span className="text-sm font-semibold truncate">{usersMap[pid].name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedUser.children?.length > 0 && (
                      <div className="flex items-start gap-2 pt-1 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-xs font-bold w-16 text-teal-500 mt-1">Children</span>
                        <div className="flex flex-col gap-1">
                          {selectedUser.children.map(cid => usersMap[cid] && (
                            <div key={cid} className="flex items-center gap-2">
                              <Avatar src={usersMap[cid].avatar} name={usersMap[cid].name} size={20} />
                              <span className="text-sm font-semibold truncate">{usersMap[cid].name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Add New Member */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="➕ Add Family Member">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Full Name *</label>
            <input 
              className="input-field w-full" 
              placeholder="e.g. John Doe"
              value={newMemberData.name}
              onChange={e => setNewMemberData({...newMemberData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nickname (Optional)</label>
            <input 
              className="input-field w-full" 
              placeholder="e.g. Johnny"
              value={newMemberData.nickname}
              onChange={e => setNewMemberData({...newMemberData, nickname: e.target.value})}
            />
          </div>
          <button onClick={handleAddMember} className="btn-primary w-full mt-4">Create Member</button>
        </div>
      </Modal>

      {/* Modal: Edit Relations */}
      <Modal isOpen={!!editRelationsUser} onClose={() => setEditRelationsUser(null)} title={`🔗 Connect ${editRelationsUser?.name}`}>
        <div className="space-y-6">
          <p className="text-sm text-gray-500 font-semibold mb-4">Select the relationships for this member.</p>
          
          {/* Parents */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Parents</label>
            <div className="max-h-32 overflow-y-auto bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-xl p-2 space-y-1">
              {allUsers.filter(u => u._id !== editRelationsUser?._id).map(u => (
                <label key={`p-${u._id}`} className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg cursor-pointer transition-colors">
                  <input type="checkbox" checked={relationsData.parents.includes(u._id)} onChange={() => toggleSelection('parents', u._id)} className="w-4 h-4 text-coral rounded border-gray-300 focus:ring-coral" />
                  <span className="text-sm font-semibold">{u.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Spouse */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Spouse</label>
            <select 
              className="input-field w-full text-sm font-semibold"
              value={relationsData.spouse}
              onChange={e => setRelationsData({...relationsData, spouse: e.target.value})}
            >
              <option value="">-- None --</option>
              {allUsers.filter(u => u._id !== editRelationsUser?._id).map(u => (
                <option key={`s-${u._id}`} value={u._id}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* Children */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Children</label>
            <div className="max-h-32 overflow-y-auto bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-xl p-2 space-y-1">
              {allUsers.filter(u => u._id !== editRelationsUser?._id).map(u => (
                <label key={`c-${u._id}`} className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg cursor-pointer transition-colors">
                  <input type="checkbox" checked={relationsData.children.includes(u._id)} onChange={() => toggleSelection('children', u._id)} className="w-4 h-4 text-coral rounded border-gray-300 focus:ring-coral" />
                  <span className="text-sm font-semibold">{u.name}</span>
                </label>
              ))}
            </div>
          </div>

          <button onClick={handleSaveRelations} className="btn-primary w-full flex items-center justify-center gap-2">
            <Save size={18} /> Save Relationships
          </button>
        </div>
      </Modal>

    </div>
  )
}
