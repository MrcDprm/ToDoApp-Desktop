import { useState, useEffect, type FormEvent } from 'react'
import { Button } from './Button'
import type { Todo, TodoFormData } from '../types'

interface TaskFormProps {
  initial?: Todo
  onSubmit: (data: TodoFormData) => Promise<void>
  onCancel: () => void
  submitLabel?: string
  extraActions?: React.ReactNode
}

export function TaskForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = 'Kaydet',
  extraActions,
}: TaskFormProps) {
  const [form, setForm] = useState<TodoFormData>({
    title: '',
    description: '',
    dueDate: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initial) {
      const due = initial.dueDate?.toDate?.()
      setForm({
        title: initial.title,
        description: initial.description,
        dueDate: due ? toLocalDateTimeString(due) : '',
      })
    }
  }, [initial])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('Görev başlığı boş olamaz.')
      return
    }
    setLoading(true)
    try {
      await onSubmit(form)
    } catch {
      setError('İşlem başarısız oldu. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-300">Başlık</label>
        <input
          name="title"
          type="text"
          placeholder="Görev başlığı..."
          value={form.title}
          onChange={handleChange}
          autoFocus
          className="w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-300">
          Açıklama <span className="text-slate-500 font-normal">(isteğe bağlı)</span>
        </label>
        <textarea
          name="description"
          rows={3}
          placeholder="Görev detayları..."
          value={form.description}
          onChange={handleChange}
          className="w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-300">
          Bitiş Tarihi <span className="text-slate-500 font-normal">(isteğe bağlı)</span>
        </label>
        <input
          name="dueDate"
          type="datetime-local"
          value={form.dueDate}
          onChange={handleChange}
          className="w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all [color-scheme:dark]"
        />
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-1">
        {extraActions}
        <div className="flex items-center gap-3 ml-auto">
          <Button variant="ghost" size="md" type="button" onClick={onCancel}>
            İptal
          </Button>
          <Button variant="primary" size="md" loading={loading} type="submit">
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  )
}

function toLocalDateTimeString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
