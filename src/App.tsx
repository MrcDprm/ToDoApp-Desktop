import { useState } from 'react'
import Login from './views/Login'
import Dashboard from './views/Dashboard'
import Profile from './views/Profile'
import { useAuth } from './hooks/useAuth'
import { useNotifications } from './hooks/useNotifications'
import { ToastContainer } from './components/ToastContainer'

type View = 'dashboard' | 'profile'

function AppContent() {
  const { user, loading } = useAuth()
  const [view, setView] = useState<View>('dashboard')
  useNotifications()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  if (view === 'profile') {
    return <Profile onBack={() => setView('dashboard')} />
  }

  return <Dashboard onNavigateToProfile={() => setView('profile')} />
}

export default function App() {
  return (
    <>
      <AppContent />
      <ToastContainer />
    </>
  )
}
