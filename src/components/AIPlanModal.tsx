import { useState, type FormEvent } from 'react'
import { doc, updateDoc, increment } from 'firebase/firestore'
import { db } from '../api/firebase'
import { generateTaskPlan } from '../api/openai'
import { useAuthStore } from '../store/authStore'
import { Button } from './Button'
import { Modal } from './Modal'

const AI_QUOTA_MAX = 10

interface AIPlanModalProps {
  open: boolean
  onClose: () => void
  onAddSteps: (steps: string[]) => Promise<void>
}

export function AIPlanModal({ open, onClose, onAddSteps }: AIPlanModalProps) {
  const user = useAuthStore((s) => s.user)

  const [goal, setGoal] = useState('')
  const [steps, setSteps] = useState<string[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [phase, setPhase] = useState<'input' | 'result'>('input')
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const usageCount = user?.aiUsageCount ?? 0
  const remaining = AI_QUOTA_MAX - usageCount
  const isQuotaExhausted = remaining <= 0

  function handleClose() {
    setGoal('')
    setSteps([])
    setSelected(new Set())
    setPhase('input')
    setError(null)
    onClose()
  }

  function toggleStep(idx: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(steps.map((_, i) => i)))
  }

  async function handleGenerate(e: FormEvent) {
    e.preventDefault()
    if (!goal.trim() || isQuotaExhausted || !user) return

    setLoading(true)
    setError(null)

    try {
      const plan = await generateTaskPlan(goal.trim())

      await updateDoc(doc(db, 'users', user.uid), {
        aiUsageCount: increment(1),
      })

      setSteps(plan.steps)
      setSelected(new Set(plan.steps.map((_, i) => i)))
      setPhase('result')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Beklenmedik bir hata oluştu.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddSelected() {
    if (selected.size === 0) return
    setAdding(true)
    try {
      const chosen = steps.filter((_, i) => selected.has(i))
      await onAddSteps(chosen)
      handleClose()
    } catch {
      setError('Görevler eklenirken hata oluştu.')
    } finally {
      setAdding(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="AI ile Planla" maxWidth="max-w-xl">
      {/* Quota badge */}
      <div className="flex items-center justify-between mb-5 px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
            <SparklesIcon className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-300">GPT-3.5 Turbo</p>
            <p className="text-xs text-slate-500">Eylem planı oluşturucu</p>
          </div>
        </div>
        <div className="text-right">
          <p
            className={`text-sm font-semibold ${
              isQuotaExhausted ? 'text-red-400' : remaining <= 3 ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {remaining} / {AI_QUOTA_MAX}
          </p>
          <p className="text-xs text-slate-500">kalan hak</p>
        </div>
      </div>

      {isQuotaExhausted ? (
        <div className="text-center py-8 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <LockIcon className="w-7 h-7 text-red-400" />
          </div>
          <p className="text-slate-200 font-medium">AI kotanız doldu</p>
          <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
            {AI_QUOTA_MAX} adet AI planlaması hakkınızı kullandınız. Profil sayfanızdan kota
            bilgilerinizi görüntüleyebilirsiniz.
          </p>
          <Button variant="ghost" onClick={handleClose} className="mt-2">
            Kapat
          </Button>
        </div>
      ) : phase === 'input' ? (
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">
              Hedefinizi girin
            </label>
            <textarea
              rows={3}
              placeholder="Örn: React ile bir e-ticaret uygulaması geliştirmek istiyorum"
              value={goal}
              onChange={(e) => {
                setGoal(e.target.value)
                setError(null)
              }}
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all resize-none"
            />
            <p className="text-xs text-slate-500">
              AI, bu hedefe ulaşmak için 5 adımlık bir eylem planı oluşturacak.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              <AlertIcon className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {remaining <= 3 && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
              <AlertIcon className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Yalnızca {remaining} kullanım hakkınız kaldı.</span>
            </div>
          )}

          <div className="flex items-center gap-3 justify-end pt-1">
            <Button variant="ghost" type="button" onClick={handleClose}>
              İptal
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={loading}
              disabled={!goal.trim()}
              icon={<SparklesIcon className="w-4 h-4" />}
            >
              {loading ? 'Plan oluşturuluyor...' : 'Plan Oluştur'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-400 mb-1">
              <span className="text-slate-300 font-medium">Hedef:</span> {goal}
            </p>
            <p className="text-xs text-slate-500">
              Eklemek istediğiniz adımları seçin:
            </p>
          </div>

          <div className="space-y-2">
            {steps.map((step, i) => (
              <button
                key={i}
                onClick={() => toggleStep(i)}
                className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                  selected.has(i)
                    ? 'bg-violet-600/15 border-violet-500/40 text-slate-200'
                    : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                    selected.has(i)
                      ? 'bg-violet-500 border-violet-500'
                      : 'border-slate-600'
                  }`}
                >
                  {selected.has(i) && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-slate-500 mr-2">
                    Adım {i + 1}
                  </span>
                  <span className="text-sm">{step}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-slate-700/60">
            <button
              onClick={selectAll}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              Tümünü Seç
            </button>
            <span className="text-slate-700">·</span>
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
            >
              Seçimi Temizle
            </button>
            <div className="flex items-center gap-3 ml-auto">
              <button
                onClick={() => {
                  setPhase('input')
                  setSteps([])
                  setSelected(new Set())
                }}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Yeniden Oluştur
              </button>
              <Button
                variant="primary"
                size="md"
                loading={adding}
                disabled={selected.size === 0}
                onClick={handleAddSelected}
                icon={<PlusIcon className="w-4 h-4" />}
              >
                {selected.size} Görevi Ekle
              </Button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}
        </div>
      )}
    </Modal>
  )
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.88 5.76L20 9l-4.94 3.8L16.72 19 12 15.77 7.28 19l1.66-6.2L4 9l6.12-.24L12 3z" />
    </svg>
  )
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
