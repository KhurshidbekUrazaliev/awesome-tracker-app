# Changelog

All notable changes to this project are documented here. Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [2.0.0] - 2026-09-05

### Changed
- **Upgraded Expo SDK 50 → 57** (React Native 0.73 → 0.86, React 18 → 19, TypeScript 5.3 → 6.0), via `npx expo install expo@^57.0.0` + `npx expo install --fix`. Breaking changes this surfaced and fixed:
  - `app.config.ts`: the top-level `splash` config was removed from `ExpoConfig` (SDK 53+) in favor of the `expo-splash-screen` config plugin; migrated accordingly. Also added the now-required `expo-status-bar` plugin entry.
  - `expo-notifications`: `setNotificationHandler`'s behavior object now requires `shouldShowBanner`/`shouldShowList`; `scheduleNotificationAsync`'s trigger now requires an explicit `type` (`SchedulableTriggerInputTypes.TIME_INTERVAL`); `removeNotificationSubscription` was removed in favor of calling `.remove()` on the subscription itself (`hooks/useNotifications.ts`, `services/notificationService.ts`).
  - `@expo/vector-icons` is no longer transitively bundled by `expo` — added as an explicit direct dependency.
  - `expo-linear-gradient`'s `colors`/`locations` props now require a non-empty tuple type rather than `string[]`/`number[]` (`app/index.tsx`).
  - `useRef()` with no initial value no longer type-checks under the updated `@types/react`; fixed in `hooks/useNotifications.ts`.
  - `eslint-config-expo@57` pulls in `@typescript-eslint` v8 (bumped from v6) and a stricter `eslint-plugin-react-hooks`, which caught two real pre-existing issues in `modules/chat/hooks/useChat.ts` (data-loading functions referenced before their declaration — reordered as `useCallback`s) and one in `hooks/useNetwork.ts` (synchronous `setState` in an effect with no external dependency — moved into the `useState` initializers instead).
  - `jest-expo@57` requires the split-out `@react-native/jest-preset` package; added as a devDependency.
  - Removed the now-unnecessary `@types/react-native` stub (react-native ships its own types).
  - Bumped the frontend CI/CD jobs (`ci.yml`, `cd-pages.yml`) from Node 18 to Node 22 — React Native 0.86 requires Node ^20.19.4/^22.13.0+, which Node 18 no longer satisfies.
  - `nativewind` stays pinned at v2.0.11 (with its existing `patch-package` patch) — verified it still compiles `className` correctly and the light/dark toggle still works under React 19/RN 0.86 via a local static build; a v4 migration was not needed.
  - Verified: clean typecheck/lint/test, a successful `expo export -p web`, and a visual check of both themes in a browser (styling, the photo hero, and dark-mode toggling all intact).

## [1.6.0] - 2026-09-05

### Added
- **Real photography in the home screen hero** (`app/index.tsx`), replacing the flat gradient with four bundled photos (`assets/hero/`), each given one distinct role so nothing repeats across the app:
  - `nabawi-sunset.jpg` — full-bleed signed-out hero background.
  - `clocktower-sky.jpg` — the circular seal medallion overlapping the content card.
  - `mosque-interior.jpg` — a small rotated "floating photo" card resting above the card, echoing the floating-marker language from the 1.5.0 design.
  - `clocktower-twin.jpg` — the signed-in dashboard banner background.
  - A theme-aware scrim (`HERO_SCRIM`, transparent at the top, resolving to the theme's own flat color at the bottom) sits over each photo so it blends seamlessly into the card/surface below in both light and dark mode, rather than needing a synthetic glow.
  - The top nav row (brand mark, theme toggle) now always renders in a fixed white-on-photo style, since it sits on a real photo rather than a flat surface — decoupled from the light/dark toggle, matching how the reference design keeps hero nav legible regardless of theme.
  - **Caught and fixed a web-specific layout bug during verification**: an absolutely-positioned `<Image>` (a replaced element) doesn't stretch to fill via `inset: 0` alone on web the way a plain `View`/gradient does — it rendered at its native pixel dimensions instead of covering the hero. Fixed by adding explicit `width: '100%', height: '100%'` alongside the absolute-fill style for both full-bleed photos.
  - Verified visually across all four combinations (signed-out/signed-in × light/dark) via a local static build.

## [1.5.1] - 2026-09-05

### Fixed
- **Home screen hero ignored the theme toggle**: the 1.5.0 redesign hardcoded the hero's `LinearGradient` to a fixed navy→violet gradient regardless of `isDark`, so switching light/dark only changed the sun/moon icon — the hero itself never visibly responded. Fixed by keying the gradient (and the glow-orb colors/opacities) off `isDark`: dark now resolves to a genuinely near-black navy (`#04050b → #0a0e1a → #1b1030`, violet only as a faint top-corner accent glow) and light to a clean white with the faintest violet tint (`#ffffff → #f8f7ff → #f0ecfe`), on both the signed-out hero and the signed-in dashboard banner.
  - Verified visually in both directions for both auth states (signed-out hero, signed-in dashboard) via a local static build: dark reads black-navy dominant with violet strictly as accent; light reads white with dark text and violet accents; no purple-dominant wash in either mode.

## [1.5.0] - 2026-09-05

### Added
- **Redesigned home screen** (`app/index.tsx`), both signed-out and signed-in states, as a full-bleed hero: a navy→violet diagonal gradient (`expo-linear-gradient`), soft layered glow orbs for depth, a floating glass icon button (`expo-blur`) for the theme toggle, and a large low-opacity brand-mark watermark filling the hero so it reads as designed rather than empty.
  - Signed-out: an overlay card (eyebrow tag, headline, subcopy, Get Started/Sign In) with a "Secure" seal badge overlapping its top-right corner.
  - Signed-in: a gradient banner (avatar + greeting) flowing into a lifted content card with three icon-tile Quick Actions (real `@expo/vector-icons` glyphs in colored badges, replacing the old plain emoji-prefixed rows) and a lower-weight text-link Log out instead of a full-width danger button.
  - `app/_layout.tsx`: hid the native Stack header for `index` so the hero runs fully edge-to-edge from the very top, using `useSafeAreaInsets` to pad the custom nav row correctly instead.
  - Along the way: confirmed NativeWind's `className` transform only applies to `react-native`/`react-native-web` components by default (not third-party ones like `BlurView`/`LinearGradient`) — styled those via a plain `View` wrapper instead of relying on a babel allowlist change.

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
