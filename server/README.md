# Backend API

An Express + TypeScript API implementing exactly what the app's `services/*.ts` clients expect: JWT auth, profile/avatar management, and chat. Data is persisted to a local JSON file (`data/db.json`) — enough for development and demos, not a production datastore (see [Known limitations](#known-limitations)).

Full endpoint reference: [`openapi.yaml`](./openapi.yaml) (open it at [editor.swagger.io](https://editor.swagger.io) for an interactive view, or `npx @redocly/cli preview-docs openapi.yaml`).

## Run locally

```bash
cd server
npm install
cp .env.example .env   # edit JWT_SECRET, CORS_ORIGIN as needed
npm run dev             # http://localhost:3000, structured logs pretty-printed
```

Then point the app at it (from the repo root):

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000/api npm start
```

`.env.example` at the repo root already defaults to this URL, so a plain `npm start` picks it up automatically.

## Run with Docker

```bash
cd server
docker build -t awesome-tracker-api .
docker run -p 3000:3000 -e JWT_SECRET=dev-secret awesome-tracker-api
```

Or bring up the whole stack (API + web, built for local self-hosting) from the repo root:

```bash
docker compose up --build
# API: http://localhost:3000   Web: http://localhost:8080
```

## Endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/health` | – | liveness probe |
| GET | `/api/ready` | – | readiness probe (checks the data store is writable) |
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

## Production hardening already in place

- `helmet` security headers, CORS locked to an explicit origin allowlist (`CORS_ORIGIN`).
- Rate limiting: a tight window on `/auth/login`, `/auth/signup`, `/auth/forgot-password` (20 req / 15 min) plus a generous baseline (300 req / min) everywhere else.
- Structured JSON logs (`pino`/`pino-http`), pretty-printed in dev.
- `/api/ready` distinguishes "process is up" from "can actually serve requests" for orchestrators.
- Graceful shutdown on `SIGTERM`/`SIGINT` (drains in-flight requests before exiting).
- Multi-stage Dockerfile: non-root user, `npm ci --omit=dev` in the runtime layer, built-in `HEALTHCHECK`.
- Zod validation on write endpoints (signup, profile update); every chat/profile mutation checks resource ownership/membership before acting.

## CI/CD

- `.github/workflows/ci.yml` — typechecks, lints, tests, and builds both the frontend and this API on every push/PR.
- `.github/workflows/cd-backend-image.yml` — on push to `main` touching `server/**`, builds this Dockerfile and pushes to GitHub Container Registry as `ghcr.io/<owner>/<repo>/api:latest` and `:sha-<short-sha>`. No external credentials needed (uses `GITHUB_TOKEN`).
- `.github/workflows/cd-pages.yml` — builds and publishes the web app to GitHub Pages on push to `main`.

To actually deploy the published image, point any container host (Render, Railway, Fly.io, a VPS) at `ghcr.io/<owner>/<repo>/api:latest`.

## Deploying

This is a stateful Node process (in-memory + a JSON file on disk), so it needs a persistent Node/container host — GitHub Pages (used for the web app) only serves static files and can't run it.

1. Set env vars: `JWT_SECRET` (long random string), `CORS_ORIGIN` (comma-separated list including your deployed web app's origin, e.g. `https://khurshidbekurazaliev.github.io`), `PORT` if the host requires a specific one.
2. Either pull the image `cd-backend-image.yml` publishes to GHCR, or build and start directly: `npm install && npm run build && npm start`.
3. Mount a persistent volume at `DB_PATH`'s directory and `UPLOADS_DIR` (defaults: `/app/data`, `/app/uploads` in the Docker image) — an ephemeral filesystem (some free tiers) will wipe them on redeploy/restart.
4. Rebuild the web app pointing at the deployed API: `EXPO_PUBLIC_API_URL=https://your-api-host.example.com/api npm run build:web` (or set the `API_URL` repository variable so `cd-pages.yml` does it automatically).

## Known limitations

Deliberate scope cuts for a demo/MVP backend — call these out before treating this as production-grade:

- **Storage**: a single JSON file, rewritten wholesale on every write. Fine for a demo; will not scale past light concurrent use and has no transactional guarantees. Swap for Postgres/SQLite + an ORM before real traffic.
- **No real email**: password-reset tokens are logged to the server console, not emailed. Needs a provider (Postgres + Resend/SES/etc.) wired into `routes/auth.ts`.
- **No refresh-token rotation**: `/auth/refresh` reissues a token from a still-valid one; there's no revocation list, so a compromised token remains valid until it expires.
- **Chat is polling, not real-time**: no WebSocket/SSE push. The frontend has to re-fetch to see new messages.
- **Single-process**: in-memory JS objects mean no horizontal scaling without moving state into a shared datastore first.
