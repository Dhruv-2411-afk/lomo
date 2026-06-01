import { supabase } from '../lib/supabase'

export default function Landing() {
  const handleGitHubLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/rolls`
      }
    })
  }

  return (
    <div className="min-h-screen bg-lomo-bg flex flex-col items-center justify-center px-4">
      {/* Film grain overlay */}
      <div className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Logo */}
      <div className="mb-12 text-center">
        <h1 className="text-7xl font-bold font-mono text-lomo-amber tracking-tighter">lomo</h1>
        <p className="text-lomo-muted mt-3 text-sm tracking-widest uppercase">disposable camera for the web</p>
      </div>

      {/* Tagline */}
      <div className="mb-12 text-center max-w-sm">
        <p className="text-lomo-text text-lg leading-relaxed">
          24 shots. No previews.<br />
          <span className="text-lomo-amber">See them in 24 hours.</span>
        </p>
      </div>

      {/* Film strip decoration */}
      <div className="flex gap-2 mb-12">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="w-8 h-12 bg-lomo-card border border-lomo-border rounded-sm flex items-center justify-center">
            <div className="w-5 h-7 bg-lomo-border rounded-sm opacity-50" />
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={handleGitHubLogin}
        className="flex items-center gap-3 bg-lomo-amber text-black font-mono font-bold px-8 py-4 rounded-none hover:bg-yellow-400 transition-colors text-sm tracking-wider uppercase"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
        </svg>
        Continue with GitHub
      </button>

      {/* Features */}
      <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg text-center">
        <div>
          <p className="text-lomo-amber font-mono font-bold text-2xl">24</p>
          <p className="text-lomo-muted text-xs mt-1 uppercase tracking-wider">shots per roll</p>
        </div>
        <div>
          <p className="text-lomo-amber font-mono font-bold text-2xl">24h</p>
          <p className="text-lomo-muted text-xs mt-1 uppercase tracking-wider">develop time</p>
        </div>
        <div>
          <p className="text-lomo-amber font-mono font-bold text-2xl">∞</p>
          <p className="text-lomo-muted text-xs mt-1 uppercase tracking-wider">shared rolls</p>
        </div>
      </div>
    </div>
  )
}