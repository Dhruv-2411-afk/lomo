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
        theme: { color: '#18181b' },
        modal: { ondismiss: () => setLoading(false) }
      }
      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      setError('Payment failed. Please try again.')
    }
    setLoading(false)
  }

  const plans = [
    { rolls: 1, amountPaise: 3900, label: '₹39', description: 'Try it out', detail: '1 roll · 24 shots · develops in 24h' },
    { rolls: 3, amountPaise: 9900, label: '₹99', description: 'Most popular', detail: '3 rolls · 72 shots total', popular: true },
    { rolls: 6, amountPaise: 17900, label: '₹179', description: 'For the obsessed', detail: '6 rolls · best value per shot' },
  ]

  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
        <span className="font-mono font-bold text-zinc-900 tracking-tight">lomo</span>
        <button onClick={() => navigate('/rolls')}
          className="font-mono text-xs text-zinc-400 hover:text-zinc-900 transition-colors">
          ← back to rolls
        </button>
      </nav>

      <div className="max-w-lg mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-mono font-bold text-zinc-900 text-2xl mb-2">get more rolls</h1>
          <p className="font-mono text-zinc-400 text-sm">
            you currently have <span className="text-zinc-900 font-bold">{profile?.rolls_remaining ?? 0}</span> rolls remaining
          </p>
        </div>

        {/* What is a roll */}
        <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-5 mb-8">
          <p className="font-mono text-xs text-zinc-400 uppercase tracking-widest mb-3">what is a roll?</p>
          <p className="font-mono text-zinc-600 text-xs leading-relaxed">
            each roll gives you <span className="text-zinc-900 font-bold">24 shots</span> on a virtual disposable camera. once full, your photos develop over <span className="text-zinc-900 font-bold">24 hours</span> — then you can view and download them. rolls never expire.
          </p>
        </div>

        {error && (
          <div className="border border-red-200 bg-red-50 text-red-600 font-mono text-xs p-3 mb-6 rounded">
            {error}
          </div>
        )}

        {/* Plans */}
        <div className="space-y-3">
          {plans.map((plan) => (
            <div key={plan.rolls}
              className={`border rounded-xl p-5 relative transition-all
                ${plan.popular ? 'border-zinc-900' : 'border-zinc-100 hover:border-zinc-300'}`}>
              {plan.popular && (
                <span className="absolute -top-3 left-5 bg-zinc-900 text-white font-mono text-xs px-3 py-0.5 rounded-full">
                  popular
                </span>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono font-bold text-zinc-900 text-sm">{plan.description}</p>
                  <p className="font-mono text-zinc-400 text-xs mt-1">{plan.detail}</p>
                </div>
                <button
                  onClick={() => handlePurchase(plan.rolls, plan.amountPaise, plan.label)}
                  disabled={loading}
                  className={`font-mono font-bold text-sm px-5 py-2 transition-colors rounded
                    ${plan.popular
                      ? 'bg-zinc-900 text-white hover:bg-zinc-700'
                      : 'border border-zinc-200 text-zinc-900 hover:border-zinc-900'
                    } disabled:opacity-40`}>
                  {plan.label}
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="font-mono text-zinc-300 text-xs text-center mt-8">
          secured by razorpay · rolls never expire · instant credit
        </p>
      </div>
    </div>
  )
}