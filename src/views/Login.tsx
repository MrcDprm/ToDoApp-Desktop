import { useState, type FormEvent } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../api/firebase'

type Mode = 'login' | 'register'

interface FormState {
  displayName: string
  email: string
  password: string
  confirmPassword: string
}

export default function Login() {
  const [mode, setMode] = useState<Mode>('login')
  const [form, setForm] = useState<FormState>({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
  }

  function switchMode() {
    setMode((m) => (m === 'login' ? 'register' : 'login'))
    setError(null)
    setForm({ displayName: '', email: '', password: '', confirmPassword: '' })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (mode === 'register') {
      if (!form.displayName.trim()) {
        setError('Lütfen adınızı girin.')
        return
      }
      if (form.password !== form.confirmPassword) {
        setError('Şifreler eşleşmiyor.')
        return
      }
      if (form.password.length < 6) {
        setError('Şifre en az 6 karakter olmalıdır.')
        return
      }
    }

    setLoading(true)

    try {
      if (mode === 'register') {
        const credential = await createUserWithEmailAndPassword(
          auth,
          form.email,
          form.password,
        )
        await updateProfile(credential.user, {
          displayName: form.displayName,
        })
        await setDoc(doc(db, 'users', credential.user.uid), {
          uid: credential.user.uid,
          email: form.email,
          displayName: form.displayName,
          aiUsageCount: 0,
          createdAt: serverTimestamp(),
        })
      } else {
        await signInWithEmailAndPassword(auth, form.email, form.password)
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      setError(mapFirebaseError(code))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-violet-900 via-slate-900 to-slate-950 border-r border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <CheckIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-white tracking-tight">ToDoApp</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Görevlerinizi{' '}
            <span className="text-violet-400">yapay zeka</span> ile yönetin
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Gemini destekli planlama, masaüstü bildirimler ve gerçek zamanlı
            senkronizasyon ile verimliliğinizi bir üst seviyeye taşıyın.
          </p>
          <div className="space-y-3">
            {[
              'AI ile otomatik görev planlaması',
              'Masaüstü bildirim desteği',
              'Gerçek zamanlı bulut senkronizasyonu',
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-3 text-slate-300">
                <div className="w-5 h-5 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center shrink-0">
                  <CheckIcon className="w-3 h-3 text-violet-400" />
                </div>
                <span className="text-sm">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-600 text-sm">© 2026 ToDoApp. Tüm hakları saklıdır.</p>
      </div>

      {/* Right auth panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl bg-violet-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <CheckIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-white tracking-tight">ToDoApp</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-1">
              {mode === 'login' ? 'Hoş geldiniz' : 'Hesap oluştur'}
            </h2>
            <p className="text-slate-400 text-sm">
              {mode === 'login'
                ? 'Devam etmek için giriş yapın'
                : 'Ücretsiz hesabınızı oluşturun'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <Field
                label="Ad Soyad"
                name="displayName"
                type="text"
                placeholder="Adınız Soyadınız"
                value={form.displayName}
                onChange={handleChange}
                autoFocus
              />
            )}

            <Field
              label="E-posta"
              name="email"
              type="email"
              placeholder="ornek@email.com"
              value={form.email}
              onChange={handleChange}
              autoFocus={mode === 'login'}
            />

            <Field
              label="Şifre"
              name="password"
              type="password"
              placeholder={mode === 'register' ? 'En az 6 karakter' : '••••••••'}
              value={form.password}
              onChange={handleChange}
            />

            {mode === 'register' && (
              <Field
                label="Şifre Tekrar"
                name="confirmPassword"
                type="password"
                placeholder="Şifreyi tekrar girin"
                value={form.confirmPassword}
                onChange={handleChange}
              />
            )}

            {error && (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                <AlertIcon className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/40 disabled:cursor-not-allowed text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-violet-500/20 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === 'login' ? 'Giriş yapılıyor...' : 'Hesap oluşturuluyor...'}
                </span>
              ) : mode === 'login' ? (
                'Giriş Yap'
              ) : (
                'Hesap Oluştur'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {mode === 'login' ? 'Henüz hesabınız yok mu?' : 'Zaten hesabınız var mı?'}{' '}
            <button
              onClick={switchMode}
              className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
              {mode === 'login' ? 'Kayıt Ol' : 'Giriş Yap'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

interface FieldProps {
  label: string
  name: string
  type: string
  placeholder: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  autoFocus?: boolean
}

function Field({ label, name, type, placeholder, value, onChange, autoFocus }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-300">{label}</label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoFocus={autoFocus}
        required
        className="w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200"
      />
    </div>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
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

function mapFirebaseError(code: string): string {
  const map: Record<string, string> = {
    'auth/email-already-in-use': 'Bu e-posta adresi zaten kullanılıyor.',
    'auth/invalid-email': 'Geçersiz e-posta adresi.',
    'auth/weak-password': 'Şifre çok zayıf. En az 6 karakter kullanın.',
    'auth/user-not-found': 'Bu e-posta adresine ait hesap bulunamadı.',
    'auth/wrong-password': 'Şifre hatalı.',
    'auth/invalid-credential': 'E-posta veya şifre hatalı.',
    'auth/too-many-requests': 'Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.',
    'auth/network-request-failed': 'Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edin.',
  }
  return map[code] ?? 'Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.'
}
