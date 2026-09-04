# Changelog

All notable changes to this project are documented here. Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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

## [1.0.0] - 2025 (initial commit)
- Initial application: Expo Router app with auth, chat, profile, and settings modules.
