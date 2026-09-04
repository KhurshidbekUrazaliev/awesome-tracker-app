# Awesome Project

A full-featured React Native mobile application built with Expo Router.

## 🚀 Features

- **Authentication**: Login, signup with JWT
- **Real-time Chat**: Messaging and conversations
- **User Profiles**: Profile management with avatar upload
- **Settings**: Notifications, security, preferences
- **Internationalization**: EN, ES support
- **Theme Support**: Light and dark mode
- **State Management**: Zustand
- **Type Safety**: Full TypeScript
- **Form Validation**: Zod schemas

## 📁 Project Structure

```
AwesomeProject/
├── app/              # Expo Router pages
├── modules/          # Feature modules
├── components/       # Global components
├── hooks/            # Global hooks
├── store/            # Zustand stores
├── services/         # API services (client)
├── utils/            # Utilities
├── localization/     # i18n
├── server/           # Backend API (Express + TypeScript)
└── __tests__/        # Tests
```

## 🛠️ Tech Stack

- React Native + Expo
- Expo Router
- Zustand
- TailwindCSS (NativeWind)
- React Hook Form + Zod
- Axios
- i18next
- Backend: Express + TypeScript (see `server/README.md`)

## 📦 Installation

```bash
npm install
npm start
```

## 🖥️ Backend

The app needs the API in `server/` running to do anything beyond the sign-in screen (auth, chat, profile, uploads). See `server/README.md` for setup; the short version:

```bash
cd server
npm install
cp .env.example .env
npm run dev   # http://localhost:3000
```

The default `EXPO_PUBLIC_API_URL` in `.env.example` already points at it.

## 🧪 Testing

```bash
npm test
npm run typecheck
npm run lint
```

## 🌍 Environment

Configure in `env/.env.*`:
- `.env.development`
- `.env.staging`
- `.env.production`

## 📄 License

MIT
