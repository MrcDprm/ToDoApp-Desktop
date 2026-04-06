import { useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../api/firebase'
import { useAuth } from '../hooks/useAuth'
import { useTodos } from '../hooks/useTodos'
import { TaskCard } from '../components/TaskCard'
import { TaskForm } from '../components/TaskForm'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import { AIPlanModal } from '../components/AIPlanModal'
import type { Todo, TodoFormData } from '../types'

type Filter = 'all' | 'active' | 'completed'

interface DashboardProps {
  onNavigateToProfile: () => void
}

export default function Dashboard({ onNavigateToProfile }: DashboardProps) {
  const { user } = useAuth()
  const { todos, loading, createTodo, editTodo, toggleTodo, deleteTodo, createManyTodos } = useTodos()

  const [addOpen, setAddOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Todo | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [darkMode, setDarkMode] = useState(true)

  function handleToggleDarkMode() {
    setDarkMode((d) => !d)
    document.documentElement.classList.toggle('dark')
  }

  async function handleCreate(data: TodoFormData) {
    await createTodo(data)
    setAddOpen(false)
  }

  async function handleEdit(data: TodoFormData) {
    if (!editTarget) return
    await editTodo(editTarget.id, data)
    setEditTarget(null)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteTodo(deleteTarget)
    setDeleteTarget(null)
  }

  const filtered = todos.filter((t) => {
    const matchesFilter =
      filter === 'all' || (filter === 'active' ? !t.isCompleted : t.isCompleted)
    const matchesSearch =
      !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const completedCount = todos.filter((t) => t.isCompleted).length
  const progress = todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-64 flex flex-col border-r transition-colors duration-300 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800/50">
          <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <CheckIcon className="w-4 h-4 text-white" />
          </div>
          <span className={`text-base font-semibold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>ToDoApp</span>
        </div>

        {/* User info */}
        <button
          onClick={onNavigateToProfile}
          className={`w-full px-5 py-4 border-b text-left transition-colors ${darkMode ? 'border-slate-800 hover:bg-slate-800/50' : 'border-slate-100 hover:bg-slate-50'}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shrink-0">
              <span className="text-sm font-medium text-violet-400">
                {user?.displayName?.[0]?.toUpperCase() ?? 'U'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium truncate ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{user?.displayName}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            <ChevronRightIcon className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          </div>
        </button>

        {/* Progress */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">Tamamlanan</span>
            <span className="text-xs font-medium text-violet-400">{progress}%</span>
          </div>
          <div className={`h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {completedCount} / {todos.length} görev
          </p>
        </div>

        {/* Filter nav */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {([
            { key: 'all', label: 'Tüm Görevler', count: todos.length },
            { key: 'active', label: 'Aktif', count: todos.filter((t) => !t.isCompleted).length },
            { key: 'completed', label: 'Tamamlanan', count: completedCount },
          ] as { key: Filter; label: string; count: number }[]).map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all ${
                filter === item.key
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                  : darkMode
                    ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {item.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-md ${filter === item.key ? 'bg-violet-500/30 text-violet-300' : darkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-500'}`}>
                {item.count}
              </span>
            </button>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className={`px-3 py-4 border-t space-y-1 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <button
            onClick={handleToggleDarkMode}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${darkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            {darkMode ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
            {darkMode ? 'Aydınlık Mod' : 'Karanlık Mod'}
          </button>
          <button
            onClick={() => signOut(auth)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all text-red-400 ${darkMode ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}
          >
            <LogoutIcon className="w-4 h-4" />
            Çıkış Yap
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className={`sticky top-0 z-10 flex items-center justify-between px-8 py-4 border-b backdrop-blur-md transition-colors duration-300 ${darkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100/80 border-slate-200'}`}>
          <div>
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {filter === 'all' ? 'Tüm Görevler' : filter === 'active' ? 'Aktif Görevler' : 'Tamamlanan Görevler'}
            </h1>
            <p className="text-sm text-slate-500">
              {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              icon={<SparklesIcon className="w-4 h-4" />}
              onClick={() => setAiOpen(true)}
            >
              AI ile Planla
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={<PlusIcon className="w-4 h-4" />}
              onClick={() => setAddOpen(true)}
            >
              Yeni Görev
            </Button>
          </div>
        </header>

        {/* Search */}
        <div className="px-8 py-4">
          <div className="relative">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Görev ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 ${
                darkMode
                  ? 'bg-slate-800/60 border-slate-700 text-white placeholder-slate-500'
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>
        </div>

        {/* Task list */}
        <main className="flex-1 px-8 pb-8">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
                <InboxIcon className="w-8 h-8 text-slate-500" />
              </div>
              <p className={`text-base font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                {searchQuery ? 'Sonuç bulunamadı' : 'Henüz görev yok'}
              </p>
              <p className="text-sm text-slate-500">
                {searchQuery
                  ? 'Farklı bir arama terimi deneyin'
                  : 'Yeni görev eklemek için "Yeni Görev" butonuna tıklayın'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filtered.map((todo) => (
                <TaskCard
                  key={todo.id}
                  todo={todo}
                  onToggle={toggleTodo}
                  onEdit={setEditTarget}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Add Task Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Yeni Görev Ekle">
        <TaskForm onSubmit={handleCreate} onCancel={() => setAddOpen(false)} submitLabel="Ekle" />
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Görevi Düzenle"
      >
        {editTarget && (
          <TaskForm
            initial={editTarget}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
            submitLabel="Kaydet"
          />
        )}
      </Modal>

      {/* AI Plan Modal */}
      <AIPlanModal
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        onAddSteps={createManyTodos}
      />

      {/* Delete Confirm Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Görevi Sil"
        maxWidth="max-w-sm"
      >
        <p className="text-sm text-slate-400 mb-6">
          Bu görevi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>İptal</Button>
          <Button variant="danger" onClick={handleDelete}>Sil</Button>
        </div>
      </Modal>
    </div>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
}
function SparklesIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.88 5.76L20 9l-4.94 3.8L16.72 19 12 15.77 7.28 19l1.66-6.2L4 9l6.12-.24L12 3z" /></svg>
}
function CheckIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
}
function PlusIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
}
function SearchIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
}
function InboxIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>
}
function SunIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
}
function MoonIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
}
function LogoutIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
}
