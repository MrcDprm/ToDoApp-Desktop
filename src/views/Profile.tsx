import { useState, type FormEvent } from 'react'
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut,
} from 'firebase/auth'
import { auth } from '../api/firebase'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/Button'

const AI_QUOTA_MAX = 10

interface ProfileProps {
  onBack: () => void
}

export default function Profile({ onBack }: ProfileProps) {
  const user = useAuthStore((s) => s.user)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)

  const usageCount = user?.aiUsageCount ?? 0
  const remaining = AI_QUOTA_MAX - usageCount
  const usagePercent = Math.round((usageCount / AI_QUOTA_MAX) * 100)

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault()
    setPwError(null)
    setPwSuccess(false)

    if (newPassword !== confirmPassword) {
      setPwError('Yeni şifreler eşleşmiyor.')
      return
    }
    if (newPassword.length < 6) {
      setPwError('Yeni şifre en az 6 karakter olmalıdır.')
      return
    }
    if (!auth.currentUser?.email) {
      setPwError('Kullanıcı oturumu bulunamadı.')
      return
    }

    setPwLoading(true)
    try {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword,
      )
      await reauthenticateWithCredential(auth.currentUser, credential)
      await updatePassword(auth.currentUser, newPassword)

      setPwSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      setPwError(mapPasswordError(code))
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-4 px-8 py-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-sm"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Geri
        </button>
        <div className="w-px h-4 bg-slate-700" />
        <h1 className="text-base font-semibold text-white">Profil ve Ayarlar</h1>
      </header>

      <div className="max-w-2xl mx-auto px-8 py-8 space-y-6">
        {/* User info card */}
        <div className="rounded-2xl bg-slate-900 border border-slate-700/60 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shrink-0">
              <span className="text-2xl font-bold text-violet-400">
                {user?.displayName?.[0]?.toUpperCase() ?? 'U'}
              </span>
            </div>
            <div>
              <p className="text-lg font-semibold text-white">{user?.displayName}</p>
              <p className="text-sm text-slate-400">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-4">
              <p className="text-xs text-slate-500 mb-1">Hesap Türü</p>
              <p className="text-sm font-medium text-slate-200">Ücretsiz Plan</p>
            </div>
            <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-4">
              <p className="text-xs text-slate-500 mb-1">Üye Tarihi</p>
              <p className="text-sm font-medium text-slate-200">
                {user?.createdAt?.toDate
                  ? user.createdAt.toDate().toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* AI Quota card */}
        <div className="rounded-2xl bg-slate-900 border border-slate-700/60 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">AI Kullanım Kotası</h2>
              <p className="text-xs text-slate-500">Gemini 1.5 Flash eylem planı oluşturucu</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-3xl font-bold text-white">{usageCount}</span>
                <span className="text-slate-500 text-sm ml-1">/ {AI_QUOTA_MAX} kullanım</span>
              </div>
              <span
                className={`text-sm font-medium px-2.5 py-1 rounded-lg ${
                  remaining === 0
                    ? 'bg-red-500/20 text-red-400'
                    : remaining <= 3
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {remaining} kalan
              </span>
            </div>

            <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  remaining === 0
                    ? 'bg-red-500'
                    : remaining <= 3
                      ? 'bg-amber-500'
                      : 'bg-violet-500'
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>

            {remaining === 0 && (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                <LockIcon className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  AI kotanız doldu. Görev ekleme ve düzenlemeye devam edebilirsiniz.
                </span>
              </div>
            )}
            {remaining > 0 && remaining <= 3 && (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
                <AlertIcon className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Yalnızca {remaining} AI kullanım hakkınız kaldı.</span>
              </div>
            )}
          </div>
        </div>

        {/* Password change card */}
        <div className="rounded-2xl bg-slate-900 border border-slate-700/60 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
              <ShieldIcon className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Şifre Değiştir</h2>
              <p className="text-xs text-slate-500">Hesap güvenliğinizi güncel tutun</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <PasswordField
              label="Mevcut Şifre"
              value={currentPassword}
              onChange={setCurrentPassword}
              placeholder="Mevcut şifreniz"
            />
            <PasswordField
              label="Yeni Şifre"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="En az 6 karakter"
            />
            <PasswordField
              label="Yeni Şifre Tekrar"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Yeni şifreyi tekrar girin"
            />

            {pwError && (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                <AlertIcon className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{pwError}</span>
              </div>
            )}

            {pwSuccess && (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
                <CheckIcon className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Şifreniz başarıyla güncellendi.</span>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <Button variant="primary" type="submit" loading={pwLoading}>
                Şifreyi Güncelle
              </Button>
            </div>
          </form>
        </div>

        {/* Danger zone */}
        <div className="rounded-2xl bg-slate-900 border border-red-500/20 p-6">
          <h2 className="text-sm font-semibold text-red-400 mb-4">Tehlikeli Bölge</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-300">Oturumu Kapat</p>
              <p className="text-xs text-slate-500 mt-0.5">Tüm cihazlardaki oturumunuzu sonlandırır</p>
            </div>
            <Button variant="danger" onClick={() => signOut(auth)}>
              Çıkış Yap
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface PasswordFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}

function PasswordField({ label, value, onChange, placeholder }: PasswordFieldProps) {
  const [show, setShow] = useState(false)
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-300">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
        >
          {show ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

function mapPasswordError(code: string): string {
  const map: Record<string, string> = {
    'auth/wrong-password': 'Mevcut şifre hatalı.',
    'auth/invalid-credential': 'Mevcut şifre hatalı.',
    'auth/weak-password': 'Yeni şifre çok zayıf.',
    'auth/too-many-requests': 'Çok fazla deneme. Lütfen bekleyin.',
    'auth/requires-recent-login': 'Lütfen tekrar giriş yapın.',
  }
  return map[code] ?? 'Bir hata oluştu. Lütfen tekrar deneyin.'
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
}
function SparklesIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.88 5.76L20 9l-4.94 3.8L16.72 19 12 15.77 7.28 19l1.66-6.2L4 9l6.12-.24L12 3z" /></svg>
}
function ShieldIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
}
function LockIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
}
function AlertIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
}
function CheckIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
}
function EyeIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
}
function EyeOffIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
}
