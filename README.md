# ToDoApp — AI Destekli Masaüstü Görev Yönetimi

Electron.js + React + Firebase + OpenAI GPT-3.5 ile geliştirilmiş modern masaüstü görev yönetim uygulaması.

## Özellikler

- **Firebase Authentication** — E-posta/şifre ile kayıt ve giriş
- **Firestore** — Gerçek zamanlı görev senkronizasyonu
- **AI Planlama** — GPT-3.5 Turbo ile hedefleri 5 adımlık eylem planına dönüştürme
- **Masaüstü Bildirimleri** — Görev bitiş saatinden 30 dk önce ve sabah 08:30'da native bildirim
- **Karanlık/Aydınlık Mod** — Tercihlerinize göre tema değiştirme

## Kurulum

### Gereksinimler

- Node.js 18+
- Firebase projesi
- OpenAI API anahtarı

### Adımlar

1. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

2. `.env` dosyasını düzenleyin:
   ```env
   VITE_FIREBASE_API_KEY="your-api-key"
   VITE_OPENAI_API_KEY="your-openai-key"
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

## Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Masaüstü | Electron.js |
| Frontend | React + TypeScript + Vite |
| Stil | Tailwind CSS v4 |
| Veritabanı | Firebase Firestore |
| Kimlik Doğrulama | Firebase Authentication |
| AI | OpenAI GPT-3.5 Turbo |
| Global State | Zustand |

## Firestore Güvenlik Kuralları

Firebase konsolunda aşağıdaki kuralları uygulamanız önerilir:

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
