# Backend API

An Express + TypeScript API implementing exactly what the app's `services/*.ts` clients expect: JWT auth, profile/avatar management, and chat. Data is persisted to Postgres via [Drizzle ORM](https://orm.drizzle.team) — schema in `src/db/schema.ts`, migrations in `drizzle/`.

Full endpoint reference: [`openapi.yaml`](./openapi.yaml) (open it at [editor.swagger.io](https://editor.swagger.io) for an interactive view, or `npx @redocly/cli preview-docs openapi.yaml`).

## Run locally

```bash
cd server
npm install
cp .env.example .env      # edit JWT_SECRET, CORS_ORIGIN, DATABASE_URL as needed
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

[Neon](https://neon.tech) and [Supabase](https://supabase.com) both have a genuinely free tier (no card required) — either works as `DATABASE_URL`. Their connection strings already include `?sslmode=require`; the driver reads that directly from the URL, no extra config needed.

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
docker run -p 3000:3000 -e JWT_SECRET=dev-secret -e DATABASE_URL=postgres://... awesome-tracker-api
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
- Multi-stage Dockerfile: non-root user, `npm ci --omit=dev` in the runtime layer, built-in `HEALTHCHECK`, migrations applied on boot.
- Normalized relational schema (users / conversations / conversation_participants / messages) with foreign keys and `ON DELETE CASCADE` — deleting a user cleanly removes their memberships and messages, verified end to end.
- Zod validation on write endpoints (signup, profile update); every chat/profile mutation checks resource ownership/membership before acting.

## CI/CD

- `.github/workflows/ci.yml` — typechecks, lints, tests, and builds both the frontend and this API on every push/PR.
- `.github/workflows/cd-backend-image.yml` — on push to `main` touching `server/**`, builds this Dockerfile and pushes to GitHub Container Registry as `ghcr.io/<owner>/<repo>/api:latest` and `:sha-<short-sha>`. No external credentials needed (uses `GITHUB_TOKEN`).
- `.github/workflows/cd-pages.yml` — builds and publishes the web app to GitHub Pages on push to `main`.

To actually deploy the published image, point any container host (Render, Koyeb, Fly.io, a VPS) at `ghcr.io/<owner>/<repo>/api:latest`. Note: GHCR packages are private by default even in a public repo — make the package public (repo → Packages → api → Package settings) or give your host's puller a `read:packages` token.

## Deploying

Since the database is now external Postgres, this process itself is stateless — any container host works, without needing a persistent disk for the process itself (uploaded files are the exception, see below).

1. Provision Postgres: [Neon](https://neon.tech) or [Supabase](https://supabase.com) free tier both work.
2. Set env vars: `JWT_SECRET` (long random string), `DATABASE_URL` (from step 1), `CORS_ORIGIN` (comma-separated list including your deployed web app's origin, e.g. `https://khurshidbekurazaliev.github.io`), `PORT` if the host requires a specific one.
3. Either pull the image `cd-backend-image.yml` publishes to GHCR, or build and start directly: `npm install && npm run build && npm run db:migrate && npm start`.
4. `uploads/` (avatars, generic file uploads) is still local disk — mount a persistent volume at `UPLOADS_DIR`, or accept that uploaded files are lost on redeploy until this moves to object storage (S3-compatible: Cloudflare R2, Backblaze B2, or AWS S3 all have usable free tiers).
5. Rebuild the web app pointing at the deployed API: `EXPO_PUBLIC_API_URL=https://your-api-host.example.com/api npm run build:web` (or set the `API_URL` repository variable so `cd-pages.yml` does it automatically).

## Known limitations

Deliberate scope cuts for a demo/MVP backend — call these out before treating this as production-grade:

- **File uploads still live on local disk**: avatars and generic uploads are written to `UPLOADS_DIR`, not the database — a host without a persistent volume loses them on every redeploy. Move to S3-compatible object storage before that matters.
- **No real email**: password-reset tokens are logged to the server console, not emailed. Needs a provider (Resend/SES/etc.) wired into `routes/auth.ts`.
- **No refresh-token rotation**: `/auth/refresh` reissues a token from a still-valid one; there's no revocation list, so a compromised token remains valid until it expires.
- **Chat is polling, not real-time**: no WebSocket/SSE push. The frontend has to re-fetch to see new messages.
- **No connection pooler configured**: `postgres.js`'s built-in pool (`max: 10`) is fine for one instance; scaling to multiple instances against a provider with a low connection cap (some free tiers) needs PgBouncer or the provider's own pooled connection string.
