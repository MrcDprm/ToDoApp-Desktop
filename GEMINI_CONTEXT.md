# ToDoApp — Proje Bağlamı (Gemini için)

Sen bu projenin kıdemli geliştiricisisin. Aşağıda projenin tüm detayları var. Her soruyu bu bağlama göre yanıtla.

---

## Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Masaüstü | Electron.js v41 (CommonJS olarak derlenir) |
| Frontend | React 19 + TypeScript 6 + Vite 8 |
| Stil | Tailwind CSS v4 (@tailwindcss/vite plugin, `tailwind.config.js` YOK) |
| Veritabanı | Firebase Firestore v12 |
| Auth | Firebase Authentication v12 |
| AI | Google Gemini 1.5 Flash (REST API, v1beta endpoint) |
| State | Zustand v5 |
| Paket Yöneticisi | npm |

---

## Klasör Yapısı

```
todo-app-desktop/
├── .env                          → Ortam değişkenleri (gitignore'da)
├── package.json                  → "type":"module" (Vite için ESM)
├── vite.config.ts                → @tailwindcss/vite, base:'./', port:5173, alias @→src/
├── tsconfig.json                 → references: app + node + electron
├── tsconfig.app.json             → src/ için, noEmit:true, moduleResolution:bundler
├── tsconfig.electron.json        → electron/ için, module:CommonJS, outDir:dist-electron
├── electron/
│   ├── main.ts                   → BrowserWindow, IPC, bildirim zamanlayıcıları
│   ├── preload.ts                → contextBridge ile window.electronAPI
│   └── notifications.ts         → 08:30 sabah + 30dk bitiş bildirimleri
├── dist-electron/                → tsc çıktısı (gitignore'da, build'de oluşur)
│   └── package.json              → {"type":"commonjs"} — ESM çakışma çözümü
└── src/
    ├── main.tsx                  → React root, StrictMode
    ├── App.tsx                   → View router: 'dashboard' | 'profile'
    ├── index.css                 → @import "tailwindcss"
    ├── api/
    │   ├── firebase.ts           → initializeApp, export auth, export db
    │   └── openai.ts             → generateTaskPlan() — Gemini REST çağrısı
    ├── components/
    │   ├── Button.tsx            → variant: primary|secondary|ghost|danger, size: sm|md|lg
    │   ├── Modal.tsx             → ESC kapanma, backdrop blur
    │   ├── TaskCard.tsx          → hover edit/delete, süresi geçmiş renk
    │   ├── TaskForm.tsx          → title + description + datetime-local, edit modu
    │   └── AIPlanModal.tsx       → Gemini entegrasyonu, kota badge, 5 adım seçimi
    ├── hooks/
    │   ├── useAuth.ts            → onAuthStateChanged + Firestore onSnapshot
    │   ├── useTodos.ts           → Firestore CRUD + createManyTodos
    │   └── useNotifications.ts   → Electron IPC köprüsü
    ├── store/
    │   ├── authStore.ts          → Zustand: { user, loading }
    │   └── todoStore.ts          → Zustand: { todos, loading }
    ├── types/
    │   ├── index.ts              → User, Todo, TodoFormData
    │   └── electron.d.ts         → window.electronAPI global tip
    └── views/
        ├── Login.tsx             → Email/şifre kayıt + giriş
        ├── Dashboard.tsx         → Sidebar + görev listesi, dark/light toggle
        └── Profile.tsx           → Şifre değiştirme + AI kota
```

---

## Firestore Veri Modeli

### `users` koleksiyonu
| Alan | Tip | Açıklama |
|------|-----|----------|
| uid | string | Firebase Auth UID (döküman ID ile aynı) |
| email | string | |
| displayName | string | |
| aiUsageCount | number | 0–10, AI kullanım kotası |
| createdAt | Timestamp | |

### `todos` koleksiyonu
| Alan | Tip | Açıklama |
|------|-----|----------|
| id | string | Firestore otomatik ID |
| userId | string | users.uid ile ilişki |
| title | string | |
| description | string | |
| dueDate | Timestamp \| null | |
| isCompleted | boolean | |
| createdAt | Timestamp | |

---

## TypeScript Arayüzleri (`src/types/index.ts`)

```typescript
interface User {
  uid: string
  email: string
  displayName: string
  aiUsageCount: number
  createdAt: Timestamp
}

interface Todo {
  id: string
  userId: string
  title: string
  description: string
  dueDate: Timestamp
  isCompleted: boolean
  createdAt: Timestamp
}

interface TodoFormData {
  title: string
  description: string
  dueDate: string  // datetime-local input değeri
}
```

---

## Global State — Zustand

```typescript
// authStore
{ user: User | null, loading: boolean }
// actions: setUser(user), setLoading(bool)

// todoStore
{ todos: Todo[], loading: boolean }
// actions: setTodos(), addTodo(), updateTodo(id, Partial<Todo>), removeTodo(id), setLoading()
```

---

## Hooks

### `useAuth()`
- `onAuthStateChanged` dinler
- Giriş yapınca `users/{uid}` belgesini `onSnapshot` ile dinler (aiUsageCount anlık güncellenir)
- `authStore` günceller
- Return: `{ user, loading }`

