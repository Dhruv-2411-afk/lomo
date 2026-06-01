import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Camera() {
  const { rollId } = useParams()
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [roll, setRoll] = useState(null)
  const [capturing, setCapturing] = useState(false)
  const [flash, setFlash] = useState(false)
  const [stream, setStream] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchRoll()
    startCamera()
    return () => stopCamera()
  }, [])

  const fetchRoll = async () => {
    const { data } = await supabase
      .from('rolls')
      .select('*')
      .eq('id', rollId)
      .single()
    if (!data || data.status !== 'shooting') {
      navigate('/rolls')
      return
    }
    setRoll(data)
  }

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      })
      setStream(mediaStream)
      if (videoRef.current) videoRef.current.srcObject = mediaStream
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions.')
    }
  }

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach(track => track.stop())
  }

  const takePhoto = async () => {
    if (!roll || capturing || roll.shots_used >= roll.shot_limit) return
    setCapturing(true)
    setFlash(true)
    setTimeout(() => setFlash(false), 150)

    try {
      // Capture frame from video
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0)

      // Add film grain effect
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        const grain = (Math.random() - 0.5) * 30
        data[i] = Math.min(255, Math.max(0, data[i] + grain))
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain))
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain))
      }
      ctx.putImageData(imageData, 0, 0)

      // Convert to blob
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85))
      const { data: { user } } = await supabase.auth.getUser()
      const filename = `${user.id}/${rollId}/${Date.now()}.jpg`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filename, blob, { contentType: 'image/jpeg' })

      if (uploadError) throw uploadError

      // Insert photo record
      await supabase.from('photos').insert({
        roll_id: rollId,
        user_id: user.id,
        storage_path: filename,
        is_visible: false
      })

      // Increment shots
      const newShotsUsed = roll.shots_used + 1
      await supabase
        .from('rolls')
        .update({ shots_used: newShotsUsed })
        .eq('id', rollId)

      // Start developing if roll is full
      if (newShotsUsed >= roll.shot_limit) {
        await supabase.rpc('start_developing', { p_roll_id: rollId })
        stopCamera()
        navigate('/rolls')
        return
      }

      setRoll(prev => ({ ...prev, shots_used: newShotsUsed }))
    } catch (err) {
      console.error(err)
      setError('Failed to capture photo. Try again.')
    }
    setCapturing(false)
  }

  const shotsLeft = roll ? roll.shot_limit - roll.shots_used : 0

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Flash overlay */}
      {flash && <div className="fixed inset-0 bg-white z-50 pointer-events-none" />}

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black z-10">
        <button onClick={() => { stopCamera(); navigate('/rolls') }}
          className="text-lomo-muted font-mono text-sm hover:text-white transition-colors">
          ← back
        </button>
        <p className="font-mono text-lomo-amber font-bold">{roll?.name}</p>
        <div className="text-right">
          <p className="font-mono text-lomo-amber font-bold text-lg">{shotsLeft}</p>
          <p className="font-mono text-lomo-muted text-xs">left</p>
        </div>
      </div>

      {/* Camera viewfinder */}
      <div className="relative flex-1 overflow-hidden">
        {error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-red-400 font-mono text-sm text-center px-8">{error}</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ filter: 'contrast(1.05) saturate(0.9)' }}
            />
            {/* Viewfinder corners */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-lomo-amber opacity-60" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-lomo-amber opacity-60" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-lomo-amber opacity-60" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-lomo-amber opacity-60" />
          </>
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Shot counter film strip */}
      <div className="bg-black px-4 py-2 flex gap-1 justify-center">
        {[...Array(roll?.shot_limit || 24)].map((_, i) => (
          <div key={i}
            className={`h-2 flex-1 max-w-4 rounded-sm transition-colors ${i < (roll?.shots_used || 0) ? 'bg-lomo-amber' : 'bg-lomo-border'}`}
          />
        ))}
      </div>

      {/* Shutter button */}
      <div className="bg-black px-4 py-6 flex items-center justify-center">
        <button
          onClick={takePhoto}
          disabled={capturing || shotsLeft === 0 || !!error}
          className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all
            ${shotsLeft === 0 ? 'border-lomo-muted opacity-30' : 'border-lomo-amber hover:bg-lomo-amber hover:bg-opacity-20 active:scale-95'}
            ${capturing ? 'scale-95' : ''}`}
        >
          <div className={`w-14 h-14 rounded-full ${capturing ? 'bg-lomo-amber' : 'bg-lomo-border'}`} />
        </button>
      </div>
    </div>
  )
}