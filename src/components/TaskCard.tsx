import type { Todo } from '../types'

interface TaskCardProps {
  todo: Todo
  onToggle: (id: string, completed: boolean) => void
  onEdit: (todo: Todo) => void
  onDelete: (id: string) => void
}

export function TaskCard({ todo, onToggle, onEdit, onDelete }: TaskCardProps) {
  const dueDate = todo.dueDate?.toDate?.()
  const isOverdue = dueDate && !todo.isCompleted && dueDate < new Date()
  const isDueSoon =
    dueDate &&
    !todo.isCompleted &&
    !isOverdue &&
    dueDate.getTime() - Date.now() <= 30 * 60 * 1000

  return (
    <div
      className={`group flex items-start gap-4 p-4 rounded-2xl border transition-all duration-200 ${
        todo.isCompleted
          ? 'bg-slate-800/30 border-slate-700/40 opacity-60'
          : isOverdue
            ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
            : 'bg-slate-800/50 border-slate-700/60 hover:border-slate-600'
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(todo.id, !todo.isCompleted)}
        className="mt-0.5 shrink-0 cursor-pointer"
        aria-label={todo.isCompleted ? 'Tamamlanmadı olarak işaretle' : 'Tamamlandı olarak işaretle'}
      >
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
            todo.isCompleted
              ? 'bg-violet-500 border-violet-500'
              : 'border-slate-500 hover:border-violet-400'
          }`}
        >
          {todo.isCompleted && (
            <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium leading-snug ${
            todo.isCompleted ? 'line-through text-slate-500' : 'text-slate-100'
          }`}
        >
          {todo.title}
        </p>
        {todo.description && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {todo.description}
          </p>
        )}
        {dueDate && (
          <div className="flex items-center gap-1.5 mt-2">
            <ClockIcon
              className={`w-3 h-3 ${
                isOverdue ? 'text-red-400' : isDueSoon ? 'text-amber-400' : 'text-slate-500'
              }`}
            />
            <span
              className={`text-xs ${
                isOverdue ? 'text-red-400' : isDueSoon ? 'text-amber-400' : 'text-slate-500'
              }`}
            >
              {isOverdue ? 'Süresi geçti · ' : isDueSoon ? 'Yaklaşıyor · ' : ''}
              {formatDate(dueDate)}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => onEdit(todo)}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-700/60 transition-all"
          aria-label="Düzenle"
        >
          <EditIcon className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(todo.id)}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
          aria-label="Sil"
        >
          <TrashIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}
