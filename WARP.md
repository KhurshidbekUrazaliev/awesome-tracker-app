# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Essential commands

- Install deps:

```bash path=null start=null
npm install
```

- Start dev (Expo):

```bash path=null start=null
npm start          # Expo dev menu
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run web        # Web
```

- Build (web only):

```bash path=null start=null
npm run build:web
```

- Lint, typecheck, test:

```bash path=null start=null
npm run lint
npm run typecheck
npm test
```

- Run a single Jest test:

```bash path=null start=null
npm test -- app/<path-to-test>.test.tsx
# or by name pattern
npm test -- -t "<test name substring>"
```

## Architecture overview

- Framework: React Native app bootstrapped with Expo 50 and Expo Router.
- Routing: File-based routes under `app/` (e.g., `app/auth/*`, `app/chat/*`, `app/profile/*`). `app/auth/index.tsx` redirects to `login`. Expo Router is enabled via `plugins: ['expo-router']` in `app.config.ts`.
- Styling: Tailwind CSS via NativeWind. Babel plugin is enabled in `babel.config.js` and classes come from `tailwind.config.js` (`content` scans `app`, `components`, `modules`). Use `className` props in React Native components.
- TypeScript: Strict mode with path aliases defined in `tsconfig.json`:

```ts path=null start=null
import Avatar from '@/components/Avatar'
import { useUserStore } from '@/store/useUserStore'
import { formatDate } from '@/utils/formatDate'
```

- State and data: The code imports from `@/store/*`, `@/services/*`, and `@/modules/*` (e.g., `useChat`); these modules are organized by feature even if not all files are present in this snapshot. Axios is the HTTP client; Zustand is used for state.
- Environment: Example files in `env/` (`.env.development`, `.env.staging`, `.env.production`) and `.env.example`. Put environment-specific URLs there; if values must be available in the JS bundle, prefer Expo’s `EXPO_PUBLIC_*` variables.

## CI

- GitHub Actions at `.github/workflows/ci.yml` uses Node 18 and runs:
  - `npm ci`
  - `npm run typecheck`
  - `npm run lint`
  - `npm test`
