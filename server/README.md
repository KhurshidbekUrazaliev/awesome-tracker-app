# Backend API

A small Express + TypeScript API implementing exactly what the app's `services/*.ts` clients expect: auth, profile, avatar/file upload, and chat. Data is persisted to a local JSON file (`data/db.json`) — enough for development and demos, not a production datastore.

## Run locally

```bash
cd server
npm install
cp .env.example .env   # edit JWT_SECRET, CORS_ORIGIN as needed
npm run dev             # http://localhost:3000
```

Then point the app at it (from the repo root):

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000/api npm start
```

`.env.example` at the repo root already defaults to this URL, so a plain `npm start` picks it up automatically for local development.

## Endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/auth/signup` | – | `{ name, email, password }` → `{ token, user }` |
| POST | `/api/auth/login` | – | `{ email, password }` → `{ token, user }` |
| POST | `/api/auth/logout` | – | stateless JWT, no-op |
| POST | `/api/auth/refresh` | ✓ | reissues a token |
| POST | `/api/auth/forgot-password` | – | logs a reset token to the server console (no email provider wired up) |
| POST | `/api/auth/reset-password` | – | `{ token, password }` |
| GET | `/api/users/me` | ✓ | |
| GET | `/api/users/:id` | ✓ | |
| PATCH | `/api/users/me` | ✓ | `{ name?, avatar? }` |
| POST | `/api/users/me/avatar` | ✓ | multipart, field `avatar` |
| DELETE | `/api/users/me` | ✓ | deletes the account |
| POST | `/api/upload` | ✓ | multipart, field `file` |
| GET | `/api/chat/conversations` | ✓ | |
| POST | `/api/chat/conversations` | ✓ | `{ participantIds: string[] }` |
| GET | `/api/chat/conversations/:id/messages` | ✓ | |
| POST | `/api/chat/conversations/:id/messages` | ✓ | `{ content }` |
| POST | `/api/chat/conversations/:id/read` | ✓ | |
| DELETE | `/api/chat/messages/:id` | ✓ | sender only |

Authenticated routes expect `Authorization: Bearer <token>`.

## Deploying

This is a stateful Node process (in-memory + a JSON file on disk), so it needs a persistent Node host — GitHub Pages (used for the web app) only serves static files and can't run it. Any small Node host works (Render, Railway, Fly.io, a VPS, etc.):

1. Set env vars: `JWT_SECRET` (long random string), `CORS_ORIGIN` (comma-separated list including your deployed web app's origin, e.g. `https://khurshidbekurazaliev.github.io`), `PORT` if the host requires a specific one.
2. Build and start: `npm install && npm run build && npm start`.
3. Note the data directory (`data/`) and `uploads/` need a persistent disk/volume — an ephemeral filesystem (some free tiers) will wipe them on redeploy/restart.
4. Rebuild the web app pointing at the deployed API: `EXPO_PUBLIC_API_URL=https://your-api-host.example.com/api npm run build:web`.
