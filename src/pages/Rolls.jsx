import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

const FILM_TYPES = {
  kodak_gold: { name: 'Kodak Gold', desc: 'Warm nostalgic tones', color: '#E09B2D' },
  portra: { name: 'Portra', desc: 'Soft and cinematic', color: '#B76E3A' },
  bw: { name: 'Black & White', desc: 'Timeless emotion', color: '#6F6A64' },
  party: { name: 'Party Roll', desc: 'Shared memories', color: '#52734D' },
}

export default function Rolls() {
  const [rolls, setRolls] = useState([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [showNewRoll, setShowNewRoll] = useState(false)
  const [newRollStep, setNewRollStep] = useState(1)
  const [selectedFilm, setSelectedFilm] = useState('kodak_gold')
  const [rollName, setRollName] = useState('')
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchRolls()
    fetchProfile()
    const channel = supabase
      .channel('rolls-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rolls' }, fetchRolls)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(data)
  }

  const fetchRolls = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('rolls')
      .select('*, roll_members!inner(*)')
      .eq('roll_members.user_id', user.id)
      .order('created_at', { ascending: false })
    setRolls(data || [])
    setLoading(false)
  }

  const createRoll = async () => {
    if (profile?.rolls_remaining < 1) { navigate('/shop'); return }
    setCreating(true)
    const { data: { user } } = await supabase.auth.getUser()
    const name = rollName.trim() || `Roll #${Date.now().toString().slice(-4)}`
    const { data } = await supabase
      .from('rolls')
      .insert({ owner_id: user.id, name, film_type: selectedFilm })
      .select().single()
    await supabase.from('profiles')
      .update({ rolls_remaining: profile.rolls_remaining - 1 })
      .eq('id', user.id)
    setCreating(false)
    setShowNewRoll(false)
    setNewRollStep(1)
    setRollName('')
    if (data) navigate(`/camera/${data.id}`)
  }

  const getHour = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good Morning'
    if (h < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  const getCountdown = (develops_at) => {
    if (!develops_at) return null
    const diff = new Date(develops_at) - new Date()
    if (diff <= 0) return 'ready soon...'
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return `${h}h ${m}m`
  }

  const shootingRolls = rolls.filter(r => r.status === 'shooting')
  const developingRolls = rolls.filter(r => r.status === 'developing')
  const developedRolls = rolls.filter(r => r.status === 'developed')

  const username = profile?.username?.split('@')[0] || 'there'

  return (
    <div className="min-h-screen bg-lomo-bg">
      {/* Header */}
      <nav className="flex items-center justify-between px-6 py-5 border-b border-lomo-border">
        <span className="font-mono font-bold text-lomo-text tracking-tight">lomo</span>
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/shop')}
            className="font-mono text-xs text-lomo-muted hover:text-lomo-text transition-colors">
            {profile?.rolls_remaining ?? 0} rolls left
          </button>
          <button onClick={() => supabase.auth.signOut()}
            className="font-mono text-xs text-lomo-muted hover:text-lomo-text transition-colors">
            sign out
          </button>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-6 py-10">
        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="font-serif text-3xl text-lomo-text mb-1">
            {getHour()}, {username}.
          </h1>
          <p className="font-mono text-xs text-lomo-muted">
            {developingRolls.length > 0
              ? `You have ${developingRolls.length} roll${developingRolls.length > 1 ? 's' : ''} developing in the dark.`
              : developedRolls.length > 0
              ? `${developedRolls.length} roll${developedRolls.length > 1 ? 's' : ''} ready to relive.`
              : 'Ready to capture some moments?'}
          </p>
        </motion.div>

        {/* Stats */}
        {rolls.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-10">
            {[
              { value: rolls.reduce((a, r) => a + r.shots_used, 0), label: 'memories preserved' },
              { value: developedRolls.length, label: 'rolls developed' },
              { value: rolls.length, label: 'total rolls' },
            ].map(s => (
              <div key={s.label} className="bg-lomo-secondary rounded-xl p-4 text-center">
                <p className="font-mono font-bold text-lomo-text text-xl">{s.value}</p>
                <p className="font-mono text-lomo-muted text-xs mt-1 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Load new roll button */}
        <button onClick={() => setShowNewRoll(true)}
          className="w-full bg-lomo-text text-lomo-bg font-mono text-sm py-4 mb-8 hover:bg-lomo-brown transition-colors rounded-xl">
          + Load New Roll
        </button>

        {/* Empty state */}
        {!loading && rolls.length === 0 && (
          <div className="text-center py-16">
            <p className="font-serif text-2xl text-lomo-text mb-3">No memories waiting yet.</p>
            <p className="font-mono text-xs text-lomo-muted">Load your first roll and start preserving moments.</p>
          </div>
        )}

        {/* Developing rolls */}
        {developingRolls.length > 0 && (
          <div className="mb-8">
            <p className="font-mono text-xs text-lomo-muted uppercase tracking-widest mb-4">developing in darkness</p>
            <div className="space-y-3">
              {developingRolls.map(roll => (
                <motion.div key={roll.id} layout
                  className="bg-lomo-secondary border border-lomo-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-mono font-bold text-lomo-text">{roll.name}</p>
                      <p className="font-mono text-xs text-lomo-muted mt-0.5">
                        {FILM_TYPES[roll.film_type]?.name || 'Kodak Gold'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-lomo-gold text-sm font-bold">⏳ {getCountdown(roll.develops_at)}</p>
                      <p className="font-mono text-lomo-muted text-xs">remaining</p>
                    </div>
                  </div>
                  <div className="h-1 bg-lomo-border rounded-full">
                    <div className="h-1 bg-lomo-gold rounded-full w-full" />
                  </div>
                  <p className="font-mono text-lomo-muted text-xs mt-2">
                    your memories are developing — we'll email you when they're ready
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Ready to relive */}
        {developedRolls.length > 0 && (
          <div className="mb-8">
            <p className="font-mono text-xs text-lomo-muted uppercase tracking-widest mb-4">ready to relive</p>
            <div className="space-y-3">
              {developedRolls.map(roll => (
                <motion.div key={roll.id} layout
                  onClick={() => navigate(`/roll/${roll.id}`)}
                  whileHover={{ scale: 1.01 }}
                  className="bg-lomo-secondary border border-lomo-border rounded-xl p-5 cursor-pointer hover:border-lomo-gold transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono font-bold text-lomo-text">{roll.name}</p>
                      <p className="font-mono text-xs text-lomo-success mt-0.5">✓ Ready To Relive</p>
                    </div>
                    <span className="font-mono text-lomo-muted text-xs">→</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Currently shooting */}
        {shootingRolls.length > 0 && (
          <div className="mb-8">
            <p className="font-mono text-xs text-lomo-muted uppercase tracking-widest mb-4">capturing memories</p>
            <div className="space-y-3">
              {shootingRolls.map(roll => (
                <motion.div key={roll.id} layout
                  onClick={() => navigate(`/camera/${roll.id}`)}
                  whileHover={{ scale: 1.01 }}
                  className="bg-lomo-secondary border border-lomo-border rounded-xl p-5 cursor-pointer hover:border-lomo-gold transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-mono font-bold text-lomo-text">{roll.name}</p>
                      <p className="font-mono text-xs text-lomo-muted mt-0.5">
                        {FILM_TYPES[roll.film_type]?.name || 'Kodak Gold'} · tap to continue
                      </p>
                    </div>
                    <p className="font-mono text-lomo-gold font-bold">{roll.shots_used}/{roll.shot_limit}</p>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(roll.shot_limit)].map((_, i) => (
                      <div key={i}
                        className={`h-1 flex-1 rounded-sm transition-colors ${i < roll.shots_used ? 'bg-lomo-gold' : 'bg-lomo-border'}`}
                      />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Roll Modal */}
      {showNewRoll && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-4">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-lomo-bg rounded-2xl p-6 w-full max-w-md">

            {newRollStep === 1 && (
              <>
                <p className="font-serif text-xl text-lomo-text mb-2">What kind of memories are you creating?</p>
                <p className="font-mono text-xs text-lomo-muted mb-6">Choose your film personality</p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {Object.entries(FILM_TYPES).map(([key, film]) => (
                    <button key={key}
                      onClick={() => setSelectedFilm(key)}
                      className={`p-4 rounded-xl border text-left transition-all ${selectedFilm === key ? 'border-lomo-gold bg-lomo-secondary' : 'border-lomo-border hover:border-lomo-gold'}`}>
                      <div className="w-3 h-3 rounded-full mb-2" style={{ backgroundColor: film.color }} />
                      <p className="font-mono font-bold text-lomo-text text-xs">{film.name}</p>
                      <p className="font-mono text-lomo-muted text-xs mt-0.5">{film.desc}</p>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowNewRoll(false)}
                    className="flex-1 border border-lomo-border font-mono text-xs py-3 rounded-xl text-lomo-muted hover:border-lomo-text transition-colors">
                    cancel
                  </button>
                  <button onClick={() => setNewRollStep(2)}
                    className="flex-1 bg-lomo-text text-lomo-bg font-mono text-xs py-3 rounded-xl hover:bg-lomo-brown transition-colors">
                    next →
                  </button>
                </div>
              </>
            )}

            {newRollStep === 2 && (
              <>
                <p className="font-serif text-xl text-lomo-text mb-2">Name your roll</p>
                <p className="font-mono text-xs text-lomo-muted mb-6">Give this memory a title</p>
                <input
                  type="text"
                  value={rollName}
                  onChange={e => setRollName(e.target.value)}
                  placeholder="e.g. Goa Trip, Last Semester..."
                  className="w-full border border-lomo-border bg-lomo-secondary font-mono text-sm px-4 py-3 rounded-xl mb-3 text-lomo-text placeholder-lomo-muted focus:outline-none focus:border-lomo-gold"
                />
                <div className="flex gap-2 mb-6 flex-wrap">
                  {['Summer 2026', 'Late Night Memories', 'Road Trip', 'College Fest'].map(s => (
                    <button key={s} onClick={() => setRollName(s)}
                      className="font-mono text-xs border border-lomo-border px-3 py-1.5 rounded-full text-lomo-muted hover:border-lomo-gold hover:text-lomo-text transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setNewRollStep(1)}
                    className="flex-1 border border-lomo-border font-mono text-xs py-3 rounded-xl text-lomo-muted hover:border-lomo-text transition-colors">
                    ← back
                  </button>
                  <button onClick={createRoll} disabled={creating}
                    className="flex-1 bg-lomo-text text-lomo-bg font-mono text-xs py-3 rounded-xl hover:bg-lomo-brown transition-colors disabled:opacity-50">
                    {creating ? 'loading film...' : 'load film →'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}