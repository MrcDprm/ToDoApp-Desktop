import Login from './views/Login'
import Dashboard from './views/Dashboard'
import { useAuth } from './hooks/useAuth'
import { useNotifications } from './hooks/useNotifications'

function AppContent() {
  const { user, loading } = useAuth()
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

  return <Dashboard />
}

export default function App() {
  return <AppContent />
}
