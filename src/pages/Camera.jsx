import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'

const FILM_FILTERS = {
  kodak_gold: { css: 'contrast(1.1) saturate(1.3) sepia(0.2) brightness(1.05)', grain: 20 },
  portra: { css: 'contrast(0.95) saturate(0.9) brightness(1.1) hue-rotate(5deg)', grain: 15 },
  bw: { css: 'grayscale(1) contrast(1.2) brightness(0.95)', grain: 25 },
  party: { css: 'contrast(1.1) saturate(1.5) brightness(1.05)', grain: 10 },
}

export default function Camera() {
  const { rollId } = useParams()
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [roll, setRoll] = useState(null)
  const [capturing, setCapturing] = useState(false)
  const [flash, setFlash] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [facingMode, setFacingMode] = useState('environment')
  const [permissionDenied, setPermissionDenied] = useState(false)

  useEffect(() => {
    fetchRoll()
  }, [])

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [facingMode])

  const fetchRoll = async () => {
    const { data } = await supabase.from('rolls').select('*').eq('id', rollId).single()
    if (!data || data.status !== 'shooting') { navigate('/rolls'); return }
    setRoll(data)
  }

  const startCamera = async () => {
    stopCamera()
    setError(null)
    try {
      // Try with facing mode first
      let mediaStream
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        })
      } catch {
        // Fallback without facing mode constraint
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        })
      }
      streamRef.current = mediaStream
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
      }
      setPermissionDenied(false)
    } catch (err) {
      console.error('Camera error:', err)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true)
        setError('Camera permission denied. Please allow camera access in your browser settings.')
      } else {
        setError('Could not access camera. Please try again.')
      }
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }

  const showMessage = (msg) => {
    setMessage(msg)
    setTimeout(() => setMessage(null), 2500)
  }

  const applyFilmFilter = (ctx, canvas, filmType) => {
    const filter = FILM_FILTERS[filmType] || FILM_FILTERS.kodak_gold
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
      const grain = (Math.random() - 0.5) * filter.grain
      if (filmType === 'bw') {
        const avg = (data[i] + data[i+1] + data[i+2]) / 3 + grain
        data[i] = data[i+1] = data[i+2] = Math.min(255, Math.max(0, avg))
      } else if (filmType === 'kodak_gold') {
        data[i] = Math.min(255, Math.max(0, data[i] * 1.1 + grain))
        data[i+1] = Math.min(255, Math.max(0, data[i+1] * 1.0 + grain))
        data[i+2] = Math.min(255, Math.max(0, data[i+2] * 0.85 + grain))
      } else if (filmType === 'portra') {
        data[i] = Math.min(255, Math.max(0, data[i] * 1.05 + grain))
        data[i+1] = Math.min(255, Math.max(0, data[i+1] * 1.02 + grain))
        data[i+2] = Math.min(255, Math.max(0, data[i+2] * 0.95 + grain))
      } else {
        data[i] = Math.min(255, Math.max(0, data[i] + grain))
        data[i+1] = Math.min(255, Math.max(0, data[i+1] + grain))
        data[i+2] = Math.min(255, Math.max(0, data[i+2] + grain))
      }
    }
    ctx.putImageData(imageData, 0, 0)
  }

  const takePhoto = async () => {
    if (!roll || capturing || roll.shots_used >= roll.shot_limit) return
    setCapturing(true)
    setFlash(true)
    setTimeout(() => setFlash(false), 150)

    try {
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas.width = video.videoWidth || 1280
      canvas.height = video.videoHeight || 720
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0)
      applyFilmFilter(ctx, canvas, roll.film_type || 'kodak_gold')

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85))
      const { data: { user } } = await supabase.auth.getUser()
      const filename = `${user.id}/${rollId}/${Date.now()}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('photo').upload(filename, blob, { contentType: 'image/jpeg' })
      if (uploadError) throw uploadError

      const { error: insertError } = await supabase.from('photos').insert({
        roll_id: rollId, user_id: user.id,
        storage_path: filename, is_visible: false,
        filter_applied: roll.film_type || 'kodak_gold'
      })
      if (insertError) throw insertError

      const newShotsUsed = roll.shots_used + 1
      await supabase.from('rolls').update({ shots_used: newShotsUsed }).eq('id', rollId)

      if (newShotsUsed >= roll.shot_limit) {
        await supabase.rpc('start_developing', { p_roll_id: rollId })
        stopCamera()
        navigate('/rolls')
        return
      }

      const remaining = roll.shot_limit - newShotsUsed
      if (remaining === 5) showMessage('Only 5 memories left. Choose carefully.')
      else if (remaining === 1) showMessage('Your final frame. Make it count.')
      else showMessage(`Memory captured · ${remaining} remaining`)

      setRoll(prev => ({ ...prev, shots_used: newShotsUsed }))
    } catch (err) {
      console.error(err)
      showMessage('Failed to capture. Try again.')
    }
    setCapturing(false)
  }

  const filmFilter = FILM_FILTERS[roll?.film_type] || FILM_FILTERS.kodak_gold
  const shotsLeft = roll ? roll.shot_limit - roll.shots_used : 0

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {flash && (
        <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-white z-50 pointer-events-none" />
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black z-10">
        <button onClick={() => { stopCamera(); navigate('/rolls') }}
          className="text-zinc-500 font-mono text-sm hover:text-white transition-colors">← back</button>
        <div className="text-center">
          <p className="font-mono text-white text-sm">{roll?.name}</p>
          <p className="font-mono text-zinc-600 text-xs">{roll?.film_type?.replace('_', ' ') || 'kodak gold'}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-lomo-gold font-bold text-lg">{shotsLeft}</p>
          <p className="font-mono text-zinc-600 text-xs">left</p>
        </div>
      </div>

      {/* Viewfinder */}
      <div className="relative flex-1 overflow-hidden">
        {permissionDenied ? (
          <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-4">
            <p className="text-red-400 font-mono text-sm">{error}</p>
            <button onClick={startCamera}
              className="border border-zinc-700 text-white font-mono text-xs px-4 py-2 hover:border-white transition-colors">
              try again
            </button>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-4">
            <p className="text-red-400 font-mono text-sm">{error}</p>
            <button onClick={startCamera}
              className="border border-zinc-700 text-white font-mono text-xs px-4 py-2 hover:border-white transition-colors">
              retry
            </button>
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline muted
              className="w-full h-full object-cover"
              style={{ filter: filmFilter.css }} />
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white opacity-20" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white opacity-20" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white opacity-20" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-white opacity-20" />
          </>
        )}

        <AnimatePresence>
          {message && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none">
              <div className="bg-black bg-opacity-70 text-white font-mono text-xs px-4 py-2 rounded-full">
                {message}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Film strip */}
      <div className="bg-black px-4 py-2 flex gap-0.5 justify-center">
        {[...Array(roll?.shot_limit || 24)].map((_, i) => (
          <div key={i}
            className={`h-1 flex-1 max-w-4 rounded-sm transition-colors ${i < (roll?.shots_used || 0) ? 'bg-lomo-gold' : 'bg-zinc-800'}`} />
        ))}
      </div>

      {/* Controls */}
      <div className="bg-black px-6 py-6 flex items-center justify-between">
        <button onClick={() => setFacingMode(f => f === 'environment' ? 'user' : 'environment')}
          className="w-12 h-12 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <button onClick={takePhoto} disabled={capturing || shotsLeft === 0 || !!permissionDenied}
          className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all
            ${shotsLeft === 0 ? 'border-zinc-700 opacity-30' : 'border-white hover:border-lomo-gold active:scale-95'}
            ${capturing ? 'scale-95' : ''}`}>
          <div className={`w-14 h-14 rounded-full transition-colors ${capturing ? 'bg-white' : 'bg-zinc-700'}`} />
        </button>

        <div className="w-12 h-12" />
      </div>
    </div>
  )
}