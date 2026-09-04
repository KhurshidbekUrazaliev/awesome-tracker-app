# Backend API

An Express + TypeScript API implementing exactly what the app's `services/*.ts` clients expect: JWT auth, profile/avatar management, and chat. Data is persisted to Postgres via [Drizzle ORM](https://orm.drizzle.team) — schema in `src/db/schema.ts`, migrations in `drizzle/`. File uploads go to Supabase Storage.

Requires **Node 22+** (set by `@supabase/storage-js`; the Dockerfile and CI are both already pinned to it).

Full endpoint reference: [`openapi.yaml`](./openapi.yaml) (open it at [editor.swagger.io](https://editor.swagger.io) for an interactive view, or `npx @redocly/cli preview-docs openapi.yaml`).

## Run locally

```bash
cd server
npm install
cp .env.example .env      # edit JWT_SECRET, CORS_ORIGIN, DATABASE_URL, SUPABASE_* as needed
docker compose -f ../docker-compose.yml up postgres -d   # or point DATABASE_URL at any Postgres
npm run db:migrate
npm run dev                # http://localhost:3000, structured logs pretty-printed
```

Then point the app at it (from the repo root):

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000/api npm start
```

`.env.example` at the repo root already defaults to this URL, so a plain `npm start` picks it up automatically.

### Free Postgres for local/staging use

[Neon](https://neon.tech) and [Supabase](https://supabase.com) both have a genuinely free tier (no card required) — either works as `DATABASE_URL`. Both require SSL for external connections; Neon's copied connection string includes `?sslmode=require`, Supabase's doesn't but still requires it. `src/db/client.ts` handles this: an explicit `sslmode` in the URL always wins, otherwise SSL is required automatically whenever `NODE_ENV=production` (set in the Dockerfile) and left off for local/docker-compose dev.

### File storage (Supabase Storage)

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (from your Supabase project's Settings → API) enable avatar and generic file uploads. **Use the `service_role` key, not `anon`** — this runs server-side only and is never exposed to clients. Without these set, `/api/users/me/avatar` and `/api/upload` fail with a clear error (logged in full server-side; the client just sees a generic 500) instead of writing anywhere — there's no silent local-disk fallback.

One-time setup in the Supabase dashboard: Storage → New bucket → name it `uploads` (or whatever you set `SUPABASE_STORAGE_BUCKET` to) → **make it public** (avatars/files need to be viewable via a plain URL, same as the app expects).

### Schema changes

Edit `src/db/schema.ts`, then:

```bash
npm run db:generate   # writes a new SQL file under drizzle/
npm run db:migrate    # applies pending migrations
```

Commit the generated `drizzle/*.sql` file — it's the source of truth for what ships, not the TypeScript schema by itself.

## Run with Docker

```bash
cd server
docker build -t awesome-tracker-api .
docker run -p 3000:3000 \
  -e JWT_SECRET=dev-secret \
  -e DATABASE_URL=postgres://... \
  -e SUPABASE_URL=https://your-project.supabase.co \
  -e SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
  awesome-tracker-api
```

Or bring up the whole stack (Postgres + API + web, built for local self-hosting) from the repo root:

```bash
docker compose up --build
# API: http://localhost:3000   Web: http://localhost:8080
```

The container runs pending migrations automatically on start (`dist/db/migrate.js`) before starting the server.

## Endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/health` | – | liveness probe |
| GET | `/api/ready` | – | readiness probe (checks the database is reachable) |
| POST | `/api/auth/signup` | – | `{ name, email, password }` → `{ token, user }` |
| POST | `/api/auth/login` | – | `{ email, password }` → `{ token, user }` |
| POST | `/api/auth/logout` | – | stateless JWT, no-op |
| POST | `/api/auth/refresh` | ✓ | reissues a token |
| POST | `/api/auth/forgot-password` | – | logs a reset token to the server console (no email provider wired up) |
| POST | `/api/auth/reset-password` | – | `{ token, password }` |
| GET | `/api/users/me` | ✓ | |
| GET | `/api/users/:id` | ✓ | |
| PATCH | `/api/users/me` | ✓ | `{ name?, avatar? }` |
| POST | `/api/users/me/avatar` | ✓ | multipart, field `avatar` — uploaded to Supabase Storage |
| DELETE | `/api/users/me` | ✓ | deletes the account |
| POST | `/api/upload` | ✓ | multipart, field `file` — uploaded to Supabase Storage |
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
- Multi-stage Dockerfile: non-root user, `npm ci --omit=dev` in the runtime layer, built-in `HEALTHCHECK`, migrations applied on boot.
- Normalized relational schema (users / conversations / conversation_participants / messages) with foreign keys and `ON DELETE CASCADE` — deleting a user cleanly removes their memberships and messages, verified end to end.
- Zod validation on write endpoints (signup, profile update); every chat/profile mutation checks resource ownership/membership before acting.
- No local disk state at all now (uploads go to Supabase Storage) — the process itself is fully stateless and safe to run on any host without a persistent volume.

## CI/CD

- `.github/workflows/ci.yml` — typechecks, lints, tests, and builds both the frontend and this API on every push/PR.
- `.github/workflows/cd-backend-image.yml` — on push to `main` touching `server/**`, builds this Dockerfile and pushes to GitHub Container Registry as `ghcr.io/<owner>/<repo>/api:latest` and `:sha-<short-sha>`. No external credentials needed (uses `GITHUB_TOKEN`).
- `.github/workflows/cd-pages.yml` — builds and publishes the web app to GitHub Pages on push to `main`.

To actually deploy the published image, point any container host (Render, Koyeb, Fly.io, a VPS) at `ghcr.io/<owner>/<repo>/api:latest`. Note: GHCR packages are private by default even in a public repo — make the package public (repo → Packages → api → Package settings) or give your host's puller a `read:packages` token.

## Deploying (Render + Supabase)

Fully stateless now — no persistent disk needed anywhere.

1. **Supabase**: create a project (free tier), then grab from Settings → API: the Postgres connection string (Settings → Database → Connection string → "Transaction" pooler mode), `SUPABASE_URL`, and the `service_role` key. Create a public Storage bucket named `uploads`. SSL is required automatically in production (see above) even though Supabase's copied string doesn't include `sslmode` — no manual edit needed.
2. **Render**: New → Web Service → Existing Image → `ghcr.io/<owner>/<repo>/api:latest`. Set env vars: `JWT_SECRET` (long random string), `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ORIGIN` (your GitHub Pages origin, e.g. `https://khurshidbekurazaliev.github.io`). Render sets `PORT` itself — the app already reads it.
3. Once live, note the Render URL, then rebuild the web app pointing at it: `EXPO_PUBLIC_API_URL=https://your-service.onrender.com/api npm run build:web` (or set the `API_URL` repository variable so `cd-pages.yml` does it automatically on the next push).

## Known limitations

Deliberate scope cuts for a demo/MVP backend — call these out before treating this as production-grade:

- **No real email**: password-reset tokens are logged to the server console, not emailed. Needs a provider (Resend/SES/etc.) wired into `routes/auth.ts`.
- **No refresh-token rotation**: `/auth/refresh` reissues a token from a still-valid one; there's no revocation list, so a compromised token remains valid until it expires.
- **Chat is polling, not real-time**: no WebSocket/SSE push. The frontend has to re-fetch to see new messages.
- **No connection pooler configured on the app side**: `postgres.js`'s built-in pool (`max: 10`) is fine for one instance; scaling to multiple instances against a low-connection-cap free tier needs the provider's pooled connection string (Supabase's "Transaction" mode pooler, noted above, already handles this) or PgBouncer.
- **Supabase free-tier project auto-pause**: a Supabase free project pauses after about a week with no activity and needs a manual restore from the dashboard. Fine for active development; worth knowing before assuming "deployed" means "always reachable" with zero traffic.
