import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Roll() {
  const { rollId } = useParams()
  const navigate = useNavigate()
  const [roll, setRoll] = useState(null)
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [copying, setCopying] = useState(false)

  useEffect(() => {
    fetchRoll()
    fetchPhotos()

    const channel = supabase
      .channel('roll-updates')
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'rolls',
        filter: `id=eq.${rollId}`
      }, () => { fetchRoll(); fetchPhotos() })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [rollId])

  const fetchRoll = async () => {
    const { data } = await supabase
      .from('rolls')
      .select('*')
      .eq('id', rollId)
      .single()
    setRoll(data)
  }

  const fetchPhotos = async () => {
    const { data } = await supabase
      .from('photos')
      .select('*')
      .eq('roll_id', rollId)
      .eq('is_visible', true)
      .order('taken_at', { ascending: true })

    if (data) {
      const photosWithUrls = await Promise.all(data.map(async (photo) => {
        if (photo.cloudinary_url) return { ...photo, url: photo.cloudinary_url }
        const { data: urlData } = await supabase.storage
          .from('photos')
          .createSignedUrl(photo.storage_path, 3600)
        return { ...photo, url: urlData?.signedUrl }
      }))
      setPhotos(photosWithUrls)
    }
    setLoading(false)
  }

  const copyInviteLink = async () => {
    setCopying(true)
    await navigator.clipboard.writeText(`${window.location.origin}/join/${rollId}`)
    setTimeout(() => setCopying(false), 2000)
  }

  const getCountdown = (develops_at) => {
    if (!develops_at) return null
    const diff = new Date(develops_at) - new Date()
    if (diff <= 0) return 'developing now...'
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return `ready in ${h}h ${m}m`
  }

  return (
    <div className="min-h-screen bg-lomo-bg">
      {/* Header */}
      <div className="px-4 py-6 border-b border-lomo-border">
        <button onClick={() => navigate('/rolls')}
          className="text-lomo-muted font-mono text-sm hover:text-white mb-4 block">
          ← back
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-mono font-bold text-lomo-text text-xl">{roll?.name}</h1>
            <p className="font-mono text-xs text-lomo-muted mt-1">
              {roll?.shots_used}/{roll?.shot_limit} shots
            </p>
          </div>
          {roll?.is_shared && (
            <button onClick={copyInviteLink}
              className="font-mono text-xs border border-lomo-border px-3 py-2 text-lomo-muted hover:border-lomo-amber hover:text-lomo-amber transition-colors">
              {copying ? 'copied!' : 'share link'}
            </button>
          )}
        </div>
      </div>

      {/* Developing state */}
      {roll?.status === 'developing' && (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
          <div className="text-6xl mb-6">⏳</div>
          <p className="font-mono text-lomo-amber font-bold text-xl mb-2">developing...</p>
          <p className="font-mono text-lomo-muted text-sm">
            {getCountdown(roll.develops_at)}
          </p>
          <p className="font-mono text-lomo-muted text-xs mt-4 max-w-xs">
            your photos are being developed. check back soon — we'll email you when they're ready.
          </p>
        </div>
      )}

      {/* Shooting state */}
      {roll?.status === 'shooting' && (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
          <div className="text-6xl mb-6">🎞</div>
          <p className="font-mono text-lomo-amber font-bold text-xl mb-2">still shooting</p>
          <p className="font-mono text-lomo-muted text-sm mb-6">
            {roll.shot_limit - roll.shots_used} shots remaining
          </p>
          <button onClick={() => navigate(`/camera/${rollId}`)}
            className="bg-lomo-amber text-black font-mono font-bold px-6 py-3 text-sm uppercase tracking-wider hover:bg-yellow-400 transition-colors">
            continue shooting →
          </button>
        </div>
      )}

      {/* Developed photos */}
      {roll?.status === 'developed' && (
        <div className="p-4">
          {loading ? (
            <p className="text-lomo-muted font-mono text-center py-12">loading photos...</p>
          ) : photos.length === 0 ? (
            <p className="text-lomo-muted font-mono text-center py-12">no photos found.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 mt-4">
              {photos.map((photo, i) => (
                <div key={photo.id} className="relative aspect-square bg-lomo-card overflow-hidden">
                  <img
                    src={photo.url}
                    alt={`Photo ${i + 1}`}
                    className="w-full h-full object-cover"
                    style={{ filter: 'contrast(1.05) saturate(0.85)' }}
                  />
                  <div className="absolute bottom-1 right-2 font-mono text-white text-xs opacity-40">
                    {i + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}