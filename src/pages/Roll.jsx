import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Rolls() {
  const [rolls, setRolls] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [profile, setProfile] = useState(null)
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
      console.log('rolls data:', data)
    setRolls(data || [])
    setLoading(false)
  }

  const createRoll = async () => {
    if (profile?.rolls_remaining < 1) { navigate('/shop'); return }
    setCreating(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('rolls')
      .insert({ owner_id: user.id, name: `Roll #${rolls.length + 1}` })
      .select().single()
    await supabase.from('profiles')
      .update({ rolls_remaining: profile.rolls_remaining - 1 })
      .eq('id', user.id)
    setCreating(false)
    if (data) navigate(`/camera/${data.id}`)
  }

  const getCountdown = (develops_at) => {
    if (!develops_at) return null
    const diff = new Date(develops_at) - new Date()
    if (diff <= 0) return 'ready soon...'
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return `ready in ${h}h ${m}m`
  }

  const handleSignOut = async () => { await supabase.auth.signOut() }

  const shootingRolls = rolls.filter(r => r.status === 'shooting')
  const developingRolls = rolls.filter(r => r.status === 'developing')
  const developedRolls = rolls.filter(r => r.status === 'developed')
  console.log('developed rolls:', developedRolls)
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
        <span className="font-mono font-bold text-zinc-900 tracking-tight">lomo</span>
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/shop')}
            className="font-mono text-xs text-zinc-400 hover:text-zinc-900 transition-colors">
            {profile?.rolls_remaining ?? 0} rolls left
          </button>
          <button onClick={handleSignOut}
            className="font-mono text-xs text-zinc-400 hover:text-zinc-900 transition-colors">
            sign out
          </button>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-6 py-10">

        {/* Empty state with explainer */}
        {!loading && rolls.length === 0 && (
          <div className="text-center py-12 border border-zinc-100 rounded-xl mb-8 px-6">
            <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl">🎞</span>
            </div>
            <h2 className="font-mono font-bold text-zinc-900 mb-2">your darkroom is empty</h2>
            <p className="font-mono text-zinc-400 text-xs leading-relaxed max-w-xs mx-auto mb-6">
              create your first roll to start shooting. you get 24 shots — no previews, no deletes. photos reveal after 24 hours.
            </p>
            <button onClick={createRoll} disabled={creating}
              className="bg-zinc-900 text-white font-mono text-xs px-6 py-3 hover:bg-zinc-700 transition-colors">
              {creating ? 'loading film...' : 'load your first roll →'}
            </button>
          </div>
        )}

        {/* New Roll Button (when rolls exist) */}
        {rolls.length > 0 && (
          <button onClick={createRoll} disabled={creating}
            className="w-full border border-dashed border-zinc-300 hover:border-zinc-900 text-zinc-400 hover:text-zinc-900 font-mono text-xs py-4 mb-8 transition-colors rounded">
            {creating ? 'loading film...' : '+ load new roll'}
          </button>
        )}

        {/* Currently Shooting */}
        {shootingRolls.length > 0 && (
          <div className="mb-8">
            <p className="font-mono text-xs text-zinc-400 uppercase tracking-widest mb-3">currently shooting</p>
            <div className="space-y-2">
              {shootingRolls.map(roll => (
                <div key={roll.id} onClick={() => navigate(`/camera/${roll.id}`)}
                  className="border border-zinc-100 hover:border-zinc-900 p-4 cursor-pointer transition-colors rounded-lg group">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-mono font-bold text-zinc-900 text-sm">{roll.name}</p>
                      <p className="font-mono text-zinc-400 text-xs mt-0.5">
                        {roll.shot_limit - roll.shots_used} shots remaining · tap to continue
                      </p>
                    </div>
                    <span className="font-mono text-zinc-900 text-xs group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                  <div className="h-1 bg-zinc-100 rounded-full">
                    <div className="h-1 bg-zinc-900 rounded-full transition-all"
                      style={{ width: `${(roll.shots_used / roll.shot_limit) * 100}%` }} />
                  </div>
                  <p className="font-mono text-zinc-300 text-xs mt-1 text-right">{roll.shots_used}/{roll.shot_limit}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Developing */}
        {developingRolls.length > 0 && (
          <div className="mb-8">
            <p className="font-mono text-xs text-zinc-400 uppercase tracking-widest mb-3">developing</p>
            <div className="space-y-2">
              {developingRolls.map(roll => (
                <div key={roll.id}
                  className="border border-amber-100 bg-amber-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono font-bold text-zinc-900 text-sm">{roll.name}</p>
                      <p className="font-mono text-amber-600 text-xs mt-0.5">
                        ⏳ {getCountdown(roll.develops_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-zinc-400 text-xs">{roll.shots_used} shots</p>
                      <p className="font-mono text-zinc-300 text-xs">in the darkroom</p>
                    </div>
                  </div>
                  <p className="font-mono text-zinc-400 text-xs mt-3 border-t border-amber-100 pt-3">
                    your photos are being developed — we'll email you when they're ready to view
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Developed */}
        {developedRolls.length > 0 && (
          <div className="mb-8">
            <p className="font-mono text-xs text-zinc-400 uppercase tracking-widest mb-3">ready to view</p>
            <div className="space-y-2">
            {developedRolls.map(roll => (
            <div key={roll.id} 
            onClick={() => {
            console.log('clicking roll:', roll.id)
            navigate(`/roll/${roll.id}`)
              }}
    className="border border-zinc-100 hover:border-zinc-900 p-4 cursor-pointer transition-colors rounded-lg group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono font-bold text-zinc-900 text-sm">{roll.name}</p>
                      <p className="font-mono text-green-600 text-xs mt-0.5">✓ developed · tap to view photos</p>
                    </div>
                    <span className="font-mono text-zinc-900 text-xs group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <p className="font-mono text-zinc-300 text-xs text-center py-12">loading your rolls...</p>
        )}

        {/* Bottom explainer for new users */}
        {!loading && rolls.length > 0 && (
          <div className="border border-zinc-100 rounded-xl p-5 mt-4">
            <p className="font-mono text-xs text-zinc-400 uppercase tracking-widest mb-3">how it works</p>
            <div className="space-y-2">
              <p className="font-mono text-zinc-500 text-xs">🎞 <span className="text-zinc-900">shooting</span> — take photos, counter ticks down</p>
              <p className="font-mono text-zinc-500 text-xs">⏳ <span className="text-zinc-900">developing</span> — roll is full, photos processing for 24h</p>
              <p className="font-mono text-zinc-500 text-xs">✓ <span className="text-zinc-900">ready</span> — photos revealed, tap to view your roll</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}