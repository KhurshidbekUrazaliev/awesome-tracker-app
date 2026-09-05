# Changelog

All notable changes to this project are documented here. Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.4.0] - 2026-09-05

### Added
- **Dark mode**: a real navy + violet dark theme, not just a toggle that did nothing. `tailwind.config.js` gains `darkMode: 'class'`, a violet `primary` scale (replacing the old sky-blue), and a bespoke `navy` neutral scale for dark surfaces. Every screen and shared component (`app/**`, `components/*`, `modules/**/components/*`) now carries `dark:` variants.
- `app/_layout.tsx` gains a `ThemeSync` component that keeps NativeWind's `dark:` classes in sync with the existing persisted `useThemeStore` choice (light/dark/system), and themes the native header/status bar to match.
- **Patched a real upstream bug**: `nativewind@2.0.11`'s web implementation only sets the DOM `.dark` class once at page load — calling `setColorScheme()` afterward updates its React state but never touches the DOM, so `dark:` utilities silently never respond to an in-session theme change on web. Fixed via `patch-package` (`patches/nativewind+2.0.11.patch`), applied automatically on `npm install` via a new `postinstall` script. Verified before and after: without the patch, toggling themes updated the native header (driven by raw JS) but left every NativeWind-styled surface stuck; with it, every screen (unauthenticated and authenticated) responds correctly in both directions.

## [1.3.0] - 2026-09-05

### Changed
- **File uploads moved to Supabase Storage**, replacing local disk (`UPLOADS_DIR`). Avatar and generic uploads (`multer.memoryStorage()`) now stream to a Supabase bucket via `src/storage.ts` and return its public URL; the `/uploads` static route, `paths.ts`, and the `uploads/` directory are gone entirely. The backend is now fully stateless — no persistent disk needed anywhere, on any host.
- **Bumped to Node 22** (Dockerfile, `ci.yml` backend job, `@types/node`) — `@supabase/storage-js` requires it. Verified: clean typecheck, clean Docker build, full regression suite against the Node 22 image.
- Deploy target settled: **Supabase** (Postgres + Storage) + **Render** (runs the published GHCR image). `server/README.md` has the concrete step-by-step.

Verified: uploads fail with a clear server-logged error (not a crash, generic 500 to the client) when Supabase Storage isn't configured — confirmed the server stays healthy and keeps serving other requests afterward.

## [1.2.0] - 2026-09-05

### Changed
- **Replaced the JSON-file data store with Postgres** (Drizzle ORM): normalized relational schema (`users`, `conversations`, `conversation_participants`, `messages`) with foreign keys and `ON DELETE CASCADE`, generated SQL migrations under `server/drizzle/`, migrations now run automatically on container boot. This was the top item in the "Known limitations" list — the JSON file had no transactional guarantees and wouldn't survive concurrent writes.
- `/api/ready` now checks database connectivity instead of local-disk writability.
- `docker-compose.yml` gained a `postgres` service; the API container no longer needs its own data volume (only `uploads/` still does).
- Fixed a connection-string SSL bug caught during testing: the driver was guessing SSL from the hostname (`localhost` vs. not), which would have broken every non-`localhost` non-SSL Postgres — including the API's own `docker-compose` service, addressed by using the standard `sslmode` query parameter on the connection string instead.

Verified end to end against a real Postgres, both via `npm run dev` and the built Docker image: full auth/profile/chat regression suite, plus specifically verifying `ON DELETE CASCADE` behavior (deleting a user removes their conversation memberships and messages, leaves other participants' data intact).

## [1.1.0] - 2026-09-04

### Added
- **Backend API** (`server/`): Express + TypeScript, implementing the full contract the frontend already expected — JWT auth, profile/avatar, chat with per-user unread tracking, generic file upload.
- **Production hardening**: helmet, origin-scoped CORS, rate limiting (tight on auth endpoints, generous baseline elsewhere), structured JSON logging (pino), `/api/ready` readiness probe, graceful shutdown, zod validation on write endpoints.
- **Containerization**: multi-stage `Dockerfile`s for both the API (non-root, health-checked) and the web app (static export served via nginx), plus a root `docker-compose.yml` for a one-command full-stack local preview.
- **CI/CD** (GitHub Actions): `ci.yml` now typechecks/lints/tests/builds both the frontend and backend; `cd-pages.yml` auto-publishes the web app to GitHub Pages on push to `main`; `cd-backend-image.yml` builds and publishes the API image to GHCR, credential-free.
- **API documentation**: `server/openapi.yaml` (OpenAPI 3.0, lint-clean) covering every endpoint.
- **App icon set** (`assets/`): icon, adaptive icon, splash, favicon, and notification icon — previously entirely missing, which broke the web favicon and would have blocked any app-store submission.
- `npm run dev:full` to run the web dev server and API together locally with one command.

### Fixed
- NativeWind's babel plugin was missing, silently breaking all `className` styling app-wide; restored, and pinned `tailwindcss` to the last version compatible with NativeWind v2's synchronous PostCSS pipeline.
- Web deploy target conflict (GitHub Pages config present alongside a stale `vercel.json`); confirmed GitHub Pages via the connected remote, removed `vercel.json`, fixed the build's base-path mechanism (`experiments.baseUrl` instead of a nonexistent `expo export --public-url` flag).
- `apiClient.ts` read `process.env.API_URL` in a way that never resolved in the client bundle; fixed to use the statically-inlined `EXPO_PUBLIC_API_URL`.
- Test tooling was non-functional (missing `jest-expo` preset, a deprecated `jest-native` import); fixed so `npm test` actually runs.
- `npm run lint` crashed outright on a resolver/peer-dependency conflict; `npm run build:web` failed on missing `expo-router` peer dependencies. Both fixed.
- `package-lock.json` was never committed, so `npm ci` (used by CI) failed from a clean checkout.
- The first real CI/CD run surfaced two more bugs no local check had caught: root `tsconfig.json`/`.eslintrc.js` had no exclusion for `server/`, so the frontend's typecheck and lint steps failed trying to resolve the backend's separate dependencies; and `cd-pages.yml` failed to push to the `gh-pages` branch because the default `GITHUB_TOKEN` needs an explicit `contents: write` permission grant. Both fixed and reverified in a clean containerized checkout matching the CI runner exactly.

## [1.0.0] - 2025 (initial commit)
- Initial application: Expo Router app with auth, chat, profile, and settings modules.
