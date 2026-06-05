import { supabase } from '../lib/supabase'

export default function Landing() {
  const handleGitHubLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/rolls` }
    })
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
        <span className="font-mono font-bold text-zinc-900 tracking-tight">lomo</span>
        <button onClick={handleGitHubLogin}
          className="font-mono text-xs text-zinc-500 hover:text-zinc-900 transition-colors">
          sign in →
        </button>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <span className="inline-block bg-zinc-100 text-zinc-500 font-mono text-xs px-3 py-1 rounded-full mb-8 tracking-widest uppercase">
          disposable camera · web edition
        </span>

        <h1 className="text-5xl md:text-7xl font-serif font-light text-zinc-900 leading-tight mb-6 tracking-tight">
          shoot now.<br />
          <span className="text-zinc-300">see later.</span>
        </h1>

        <p className="text-zinc-500 text-sm leading-relaxed max-w-md mb-12 font-mono">
          lomo gives you a virtual disposable camera. take up to 24 photos, 
          then wait 24 hours to see them — just like the real thing.
        </p>

        <button onClick={handleGitHubLogin}
          className="group flex items-center gap-3 bg-zinc-900 text-white px-8 py-4 hover:bg-zinc-700 transition-colors font-mono text-sm mb-16">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          get started free
        </button>

        {/* How it works */}
        <div className="w-full max-w-2xl border border-zinc-100 rounded-xl p-8">
          <p className="font-mono text-xs text-zinc-400 uppercase tracking-widest mb-8">how it works</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div>
              <div className="w-8 h-8 bg-zinc-900 text-white font-mono text-xs flex items-center justify-center mb-4 rounded">
                01
              </div>
              <h3 className="font-mono font-bold text-zinc-900 text-sm mb-2">load a roll</h3>
              <p className="font-mono text-zinc-400 text-xs leading-relaxed">
                create a new roll of film. you get 24 shots — use them wisely, you can't delete or preview them.
              </p>
            </div>
            <div>
              <div className="w-8 h-8 bg-zinc-900 text-white font-mono text-xs flex items-center justify-center mb-4 rounded">
                02
              </div>
              <h3 className="font-mono font-bold text-zinc-900 text-sm mb-2">shoot freely</h3>
              <p className="font-mono text-zinc-400 text-xs leading-relaxed">
                point and shoot. no filters, no previews. once the roll is full, it gets sent for developing.
              </p>
            </div>
            <div>
              <div className="w-8 h-8 bg-zinc-900 text-white font-mono text-xs flex items-center justify-center mb-4 rounded">
                03
              </div>
              <h3 className="font-mono font-bold text-zinc-900 text-sm mb-2">wait 24 hours</h3>
              <p className="font-mono text-zinc-400 text-xs leading-relaxed">
                your photos develop overnight. we email you when they're ready — then you finally get to see them.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features strip */}
      <section className="border-t border-zinc-100 px-6 py-8">
        <div className="max-w-2xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '24', label: 'shots per roll' },
            { value: '24h', label: 'develop time' },
            { value: 'free', label: 'to get started' },
            { value: 'shared', label: 'rolls with friends' },
          ].map(f => (
            <div key={f.label}>
              <p className="font-mono font-bold text-zinc-900">{f.value}</p>
              <p className="font-mono text-zinc-400 text-xs mt-1">{f.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 px-6 py-4 text-center">
        <p className="font-mono text-zinc-300 text-xs">lomo · disposable camera for the web</p>
      </footer>
    </div>
  )
}