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
├── services/         # API services
├── utils/            # Utilities
├── localization/     # i18n
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

## 📦 Installation

```bash
npm install
npm start
```

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
