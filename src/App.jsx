import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Landing from './pages/Landing'
import Camera from './pages/Camera'
import Rolls from './pages/Rolls'
import Roll from './pages/Roll'
import Shop from './pages/Shop'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-lomo-bg flex items-center justify-center">
      <p className="text-lomo-amber font-mono">developing...</p>
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={!session ? <Landing /> : <Navigate to="/rolls" />} />
        <Route path="/camera/:rollId" element={session ? <Camera /> : <Navigate to="/" />} />
        <Route path="/rolls" element={session ? <Rolls /> : <Navigate to="/" />} />
        <Route path="/roll/:rollId" element={session ? <Roll /> : <Navigate to="/" />} />
        <Route path="/shop" element={session ? <Shop /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App