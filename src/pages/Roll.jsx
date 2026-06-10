import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'

export default function Roll() {
  const { rollId } = useParams()
  const navigate = useNavigate()
  const [roll, setRoll] = useState(null)
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [revealing, setRevealing] = useState(false)
  const [revealIndex, setRevealIndex] = useState(0)
  const [showGrid, setShowGrid] = useState(false)

  useEffect(() => {
    fetchRoll()
    fetchPhotos()
  }, [rollId])

  const fetchRoll = async () => {
    const { data } = await supabase.from('rolls').select('*').eq('id', rollId).single()
    if (data) setRoll(data)
  }

  const fetchPhotos = async () => {
    const { data } = await supabase
      .from('photos').select('*')
      .eq('roll_id', rollId).eq('is_visible', true)
      .order('taken_at', { ascending: true })

    if (data?.length > 0) {
      const withUrls = await Promise.all(data.map(async (photo) => {
        if (photo.cloudinary_url) return { ...photo, url: photo.cloudinary_url }
        const { data: urlData } = await supabase.storage
          .from('photo').createSignedUrl(photo.storage_path, 3600)
        return { ...photo, url: urlData?.signedUrl }
      }))
      setPhotos(withUrls)
    }
    setLoading(false)
  }

  const startReveal = () => {
    setRevealing(true)
    setRevealIndex(0)
  }

  const getCountdown = (develops_at) => {
    if (!develops_at) return null
    const diff = new Date(develops_at) - new Date()
    if (diff <= 0) return 'developing now...'
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return `ready in ${h}h ${m}m`
  }

  // Reveal mode
  if (revealing && !showGrid) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div key={revealIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="relative w-full max-w-lg aspect-square">
            <img src={photos[revealIndex]?.url} alt=""
              className="w-full h-full object-cover"
              style={{ filter: 'contrast(1.05) saturate(0.85)' }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-40" />
            <div className="absolute bottom-6 left-0 right-0 text-center">
              <p className="font-mono text-white text-xs opacity-60">{revealIndex + 1} / {photos.length}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-4 mt-8">
          {revealIndex > 0 && (
            <button onClick={() => setRevealIndex(i => i - 1)}
              className="font-mono text-zinc-500 text-xs hover:text-white transition-colors">← prev</button>
          )}
          {revealIndex < photos.length - 1 ? (
            <button onClick={() => setRevealIndex(i => i + 1)}
              className="font-mono text-white text-xs border border-zinc-700 px-4 py-2 hover:border-white transition-colors">
              next →
            </button>
          ) : (
            <button onClick={() => setShowGrid(true)}
              className="font-mono text-lomo-gold text-xs border border-lomo-gold px-4 py-2 hover:bg-lomo-gold hover:text-black transition-colors">
              view all →
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-lomo-bg">
      <div className="px-6 py-6 border-b border-lomo-border max-w-2xl mx-auto">
        <button onClick={() => navigate('/rolls')}
          className="text-lomo-muted font-mono text-xs hover:text-lomo-text mb-6 block transition-colors">← back</button>
        <h1 className="font-serif text-2xl text-lomo-text">{roll?.name}</h1>
        <p className="font-mono text-xs text-lomo-muted mt-1">{roll?.shots_used} memories · {roll?.status}</p>
      </div>

      {roll?.status === 'developing' && (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center max-w-sm mx-auto">
          <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }}>
            <p className="font-serif text-3xl text-lomo-text mb-4">Developing in darkness.</p>
          </motion.div>
          <p className="font-mono text-lomo-gold text-sm mb-2">{getCountdown(roll.develops_at)}</p>
          <p className="font-mono text-lomo-muted text-xs mt-4">we'll email you when your memories are ready.</p>
        </div>
      )}

      {roll?.status === 'shooting' && (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
          <p className="font-serif text-3xl text-lomo-text mb-4">Still capturing.</p>
          <p className="font-mono text-lomo-muted text-sm mb-8">{roll.shot_limit - roll.shots_used} frames remaining</p>
          <button onClick={() => navigate(`/camera/${rollId}`)}
            className="bg-lomo-text text-lomo-bg font-mono text-sm px-6 py-3 hover:bg-lomo-brown transition-colors rounded-xl">
            continue shooting →
          </button>
        </div>
      )}

      {roll?.status === 'developed' && (
        <div className="max-w-2xl mx-auto p-6">
          {loading ? (
            <p className="text-lomo-muted font-mono text-center py-12 text-sm">loading memories...</p>
          ) : photos.length === 0 ? (
            <p className="text-lomo-muted font-mono text-center py-12 text-sm">no photos found.</p>
          ) : !showGrid ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="text-center py-16">
              <p className="font-serif text-3xl text-lomo-text mb-4">The wait is over.</p>
              <p className="font-mono text-lomo-muted text-sm mb-2">
                {photos.length} memories from {new Date(roll.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              </p>
              <p className="font-mono text-lomo-muted text-xs mb-10">developed {new Date(roll.developed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
              <button onClick={startReveal}
                className="bg-lomo-text text-lomo-bg font-mono text-sm px-8 py-4 hover:bg-lomo-brown transition-colors rounded-xl">
                reveal memories →
              </button>
            </motion.div>
          ) : (
            <div>
              <p className="font-mono text-xs text-lomo-muted uppercase tracking-widest mb-4 text-center">
                {photos.length} memories preserved
              </p>
              <div className="grid grid-cols-2 gap-1">
                {photos.map((photo, i) => (
                  <motion.div key={photo.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="relative aspect-square bg-lomo-secondary overflow-hidden">
                    <img src={photo.url} alt={`Memory ${i + 1}`}
                      className="w-full h-full object-cover"
                      style={{ filter: 'contrast(1.05) saturate(0.85)' }} />
                    <div className="absolute bottom-1 right-2 font-mono text-white text-xs opacity-30">{i + 1}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}