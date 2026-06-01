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
    setRolls(data || [])
    setLoading(false)
  }

  const createRoll = async () => {
    if (profile?.rolls_remaining < 1) {
      navigate('/shop')
      return
    }
    setCreating(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('rolls')
      .insert({ owner_id: user.id, name: `Roll #${rolls.length + 1}` })
      .select()
      .single()

    await supabase
      .from('profiles')
      .update({ rolls_remaining: profile.rolls_remaining - 1 })
      .eq('id', user.id)

    setCreating(false)
    if (data) navigate(`/camera/${data.id}`)
  }

  const getStatusColor = (status) => {
    if (status === 'shooting') return 'text-green-400'
    if (status === 'developing') return 'text-lomo-amber'
    return 'text-lomo-muted'
  }

  const getStatusIcon = (status) => {
    if (status === 'shooting') return '🎞'
    if (status === 'developing') return '⏳'
    return '✅'
  }

  const getCountdown = (develops_at) => {
    if (!develops_at) return null
    const diff = new Date(develops_at) - new Date()
    if (diff <= 0) return 'Ready soon...'
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return `${h}h ${m}m left`
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-lomo-bg px-4 py-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold font-mono text-lomo-amber">lomo</h1>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/shop')} className="text-lomo-muted text-xs uppercase tracking-wider hover:text-lomo-amber transition-colors">
            {profile?.rolls_remaining ?? 0} rolls left
          </button>
          <button onClick={handleSignOut} className="text-lomo-muted text-xs uppercase tracking-wider hover:text-white transition-colors">
            sign out
          </button>
        </div>
      </div>

      {/* New Roll Button */}
      <button
        onClick={createRoll}
        disabled={creating}
        className="w-full border-2 border-dashed border-lomo-border hover:border-lomo-amber text-lomo-muted hover:text-lomo-amber font-mono text-sm py-6 mb-6 transition-colors uppercase tracking-wider"
      >
        {creating ? 'loading film...' : '+ new roll'}
      </button>

      {/* Rolls List */}
      {loading ? (
        <p className="text-lomo-muted text-center font-mono">loading your rolls...</p>
      ) : rolls.length === 0 ? (
        <div className="text-center mt-16">
          <p className="text-lomo-muted font-mono text-sm">no rolls yet.</p>
          <p className="text-lomo-muted font-mono text-xs mt-2">create your first roll above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rolls.map(roll => (
            <div
              key={roll.id}
              onClick={() => roll.status === 'shooting' ? navigate(`/camera/${roll.id}`) : navigate(`/roll/${roll.id}`)}
              className="bg-lomo-card border border-lomo-border p-4 cursor-pointer hover:border-lomo-amber transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono font-bold text-lomo-text">{roll.name}</p>
                  <p className={`font-mono text-xs mt-1 ${getStatusColor(roll.status)}`}>
                    {getStatusIcon(roll.status)} {roll.status}
                    {roll.status === 'developing' && ` · ${getCountdown(roll.develops_at)}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-lomo-amber font-bold">{roll.shots_used}/{roll.shot_limit}</p>
                  <p className="font-mono text-lomo-muted text-xs">shots</p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-3 h-1 bg-lomo-border">
                <div
                  className="h-1 bg-lomo-amber transition-all"
                  style={{ width: `${(roll.shots_used / roll.shot_limit) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}