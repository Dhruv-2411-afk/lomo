import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Shop() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchProfile()
    loadRazorpay()
  }, [])

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(data)
  }

  const loadRazorpay = () => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    document.body.appendChild(script)
  }

  const handlePurchase = async (rolls, amountPaise, label) => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Create order via Supabase Edge Function
      const { data, error: fnError } = await supabase.functions.invoke('create-razorpay-order', {
        body: { rolls, amountPaise, userId: user.id }
      })

      if (fnError) throw fnError

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amountPaise,
        currency: 'INR',
        name: 'Lomo',
        description: `${rolls} roll${rolls > 1 ? 's' : ''} — ${label}`,
        order_id: data.orderId,
        handler: async (response) => {
          // Verify payment via Edge Function
          const { error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
            body: {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: user.id,
              rolls
            }
          })
          if (verifyError) throw verifyError
          await fetchProfile()
          navigate('/rolls')
        },
        prefill: { email: user.email },
        theme: { color: '#f59e0b' },
        modal: { ondismiss: () => setLoading(false) }
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      setError('Payment failed. Please try again.')
      console.error(err)
    }
    setLoading(false)
  }

  const plans = [
    { rolls: 1, amountPaise: 3900, label: '₹39', description: 'One roll · 24 shots' },
    { rolls: 3, amountPaise: 9900, label: '₹99', description: 'Three rolls · best value', popular: true },
    { rolls: 6, amountPaise: 17900, label: '₹179', description: 'Six rolls · for the obsessed' },
  ]

  return (
    <div className="min-h-screen bg-lomo-bg px-4 py-8 max-w-lg mx-auto">
      {/* Header */}
      <button onClick={() => navigate('/rolls')}
        className="text-lomo-muted font-mono text-sm hover:text-white mb-8 block">
        ← back
      </button>

      <h1 className="font-mono font-bold text-lomo-amber text-3xl mb-2">get more rolls</h1>
      <p className="font-mono text-lomo-muted text-sm mb-2">
        you have <span className="text-lomo-amber font-bold">{profile?.rolls_remaining ?? 0}</span> rolls remaining
      </p>
      <p className="font-mono text-lomo-muted text-xs mb-10">
        each roll = 24 shots · develops in 24 hours
      </p>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-300 font-mono text-xs p-3 mb-6">
          {error}
        </div>
      )}

      {/* Plans */}
      <div className="space-y-4">
        {plans.map((plan) => (
          <div key={plan.rolls}
            className={`border p-6 relative transition-colors
              ${plan.popular ? 'border-lomo-amber' : 'border-lomo-border hover:border-lomo-amber'}`}>
            {plan.popular && (
              <span className="absolute -top-3 left-4 bg-lomo-amber text-black font-mono text-xs px-2 py-0.5 font-bold uppercase">
                popular
              </span>
            )}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono font-bold text-lomo-text text-lg">{plan.rolls} roll{plan.rolls > 1 ? 's' : ''}</p>
                <p className="font-mono text-lomo-muted text-xs mt-1">{plan.description}</p>
              </div>
              <button
                onClick={() => handlePurchase(plan.rolls, plan.amountPaise, plan.label)}
                disabled={loading}
                className="bg-lomo-amber text-black font-mono font-bold px-5 py-2 text-sm hover:bg-yellow-400 transition-colors disabled:opacity-50 uppercase tracking-wider"
              >
                {plan.label}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <p className="font-mono text-lomo-muted text-xs text-center mt-10">
        payments secured by razorpay · rolls never expire
      </p>
    </div>
  )
}