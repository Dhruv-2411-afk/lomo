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
      <nav className="flex items-center justify-between px-8 py-6 border-b border-zinc-100">
        <span className="text-sm font-mono text-zinc-400 tracking-widest uppercase">lomo</span>
        <button
          onClick={handleGitHubLogin}
          className="text-sm font-mono text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          sign in →
        </button>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 text-center max-w-2xl mx-auto w-full">
        <p className="text-xs font-mono text-zinc-400 tracking-widest uppercase mb-8">
          disposable camera · web edition
        </p>

        <h1 className="text-6xl md:text-8xl font-serif font-light text-zinc-900 leading-none mb-8 tracking-tight">
          shoot now.<br />
          <span className="text-zinc-300">see later.</span>
        </h1>

        <p className="text-zinc-400 font-mono text-sm leading-relaxed max-w-sm mb-12">
          24 shots per roll. no previews. your photos develop after 24 hours — just like the real thing.
        </p>

        <button
          onClick={handleGitHubLogin}
          className="group flex items-center gap-3 border border-zinc-200 px-8 py-4 hover:border-zinc-900 hover:bg-zinc-900 hover:text-white transition-all duration-200 font-mono text-sm text-zinc-700"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          continue with github
        </button>
      </main>

      {/* Stats footer */}
      <footer className="border-t border-zinc-100 px-8 py-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="text-center">
            <p className="font-mono text-zinc-900 font-medium">24</p>
            <p className="font-mono text-zinc-400 text-xs mt-0.5">shots</p>
          </div>
          <div className="h-4 w-px bg-zinc-200" />
          <div className="text-center">
            <p className="font-mono text-zinc-900 font-medium">24h</p>
            <p className="font-mono text-zinc-400 text-xs mt-0.5">develop time</p>
          </div>
          <div className="h-4 w-px bg-zinc-200" />
          <div className="text-center">
            <p className="font-mono text-zinc-900 font-medium">shared</p>
            <p className="font-mono text-zinc-400 text-xs mt-0.5">rolls</p>
          </div>
          <div className="h-4 w-px bg-zinc-200" />
          <div className="text-center">
            <p className="font-mono text-zinc-900 font-medium">free</p>
            <p className="font-mono text-zinc-400 text-xs mt-0.5">to start</p>
          </div>
        </div>
      </footer>
    </div>
  )
}