import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'

function FilmGrain() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let frame
    const render = () => {
      const w = canvas.width = window.innerWidth
      const h = canvas.height = window.innerHeight
      const imageData = ctx.createImageData(w, h)
      for (let i = 0; i < imageData.data.length; i += 4) {
        const v = Math.random() * 255
        imageData.data[i] = v
        imageData.data[i+1] = v
        imageData.data[i+2] = v
        imageData.data[i+3] = 8
      }
      ctx.putImageData(imageData, 0, 0)
      frame = requestAnimationFrame(render)
    }
    render()
    return () => cancelAnimationFrame(frame)
  }, [])
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
}

export default function Landing() {
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/rolls` }
    })
  }

  return (
    <div className="min-h-screen bg-lomo-bg flex flex-col relative overflow-hidden">
      <FilmGrain />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6">
        <span className="font-mono font-bold text-lomo-text tracking-tight text-lg">lomo</span>
        <button onClick={handleLogin}
          className="font-mono text-xs text-lomo-muted hover:text-lomo-text transition-colors">
          sign in →
        </button>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center py-20">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="font-mono text-xs text-lomo-muted tracking-widest uppercase mb-8">
          disposable camera · web edition
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="font-serif text-5xl md:text-7xl text-lomo-text leading-tight mb-8 max-w-2xl">
          Some moments deserve <em>waiting for.</em>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="font-mono text-sm text-lomo-muted leading-relaxed max-w-md mb-12">
          24 photos. No previews. No deleting.<br />
          Developed after 24 hours — just like the real thing.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4 items-center">
          <button onClick={handleLogin}
            className="bg-lomo-text text-lomo-bg font-mono text-sm px-8 py-4 hover:bg-lomo-brown transition-colors flex items-center gap-3">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            Load Your First Roll
          </button>
        </motion.div>

        {/* Film counter animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-16 flex items-center gap-3">
          <div className="flex gap-1">
            {[...Array(24)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ backgroundColor: '#E09B2D' }}
                animate={{ backgroundColor: i < 18 ? '#EFE8DE' : '#E09B2D' }}
                transition={{ delay: 1 + i * 0.05, duration: 0.3 }}
                className="w-2 h-4 rounded-sm"
              />
            ))}
          </div>
          <span className="font-mono text-xs text-lomo-muted">18 / 24</span>
        </motion.div>
      </main>

      {/* How it works */}
      <section className="relative z-10 border-t border-lomo-border px-8 py-16">
        <div className="max-w-3xl mx-auto">
          <p className="font-mono text-xs text-lomo-muted uppercase tracking-widest text-center mb-12">how it works</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Load Film', desc: 'Choose your film type and name your roll.' },
              { step: '02', title: 'Capture Moments', desc: '24 shots. No previews. No second-guessing.' },
              { step: '03', title: 'Wait 24 Hours', desc: 'Your memories develop in the dark.' },
              { step: '04', title: 'Relive Memories', desc: 'Experience the magic of the reveal.' },
            ].map((item) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center">
                <p className="font-mono text-lomo-gold text-xs mb-3">{item.step}</p>
                <p className="font-mono font-bold text-lomo-text text-sm mb-2">{item.title}</p>
                <p className="font-mono text-lomo-muted text-xs leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Emotional section */}
      <section className="relative z-10 bg-lomo-secondary px-8 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <p className="font-serif text-2xl md:text-3xl text-lomo-text leading-relaxed italic">
            "When everything is instant, moments lose their weight. Waiting creates anticipation. Anticipation creates emotion."
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 border-t border-lomo-border px-8 py-10">
        <div className="max-w-2xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '24', label: 'shots per roll' },
            { value: '24h', label: 'develop time' },
            { value: 'free', label: 'to start' },
            { value: '∞', label: 'memories' },
          ].map(s => (
            <div key={s.label}>
              <p className="font-mono font-bold text-lomo-text text-xl">{s.value}</p>
              <p className="font-mono text-lomo-muted text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-lomo-border px-8 py-5 text-center">
        <p className="font-mono text-lomo-muted text-xs">lomo · some moments deserve waiting for</p>
      </footer>
    </div>
  )
}