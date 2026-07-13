import { useState, useEffect, useRef, useCallback } from 'react'
import Loader from '../components/common/Loader'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Image as ImageIcon, Video, Upload, Heart, MessageCircle, 
  Trash2, X, Plus, Filter, Search, Share2, Grid, List, 
  Calendar, Star, Folder, Download, Play, Pause, ChevronLeft, ChevronRight, Maximize2
} from 'lucide-react'
import { galleryService, eventService } from '../services/services'
import { useAuth } from '../hooks/useAuth'
import Avatar from '../components/common/Avatar'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function Gallery() {
  const { user } = useAuth()
  
  // Data State
  const [memories, setMemories] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Pagination State (Infinite Scroll)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const observerRef = useRef(null)

  // View Toggle
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'timeline' | 'albums'
  
  // Filters
  const [filters, setFilters] = useState({ search: '', album: '', year: '', event: '', favorite: '' })
  const [albums, setAlbums] = useState([])
  const [eventsList, setEventsList] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  
  // Modals
  const [showUpload, setShowUpload] = useState(false)
  
  // Lightbox / Slideshow State
  const [lightboxIndex, setLightboxIndex] = useState(null) // null means closed
  const [isPlaying, setIsPlaying] = useState(false)
  
  // Upload State
  const fileInputRef = useRef(null)
  const [uploadData, setUploadData] = useState({ file: null, preview: null, caption: '', album: 'random', event: '', tags: '' })
  const [uploading, setUploading] = useState(false)

  // Fetch Initial Data
  useEffect(() => {
    galleryService.getAlbums().then(r => setAlbums(r.data.albums)).catch(() => {})
    eventService.getAll().then(r => setEventsList(r.data.events)).catch(() => {})
  }, [])

  // Fetch Memories when filters change (Reset page to 1)
  useEffect(() => {
    setPage(1)
    setMemories([])
    setHasMore(true)
    fetchMemories(1, true)
  }, [filters])

  // Infinite Scroll fetch function
  const fetchMemories = async (pageNumber, isReset = false) => {
    if (pageNumber === 1) setLoading(true)
    else setLoadingMore(true)

    try {
      const { data } = await galleryService.getAll({ ...filters, page: pageNumber })
      setMemories(prev => isReset ? data.memories : [...prev, ...data.memories])
      setHasMore(pageNumber < data.pages)
    } catch (err) {
      toast.error('Failed to load memories')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Intersection Observer for Infinite Scroll
  const lastMemoryRef = useCallback(node => {
    if (loading || loadingMore) return
    if (observerRef.current) observerRef.current.disconnect()
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(p => p + 1)
        fetchMemories(page + 1)
      }
    })
    
    if (node) observerRef.current.observe(node)
  }, [loading, loadingMore, hasMore, page])

  // Slideshow Effect
  useEffect(() => {
    let timer;
    if (isPlaying && lightboxIndex !== null) {
      timer = setInterval(() => {
        setLightboxIndex(prev => (prev + 1) % memories.length)
      }, 3000)
    }
    return () => clearInterval(timer)
  }, [isPlaying, lightboxIndex, memories.length])

  // Keyboard Navigation for Lightbox
  useEffect(() => {
    const handleKey = (e) => {
      if (lightboxIndex === null) return
      if (e.key === 'ArrowRight') setLightboxIndex(prev => (prev + 1) % memories.length)
      if (e.key === 'ArrowLeft') setLightboxIndex(prev => (prev - 1 + memories.length) % memories.length)
      if (e.key === 'Escape') { setLightboxIndex(null); setIsPlaying(false) }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lightboxIndex, memories.length])

  // --- Handlers ---
  const handleLike = async (id) => {
    try {
      const { data } = await galleryService.like(id)
      setMemories(ms => ms.map(m => m._id === id ? { ...m, likes: data.likes } : m))
    } catch (err) { toast.error('Failed to like') }
  }

  const handleFavorite = async (id) => {
    try {
      const { data } = await galleryService.favorite(id)
      setMemories(ms => ms.map(m => m._id === id ? { ...m, favorites: data.favorites } : m))
    } catch (err) { toast.error('Failed to favorite') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this memory permanently?')) return
    try {
      await galleryService.delete(id)
      setMemories(ms => ms.filter(m => m._id !== id))
      if (memories[lightboxIndex]?._id === id) setLightboxIndex(null)
      toast.success('Deleted successfully')
    } catch (err) { toast.error('Failed to delete') }
  }

  const handleShare = (memory) => {
    const url = `${window.location.origin}/gallery?memory=${memory._id}`
    navigator.clipboard.writeText(url)
    toast.success('Link copied to clipboard! 📋')
  }

  const handleDownload = async (memory) => {
    try {
      const toastId = toast.loading('Downloading high-res photo...')
      // Fetch the file to bypass CORS issues on direct link clicks
      const response = await fetch(memory.imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `cintu-mintu-${memory.album || 'memory'}-${Date.now()}.${memory.type === 'video' ? 'mp4' : 'jpg'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Download complete! 📥', { id: toastId })
    } catch (err) {
      toast.error('Failed to download image')
    }
  }

  const handleComment = async (e, id) => {
    e.preventDefault()
    const text = e.target.comment.value
    if (!text) return
    try {
      const { data } = await galleryService.comment(id, text)
      setMemories(ms => ms.map(m => m._id === id ? { ...m, comments: data.comments } : m))
      e.target.reset()
    } catch (err) { toast.error('Failed to comment') }
  }

  const deleteComment = async (memoryId, commentId) => {
    try {
      const { data } = await galleryService.delComment(memoryId, commentId)
      setMemories(ms => ms.map(m => m._id === memoryId ? { ...m, comments: data.comments } : m))
    } catch (err) { toast.error('Failed to delete comment') }
  }

  // --- Upload Handlers ---
  const handleUploadSubmit = async (e) => {
    e.preventDefault()
    if (!uploadData.file) return toast.error('Select a photo or video')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('media', uploadData.file)
      fd.append('caption', uploadData.caption)
      fd.append('album', uploadData.album)
      fd.append('tags', uploadData.tags)
      if (uploadData.event) fd.append('event', uploadData.event)
      
      const { data } = await galleryService.upload(fd)
      setMemories([data.memory, ...memories])
      if (!albums.includes(uploadData.album)) setAlbums([...albums, uploadData.album])
      setShowUpload(false)
      setUploadData({ file: null, preview: null, caption: '', album: 'random', event: '', tags: '' })
      toast.success('Memory uploaded! 📸')
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed') } 
    finally { setUploading(false) }
  }

  // --- Render Helpers ---
  const getOptimizedUrl = (url, type, isModal) => {
    if (type === 'video' || !url) return url
    // For grid view, load optimized smaller version. For lightbox, load high res.
    if (!isModal && url.includes('/upload/')) {
      return url.replace('/upload/', '/upload/q_auto,f_auto,w_800/')
    }
    return url
  }

  const renderMedia = (memory, isModal = false) => {
    if (!memory) return null
    if (memory.type === 'video') {
      return (
        <video 
          src={memory.imageUrl} 
          controls={isModal || viewMode === 'timeline'} 
          autoPlay={viewMode === 'grid'}
          muted={viewMode === 'grid'}
          loop={viewMode === 'grid'}
          className="w-full h-full object-cover rounded-xl shadow-lg"
        />
      )
    }
    return <img src={getOptimizedUrl(memory.imageUrl, memory.type, isModal)} alt={memory.caption} loading="lazy" className={`w-full h-full object-cover rounded-xl shadow-lg ${isModal ? 'object-contain bg-black' : ''}`} />
  }

  return (
    <div className="page-container max-w-7xl mx-auto py-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold gradient-text">Memory Wall</h1>
          <p className="text-light-muted dark:text-dark-muted font-semibold">Relive our best moments together.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-white dark:bg-dark-card rounded-xl p-1 shadow-sm flex border border-gray-100 dark:border-gray-800">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-coral text-white shadow' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
              <Grid size={18} />
            </button>
            <button onClick={() => setViewMode('timeline')} className={`p-2 rounded-lg transition-colors ${viewMode === 'timeline' ? 'bg-coral text-white shadow' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
              <List size={18} />
            </button>
            <button onClick={() => setViewMode('albums')} className={`p-2 rounded-lg transition-colors ${viewMode === 'albums' ? 'bg-coral text-white shadow' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
              <Folder size={18} />
            </button>
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`btn-icon ${showFilters || Object.values(filters).some(v=>v) ? 'text-coral border-coral bg-coral/10' : ''}`}>
            <Filter size={18} />
          </button>
          <button onClick={() => setShowUpload(true)} className="btn-primary flex-1 md:flex-none shadow-coral/30 shadow-lg">
            <Upload size={18} /> <span className="hidden sm:inline">Upload</span>
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-8">
            <div className="card p-5 grid grid-cols-2 md:grid-cols-5 gap-4 border border-coral/20 bg-gradient-to-r from-coral/5 to-purple-500/5">
              <div className="relative col-span-2 md:col-span-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} className="input-field pl-9 h-11 text-sm w-full bg-white dark:bg-black/40" />
              </div>
              <select value={filters.album} onChange={e => setFilters({...filters, album: e.target.value})} className="input-field h-11 text-sm bg-white dark:bg-black/40">
                <option value="">All Albums</option>
                {albums.map(a => <option key={a} value={a} className="capitalize">{a}</option>)}
              </select>
              <select value={filters.year} onChange={e => setFilters({...filters, year: e.target.value})} className="input-field h-11 text-sm bg-white dark:bg-black/40">
                <option value="">All Years</option>
                {[...new Set(memories.map(m => m.year).filter(Boolean))].sort((a,b)=>b-a).map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={filters.event} onChange={e => setFilters({...filters, event: e.target.value})} className="input-field h-11 text-sm bg-white dark:bg-black/40">
                <option value="">All Events</option>
                {eventsList.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
              </select>
              <button onClick={() => setFilters({...filters, favorite: filters.favorite ? '' : 'true'})} className={`h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm border ${filters.favorite ? 'bg-pink-100 text-pink-600 border-pink-200 dark:bg-pink-900/30 dark:border-pink-900' : 'bg-white text-gray-500 border-gray-200 dark:bg-black/40 dark:border-gray-800'}`}>
                <Star size={16} className={filters.favorite ? 'fill-current' : ''} /> Favorites
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      {loading ? (
        <div className="flex justify-center py-32"><Loader scale={0.5} /></div>
      ) : memories.length === 0 && viewMode !== 'albums' ? (
        <div className="text-center py-32 text-gray-400">
          <ImageIcon size={64} className="mx-auto mb-6 opacity-20" />
          <h2 className="text-2xl font-extrabold text-gray-800 dark:text-gray-200 mb-2">No memories found.</h2>
          <p className="font-semibold text-sm">Upload a photo to start the collection!</p>
        </div>
      ) : viewMode === 'albums' ? (
        
        /* 📁 ALBUMS VIEW */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {albums.map((album, idx) => (
            <motion.div 
              key={album} 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
              onClick={() => { setFilters({...filters, album}); setViewMode('grid') }}
              className="group cursor-pointer"
            >
              <div className="aspect-square bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-3xl p-6 border-2 border-transparent group-hover:border-indigo-400 transition-all flex flex-col items-center justify-center shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-2">
                <Folder size={64} className="text-indigo-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-extrabold capitalize text-gray-800 dark:text-gray-200 group-hover:text-indigo-500 transition-colors">{album}</h3>
              </div>
            </motion.div>
          ))}
        </div>

      ) : viewMode === 'grid' ? (
        
        /* 📸 GRID VIEW (Masonry Style via CSS Columns) */
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {memories.map((memory, index) => {
            const isLast = index === memories.length - 1
            return (
              <motion.div 
                key={memory._id} 
                ref={isLast ? lastMemoryRef : null}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="break-inside-avoid relative rounded-2xl overflow-hidden group cursor-pointer shadow-sm hover:shadow-2xl transition-all"
                onClick={() => setLightboxIndex(index)}
              >
                {renderMedia(memory)}
                {memory.type === 'video' && <div className="absolute top-3 right-3 bg-black/60 p-2 rounded-xl text-white backdrop-blur-md shadow-lg"><Video size={16} /></div>}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                  
                  {/* Action Buttons Overlay */}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); handleDownload(memory) }} className="p-2 bg-black/50 text-white rounded-full hover:bg-white hover:text-black backdrop-blur-md transition-colors"><Download size={16} /></button>
                    {(user.role === 'admin' || user._id === memory.uploadedBy._id) && (
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(memory._id) }} className="p-2 bg-black/50 text-white rounded-full hover:bg-red-500 backdrop-blur-md transition-colors"><Trash2 size={16} /></button>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mb-2">
                    <Avatar src={memory.uploadedBy.avatar} name={memory.uploadedBy.name} size={28} className="shadow-lg border-2 border-white/20" />
                    <span className="text-white text-sm font-bold shadow-sm">{memory.uploadedBy.nickname || memory.uploadedBy.name}</span>
                  </div>
                  {memory.caption && <p className="text-white/90 text-sm font-semibold truncate mb-3">{memory.caption}</p>}
                  <div className="flex items-center gap-4 text-white">
                    <span className="flex items-center gap-1.5 text-xs font-bold"><Heart size={16} className={memory.likes.includes(user._id) ? 'fill-coral text-coral' : ''}/> {memory.likes.length}</span>
                    <span className="flex items-center gap-1.5 text-xs font-bold"><MessageCircle size={16}/> {memory.comments.length}</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
          {loadingMore && <div className="py-10 flex justify-center w-full col-span-full"><Loader scale={0.3} /></div>}
        </div>

      ) : (

        /* 📜 TIMELINE VIEW */
        <div className="max-w-3xl mx-auto space-y-12">
          {memories.map((memory, index) => {
            const isLast = index === memories.length - 1
            return (
              <motion.div key={memory._id} ref={isLast ? lastMemoryRef : null} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="card overflow-hidden shadow-2xl border-0 ring-1 ring-black/5 dark:ring-white/10">
                <div className="p-5 flex items-center justify-between bg-gray-50/50 dark:bg-black/20">
                  <div className="flex items-center gap-4">
                    <Avatar src={memory.uploadedBy.avatar} name={memory.uploadedBy.name} size={48} className="shadow-md" />
                    <div>
                      <p className="font-extrabold text-base">{memory.uploadedBy.nickname || memory.uploadedBy.name}</p>
                      <p className="text-xs text-gray-500 font-bold tracking-wide uppercase">{format(new Date(memory.createdAt), 'MMMM d, yyyy')}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleDownload(memory)} className="btn-icon bg-white dark:bg-dark-card shadow-sm hover:text-coral"><Download size={18} /></button>
                    <button onClick={() => handleFavorite(memory._id)} className={`btn-icon bg-white dark:bg-dark-card shadow-sm ${memory.favorites?.includes(user._id) ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}><Star size={18} className={memory.favorites?.includes(user._id) ? 'fill-current' : ''}/></button>
                    {(user.role === 'admin' || user._id === memory.uploadedBy._id) && (
                      <button onClick={() => handleDelete(memory._id)} className="btn-icon bg-white dark:bg-dark-card shadow-sm text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
                    )}
                  </div>
                </div>

                <div className="w-full bg-black/5 dark:bg-black/50 flex items-center justify-center max-h-[700px] overflow-hidden" onClick={() => setLightboxIndex(index)}>
                  {renderMedia(memory, true)}
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-6 mb-4">
                    <button onClick={() => handleLike(memory._id)} className={`flex items-center gap-2 font-extrabold text-lg transition-colors ${memory.likes.includes(user._id) ? 'text-coral' : 'text-gray-500 hover:text-coral'}`}>
                      <Heart size={28} className={memory.likes.includes(user._id) ? 'fill-current drop-shadow-md' : ''} /> {memory.likes.length}
                    </button>
                    <div className="flex items-center gap-2 font-extrabold text-lg text-gray-500">
                      <MessageCircle size={28} /> {memory.comments.length}
                    </div>
                  </div>

                  {memory.caption && (
                    <p className="text-base text-gray-800 dark:text-gray-200 mb-4 leading-relaxed">
                      <span className="font-extrabold mr-3">{memory.uploadedBy.nickname || memory.uploadedBy.name}</span>
                      {memory.caption}
                    </p>
                  )}

                  {memory.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {memory.tags.map(t => <span key={t} className="text-xs font-bold text-coral bg-coral/10 border border-coral/20 px-3 py-1.5 rounded-lg">#{t}</span>)}
                    </div>
                  )}

                  {/* Comments */}
                  <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-gray-800/60">
                    {memory.comments.map(c => (
                      <div key={c._id} className="flex gap-3 group">
                        <Avatar src={c.user.avatar} name={c.user.name} size={32} />
                        <div className="flex-1 bg-gray-50 dark:bg-white/5 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-800">
                          <div className="flex justify-between items-start mb-1">
                            <p className="text-sm font-extrabold">{c.user.nickname || c.user.name}</p>
                            {(user.role === 'admin' || user._id === c.user._id) && (
                              <button onClick={() => deleteComment(memory._id, c._id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"><Trash2 size={14}/></button>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{c.text}</p>
                        </div>
                      </div>
                    ))}
                    <form onSubmit={(e) => handleComment(e, memory._id)} className="flex gap-3 mt-4">
                      <Avatar src={user.avatar} name={user.name} size={40} />
                      <input name="comment" type="text" placeholder="Add a comment..." className="input-field h-11 flex-1 text-sm rounded-full bg-gray-50 dark:bg-white/5 shadow-inner" />
                      <button type="submit" className="text-white bg-coral hover:bg-coral-dark font-bold text-sm px-6 rounded-full transition-colors shadow-lg shadow-coral/30">Post</button>
                    </form>
                  </div>
                </div>
              </motion.div>
            )
          })}
          {loadingMore && <div className="py-10 flex justify-center w-full"><Loader scale={0.3} /></div>}
        </div>
      )}

      {/* 🎇 LIGHTBOX / SLIDESHOW MODAL */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col justify-center items-center">
            
            {/* Top Controls */}
            <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-10 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-4 text-white">
                <Avatar src={memories[lightboxIndex].uploadedBy.avatar} name={memories[lightboxIndex].uploadedBy.name} size={48} className="border-2 border-white/20" />
                <div>
                  <h3 className="font-extrabold text-lg shadow-sm">{memories[lightboxIndex].uploadedBy.nickname || memories[lightboxIndex].uploadedBy.name}</h3>
                  <p className="text-sm text-white/70 font-semibold">{format(new Date(memories[lightboxIndex].createdAt), 'MMMM d, yyyy')}</p>
                </div>
              </div>
              <div className="flex gap-4">
                {(user.role === 'admin' || user._id === memories[lightboxIndex].uploadedBy._id) && (
                  <button onClick={() => handleDelete(memories[lightboxIndex]._id)} className="btn-icon bg-black/50 text-white border border-white/20 shadow-lg hover:bg-red-500 hover:border-red-500 transition-colors" title="Delete Memory"><Trash2 size={20} /></button>
                )}
                <button onClick={() => setIsPlaying(!isPlaying)} className={`btn-icon shadow-lg border border-white/20 hover:scale-110 transition-transform ${isPlaying ? 'bg-black text-white border-black' : 'bg-black/50 text-white'}`}>
                  {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
                </button>
                <button onClick={() => handleDownload(memories[lightboxIndex])} className="btn-icon bg-black/50 text-white border border-white/20 shadow-lg hover:bg-white hover:text-black transition-colors"><Download size={20} /></button>
                <button onClick={() => { setLightboxIndex(null); setIsPlaying(false) }} className="btn-icon bg-red-500/80 text-white border border-red-400/50 shadow-lg hover:bg-red-500 transition-colors"><X size={20} /></button>
              </div>
            </div>

            {/* Nav Arrows */}
            <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(p => (p - 1 + memories.length) % memories.length) }} className="absolute left-6 top-1/2 -translate-y-1/2 z-10 w-14 h-14 bg-black/50 border border-white/20 text-white rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all hover:scale-110 shadow-2xl">
              <ChevronLeft size={32} className="-ml-1" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(p => (p + 1) % memories.length) }} className="absolute right-6 top-1/2 -translate-y-1/2 z-10 w-14 h-14 bg-black/50 border border-white/20 text-white rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all hover:scale-110 shadow-2xl">
              <ChevronRight size={32} className="-mr-1" />
            </button>

            {/* Main Media Viewer */}
            <motion.div key={lightboxIndex} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="w-full h-full max-h-screen p-20 flex items-center justify-center">
              {memories[lightboxIndex].type === 'video' ? (
                <video src={memories[lightboxIndex].imageUrl} controls autoPlay className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl ring-1 ring-white/20" />
              ) : (
                <img src={memories[lightboxIndex].imageUrl} className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
              )}
            </motion.div>

            {/* Bottom Caption Overlay */}
            {memories[lightboxIndex].caption && (
              <div className="absolute bottom-0 left-0 w-full p-8 pt-20 bg-gradient-to-t from-black via-black/80 to-transparent z-10 text-center">
                <p className="text-white text-xl font-medium max-w-3xl mx-auto leading-relaxed drop-shadow-md">{memories[lightboxIndex].caption}</p>
                {memories[lightboxIndex].tags?.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {memories[lightboxIndex].tags.map(t => <span key={t} className="text-xs font-bold text-white/80 bg-white/10 px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-md">#{t}</span>)}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Modal (Same as before) */}
      <AnimatePresence>
        {showUpload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="card w-full max-w-xl p-5 sm:p-8 shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto no-overscroll"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl sm:text-2xl font-extrabold">Upload to Memory Wall</h2>
                <button onClick={() => setShowUpload(false)} className="btn-icon"><X size={20} /></button>
              </div>
              
              <form onSubmit={handleUploadSubmit} className="space-y-4 sm:space-y-6">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-video rounded-3xl border-2 border-dashed border-coral/30 hover:border-coral flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden bg-coral/5 group"
                >
                  {uploadData.preview ? (
                    uploadData.file?.type.startsWith('video/') ? (
                      <video src={uploadData.preview} className="w-full h-full object-cover" controls />
                    ) : (
                      <img src={uploadData.preview} className="w-full h-full object-cover" />
                    )
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-white dark:bg-dark-card rounded-2xl flex items-center justify-center text-coral mb-4 shadow-lg group-hover:scale-110 transition-transform"><Plus size={32} /></div>
                      <p className="font-bold text-coral text-sm">Click to select photo or video</p>
                    </>
                  )}
                </div>
                <input type="file" accept="image/*,video/*" className="hidden" ref={fileInputRef} onChange={e => {
                  const file = e.target.files[0]
                  if (file) setUploadData(prev => ({ ...prev, file, preview: URL.createObjectURL(file) }))
                }} />

                <textarea placeholder="Write a beautiful caption..." value={uploadData.caption} onChange={e => setUploadData({...uploadData, caption: e.target.value})} className="input-field w-full h-24 resize-none text-base" />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Album</label>
                    <select value={uploadData.album} onChange={e => setUploadData({...uploadData, album: e.target.value})} className="input-field w-full h-12">
                      <option value="random">Random</option>
                      <option value="birthday">Birthday</option>
                      <option value="vacation">Vacation</option>
                      <option value="festival">Festival</option>
                      <option value="reunion">Reunion</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Link Event (Opt)</label>
                    <select value={uploadData.event} onChange={e => setUploadData({...uploadData, event: e.target.value})} className="input-field w-full h-12">
                      <option value="">None</option>
                      {eventsList.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Tags (comma separated)</label>
                  <input type="text" placeholder="e.g. goa, beach, fun" value={uploadData.tags} onChange={e => setUploadData({...uploadData, tags: e.target.value})} className="input-field w-full h-12" />
                </div>

                <button type="submit" disabled={uploading} className="btn-primary w-full h-14 text-lg mt-4 shadow-xl shadow-coral/30">
                  {uploading ? <Loader scale={0.2} /> : 'Upload Memory'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
