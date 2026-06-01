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
    <div className="min-h-screen bg-white">
      <div className="px-6 py-6 border-b border-zinc-100 max-w-2xl mx-auto">
        <button onClick={() => navigate('/rolls')}
          className="text-zinc-400 font-mono text-xs hover:text-zinc-900 mb-6 block transition-colors">
          ← back
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-mono font-bold text-zinc-900 text-xl">{roll?.name}</h1>
            <p className="font-mono text-xs text-zinc-400 mt-1">
              {roll?.shots_used}/{roll?.shot_limit} shots
            </p>
          </div>
          {roll?.is_shared && (
            <button onClick={copyInviteLink}
              className="font-mono text-xs border border-zinc-200 px-3 py-2 text-zinc-500 hover:border-zinc-900 hover:text-zinc-900 transition-colors">
              {copying ? 'copied!' : 'share link'}
            </button>
          )}
        </div>
      </div>

      {roll?.status === 'developing' && (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center max-w-sm mx-auto">
          <p className="font-mono text-zinc-900 font-bold text-2xl mb-3">developing...</p>
          <p className="font-mono text-zinc-400 text-sm mb-2">
            {getCountdown(roll.develops_at)}
          </p>
          <p className="font-mono text-zinc-300 text-xs mt-4">
            we'll email you when your photos are ready.
          </p>
        </div>
      )}

      {roll?.status === 'shooting' && (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
          <p className="font-mono text-zinc-900 font-bold text-2xl mb-3">still shooting</p>
          <p className="font-mono text-zinc-400 text-sm mb-8">
            {roll.shot_limit - roll.shots_used} shots remaining
          </p>
          <button onClick={() => navigate(`/camera/${rollId}`)}
            className="border border-zinc-900 text-zinc-900 font-mono text-sm px-6 py-3 hover:bg-zinc-900 hover:text-white transition-colors">
            continue shooting →
          </button>
        </div>
      )}

      {roll?.status === 'developed' && (
        <div className="max-w-2xl mx-auto p-6">
          {loading ? (
            <p className="text-zinc-400 font-mono text-center py-12 text-sm">loading...</p>
          ) : photos.length === 0 ? (
            <p className="text-zinc-400 font-mono text-center py-12 text-sm">no photos found.</p>
          ) : (
            <div className="grid grid-cols-2 gap-1 mt-4">
              {photos.map((photo, i) => (
                <div key={photo.id} className="relative aspect-square bg-zinc-100 overflow-hidden">
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