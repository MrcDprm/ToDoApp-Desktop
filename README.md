# ToDoApp — AI Destekli Masaüstü Görev Yönetimi

Electron.js + React + Firebase + Google Gemini 2.5 Flash ile geliştirilmiş modern masaüstü görev yönetim uygulaması.

## Özellikler

- **Firebase Authentication** — E-posta/şifre ile kayıt ve giriş
- **Firestore Gerçek Zamanlı Senkronizasyon** — `onSnapshot` ile anlık güncelleme; tüm state tek kaynaktan yönetilir
- **AI Planlama** — Gemini 2.5 Flash ile hedefi 5 adımlık eyleme dönüştürme; `responseSchema` ile garantili JSON çıktı
- **Günlük AI Kotası** — Günde 10 ücretsiz AI planı hakkı; gece yarısı istemci taraflı otomatik sıfırlama
- **Sekme Filtreleme** — Tüm / Aktif / Gecikmiş / Tamamlanan sekmeleriyle görev görüntüleme
- **Toast Bildirimleri** — İşlem başarılarında ekranın sağ alt köşesinde 3 saniyelik modern bildirimler (harici kütüphane yok)
- **Masaüstü Bildirimleri** — Görev bitiş saatinden 30 dk önce ve sabah 08:30'da native Electron bildirimi
- **Karanlık / Aydınlık Mod** — Tercihlerinize göre tema değiştirme

## Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Masaüstü | Electron.js v41 |
| Frontend | React 19 + TypeScript 6 + Vite 8 |
| Stil | Tailwind CSS v4 |
| Veritabanı | Firebase Firestore v12 |
| Kimlik Doğrulama | Firebase Authentication v12 |
| AI | Google Gemini 2.5 Flash (REST API, v1beta) |
| Global State | Zustand v5 |

## Kurulum

### Gereksinimler

- Node.js 18+
- Firebase projesi (Firestore + Authentication aktif)
- Google AI Studio API anahtarı → [aistudio.google.com](https://aistudio.google.com)

### Adımlar

1. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

2. `.env` dosyasını oluşturun:
   ```env
   VITE_FIREBASE_API_KEY="..."
   VITE_FIREBASE_AUTH_DOMAIN="..."
   VITE_FIREBASE_PROJECT_ID="..."
   VITE_FIREBASE_STORAGE_BUCKET="..."
   VITE_FIREBASE_MESSAGING_SENDER_ID="..."
   VITE_FIREBASE_APP_ID="..."
   VITE_OPENAI_API_KEY="..."   # Gemini API anahtarınız
   ```

3. Geliştirme modunda başlatın:
   ```bash
   npm run dev
   ```

## Derleme (Paketleme)

```bash
# Windows için .exe installer
npm run dist:win

# macOS için .dmg
npm run dist:mac

# Linux için .AppImage
npm run dist:linux
```

Derlenmiş dosyalar `release/` klasörüne çıkar.

## Klasör Yapısı

```
src/
├── api/
│   ├── firebase.ts          → Firebase başlatma, auth ve db exportları
│   └── openai.ts            → generateTaskPlan() — Gemini 2.5 Flash REST çağrısı
├── components/
│   ├── AIPlanModal.tsx      → AI planlama modali, günlük kota yönetimi
│   ├── Button.tsx           → primary | secondary | ghost | danger varyantları
│   ├── Modal.tsx            → ESC ile kapanma, backdrop blur
│   ├── TaskCard.tsx         → Hover animasyonları, gecikmiş görev renklendirme
│   ├── TaskForm.tsx         → Görev ekleme/düzenleme formu
│   └── ToastContainer.tsx   → Sağ alt köşe toast bildirimleri
├── hooks/
│   ├── useAuth.ts           → Firebase oturum dinleyicisi
│   ├── useNotifications.ts  → Electron IPC köprüsü
│   └── useTodos.ts          → Firestore CRUD + onSnapshot
├── store/
│   ├── authStore.ts         → Zustand: kullanıcı oturum state'i
│   ├── todoStore.ts         → Zustand: görev listesi state'i
│   └── toastStore.ts        → Zustand: toast bildirim kuyruğu
├── types/
│   └── index.ts             → User, Todo, TodoFormData arayüzleri
└── views/
    ├── Dashboard.tsx        → Ana ekran — sidebar, sekme filtreler, görev listesi
    ├── Login.tsx            → Giriş ve kayıt ekranı
    └── Profile.tsx          → Şifre değiştirme, AI kota bilgisi
```

## Firestore Veri Modeli

### `users` koleksiyonu

| Alan | Tip | Açıklama |
|------|-----|----------|
| uid | string | Firebase Auth UID |
| email | string | |
| displayName | string | |
| aiUsageCount | number | Günlük AI kullanım sayacı (0–10) |
| lastAiUsageDate | string | Son AI kullanım tarihi (`YYYY-MM-DD`) |
| createdAt | Timestamp | |

### `todos` koleksiyonu

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | string | Firestore otomatik ID |
| userId | string | Kullanıcı referansı |
| title | string | |
| description | string | |
| dueDate | Timestamp \| null | |
| isCompleted | boolean | |
| createdAt | Timestamp | |

## Firestore Güvenlik Kuralları

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /todos/{todoId} {
      allow read, write: if request.auth != null
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

## npm Scripts

| Script | Açıklama |
|--------|----------|
| `npm run dev` | Electron + Vite geliştirme modu |
| `npm run build` | TypeScript derleme + Vite build |
| `npm run dist:win` | Windows NSIS installer |
| `npm run dist:mac` | macOS DMG |
| `npm run dist:linux` | Linux AppImage |