### `useTodos()`
- `where('userId','==',uid)` + `orderBy('createdAt','desc')` ile `onSnapshot` dinler
- `createTodo(data)`, `editTodo(id, data)`, `toggleTodo(id, bool)`, `deleteTodo(id)`, `createManyTodos(string[])`
- `todoStore` günceller
- Return: `{ todos, loading, createTodo, editTodo, toggleTodo, deleteTodo, createManyTodos }`

### `useNotifications()`
- `window.electronAPI` varsa `onCheckDueTasks` callback kaydeder
- Tetiklenince todos'u serialize edip `sendDueTasks()` ile main process'e gönderir
- `useEffect` dependency: `[todos]` — todos değişince listener yeniden kayıt edilir

---

## Electron Mimarisi

### `main.ts` Akışı
```
app.whenReady()
  └── createWindow()
        ├── BrowserWindow(1200x800, contextIsolation:true, preload:preload.js)
        ├── DEV  → loadURL('http://localhost:5173')
        └── PROD → loadFile('../dist/index.html')
  └── ready-to-show → scheduleNotifications(mainWindow)
  └── ipcMain.on('due-tasks-response') → handleDueTasks(todos)
  └── ipcMain.handle('get-platform') → process.platform
```

### `preload.ts` — `window.electronAPI`
```typescript
{
  getPlatform()                   // ipcRenderer.invoke('get-platform')
  onCheckDueTasks(callback)       // ipcRenderer.on('check-due-tasks', cb)
  sendDueTasks(todos)             // ipcRenderer.send('due-tasks-response', todos)
  removeCheckDueTasksListener()   // ipcRenderer.removeAllListeners(...)
}
```

### `notifications.ts`
- `scheduleMorningNotification()` → Her gün 08:30'da `new Notification().show()`
- `startDueDateChecker()` → Her 60 saniyede renderer'a `check-due-tasks` gönderir
- `handleDueTasks(todos)` → 30dk içinde biten görevler için bildirim, `notifiedIds` Set ile tekrar önleme

### Bildirim IPC Akışı
```
Main (setInterval 60s)
  → 'check-due-tasks'
    → Renderer: useNotifications hook (todos serialize)
      → 'due-tasks-response'
        → Main: handleDueTasks() → Notification.show()
```

### ESM / CommonJS Çözümü
- `package.json` → `"type":"module"` (Vite için)
- `tsconfig.electron.json` → `"module":"CommonJS"`
- `dist-electron/package.json` → `{"type":"commonjs"}` (build sonrası otomatik oluşur)

---

## AI Entegrasyonu (`src/api/openai.ts`)

```
Endpoint : https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=API_KEY
API Key  : import.meta.env.VITE_OPENAI_API_KEY
Request  : { contents:[{ parts:[{ text: prompt }] }], generationConfig:{ temperature:0.7, maxOutputTokens:500 } }
Response : data.candidates[0].content.parts[0].text → regex ile JSON parse → { steps: string[] }
```

### `AIPlanModal.tsx` Akışı
1. `user.aiUsageCount >= 10` → kilit ekranı, işlem yapılmaz
2. Kullanıcı hedef girer → `generateTaskPlan(goal)` çağrılır
3. Başarılıysa `updateDoc(users/{uid}, { aiUsageCount: increment(1) })` (onSnapshot ile sidebar'a anlık yansır)
4. 5 adım checkbox listesi gösterilir — tümünü seç / temizle
5. Seçili adımlar → `createManyTodos(selectedSteps)` ile Firestore'a toplu yazılır

---

## Routing

React Router kullanılmıyor. `App.tsx`'te `useState<'dashboard'|'profile'>`:

```
loading === true  → Spinner
user === null     → <Login />
view === 'profile'    → <Profile onBack={() => setView('dashboard')} />
view === 'dashboard'  → <Dashboard onNavigateToProfile={() => setView('profile')} />
```

---

## npm Scripts

| Script | Açıklama |
|--------|----------|
| `npm run dev` | electron:compile → concurrently(vite + electron:watch + electron:start) |
| `npm run build` | tsc app + vite build + tsc electron + dist-electron/package.json |
| `npm run dist:win` | build + electron-builder --win → NSIS installer |
| `npm run dist:mac` | build + electron-builder --mac → DMG |
| `npm run dist:linux` | build + electron-builder --linux → AppImage |

---

## Önemli Notlar

1. **Tailwind v4** — `tailwind.config.js` YOK. Tek kural: `index.css`'te `@import "tailwindcss"`
2. **Dark mode** — Tailwind `dark:` prefix'i değil, `Dashboard.tsx`'te `darkMode` boolean state + manuel class geçişi
3. **İkon kütüphanesi yok** — Tüm SVG'ler her dosyada inline component olarak tanımlı
4. **Firebase güvenlik kuralları** — Production için henüz sıkılaştırılmadı
5. **Gitignore** — `dist/`, `dist-electron/`, `.env` takip edilmiyor
6. **Path alias** — `@/` → `src/`, hem `tsconfig.app.json` paths hem `vite.config.ts` resolve.alias'ta tanımlı
7. **Electron pencere** — `titleBarStyle:'hiddenInset'`, `backgroundColor:'#0f172a'`, `show:false` → ready-to-show'da gösterilir

---

Bu bağlamı anladıysan "Hazırım, sorunuzu bekliyorum" de.
