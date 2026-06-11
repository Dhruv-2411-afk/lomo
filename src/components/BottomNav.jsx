import { useNavigate, useLocation } from 'react-router-dom'

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  const tabs = [
    {
      label: 'Home',
      path: '/rolls',
      icon: (active) => (
        <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      label: 'Shop',
      path: '/shop',
      icon: (active) => (
        <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
  ]

  // Don't show on camera or landing page
  if (location.pathname.includes('/camera') || location.pathname === '/') return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-lomo-bg border-t border-lomo-border z-40">
      <div className="max-w-lg mx-auto flex items-center justify-around px-6 py-3">
        {tabs.map(tab => {
          const active = location.pathname === tab.path
          return (
            <button key={tab.path} onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-lomo-gold' : 'text-lomo-muted hover:text-lomo-text'}`}>
              {tab.icon(active)}
              <span className="font-mono text-xs">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}