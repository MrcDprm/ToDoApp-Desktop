import Login from './views/Login'
import Dashboard from './views/Dashboard'
import { useAuth } from './hooks/useAuth'

export default function App() {
  const { user, loading } = useAuth()

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
