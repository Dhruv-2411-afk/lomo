import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'

export default function Shop() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchProfile()
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    document.body.appendChild(script)
  }, [])

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(data)
  }

  const handlePurchase = async (rolls, amountPaise, label) => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error: fnError } = await supabase.functions.invoke('create-razorpay-order', {
        body: { rolls, amountPaise, userId: user.id }
      })
      if (fnError) throw fnError
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amountPaise,
        currency: 'INR',
        name: 'Lomo',
        description: `${rolls} roll${rolls > 1 ? 's' : ''}`,
        order_id: data.orderId,
        handler: async (response) => {
          const { error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
            body: { ...response, userId: user.id, rolls }
          })
          if (verifyError) throw verifyError
          await fetchProfile()
          navigate('/rolls')
        },
        prefill: { email: user.email },
        theme: { color: '#E09B2D' },
        modal: { ondismiss: () => setLoading(false) }
      }
      new window.Razorpay(options).open()
    } catch (err) {
      setError('Payment failed. Please try again.')
    }
    setLoading(false)
  }

  const plans = [
    { rolls: 1, amountPaise: 3900, label: '₹39', title: 'Try It Out', detail: '1 roll · 24 memories · develops in 24h' },
    { rolls: 3, amountPaise: 9900, label: '₹99', title: 'Most Popular', detail: '3 rolls · 72 memories total', popular: true },
    { rolls: 6, amountPaise: 17900, label: '₹179', title: 'For The Obsessed', detail: '6 rolls · best value per memory' },
  ]

  return (
    <div className="min-h-screen bg-lomo-bg">
      <nav className="flex items-center justify-between px-6 py-5 border-b border-lomo-border">
        <span className="font-mono font-bold text-lomo-text tracking-tight">lomo</span>
        <button onClick={() => navigate('/rolls')}
          className="font-mono text-xs text-lomo-muted hover:text-lomo-text transition-colors">← back</button>
      </nav>

      <div className="max-w-lg mx-auto px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="font-serif text-3xl text-lomo-text mb-2">Load more film.</h1>
          <p className="font-mono text-xs text-lomo-muted">
            you have <span className="text-lomo-gold font-bold">{profile?.rolls_remaining ?? 0}</span> rolls remaining
          </p>
        </motion.div>

        <div className="bg-lomo-secondary rounded-xl p-5 mb-8 border border-lomo-border">
          <p className="font-mono text-xs text-lomo-muted uppercase tracking-widest mb-3">what is a roll?</p>
          <p className="font-mono text-lomo-muted text-xs leading-relaxed">
            each roll gives you <span className="text-lomo-text font-bold">24 shots</span> on a virtual disposable camera.
            photos develop after <span className="text-lomo-text font-bold">24 hours</span> — then you can relive every memory. rolls never expire.
          </p>
        </div>

        {error && (
          <div className="border border-red-200 bg-red-50 text-red-600 font-mono text-xs p-3 mb-6 rounded-xl">{error}</div>
        )}

        <div className="space-y-3">
          {plans.map((plan, i) => (
            <motion.div key={plan.rolls}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`border rounded-xl p-5 relative transition-all
                ${plan.popular ? 'border-lomo-gold bg-lomo-secondary' : 'border-lomo-border hover:border-lomo-gold'}`}>
              {plan.popular && (
                <span className="absolute -top-3 left-5 bg-lomo-gold text-black font-mono text-xs px-3 py-0.5 rounded-full">
                  popular
                </span>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono font-bold text-lomo-text text-sm">{plan.title}</p>
                  <p className="font-mono text-lomo-muted text-xs mt-1">{plan.detail}</p>
                </div>
                <button onClick={() => handlePurchase(plan.rolls, plan.amountPaise, plan.label)}
                  disabled={loading}
                  className={`font-mono font-bold text-sm px-5 py-2 rounded-xl transition-colors
                    ${plan.popular ? 'bg-lomo-gold text-black hover:bg-lomo-brown' : 'border border-lomo-border text-lomo-text hover:border-lomo-gold'}
                    disabled:opacity-40`}>
                  {plan.label}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="font-mono text-lomo-muted text-xs text-center mt-8">
          secured by razorpay · rolls never expire · instant credit
        </p>
      </div>
    </div>
  )
}