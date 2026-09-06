# Changelog

All notable changes to this project are documented here. Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [2.15.0] - 2026-09-06

### Added
- **Location & proximity enforcement (Stage 8)**: users and listings now carry a real location (lat/lng + city/region/country), and the 5 physical-handoff listing types (give_away/exchange/trial/rental/auction) require one before a request/booking/bid can go through — blocked with a clear message if the two parties are over 75km apart (configurable via `MAX_TRANSACTION_DISTANCE_KM`) or if either side hasn't set a location. Distance enforcement, deliberately, not a country check — correctly blocks continent-scale distances without incorrectly blocking legitimate near-border meetups. Geocoding via Nominatim (OpenStreetMap), free/no API key, with a server-wide outbound throttle and cache so as not to violate its usage policy. New `components/LocationField.tsx`/`.web.tsx` (native GPS via `expo-location`, web via `navigator.geolocation`, both with a manual city-search fallback), a new Settings → Location screen, and a "Near me" distance-sort chip on the browse feed. Raw coordinates are never exposed to anyone but their own owner — everyone else gets a city/country summary plus a computed distance. New migration `0009_regular_captain_cross.sql`.

## [2.14.1] - 2026-09-06

### Fixed
- **A bid could win an already-closed auction.** `placeBid`'s raw-SQL `WHERE` clause combined an `AND` chain with an unparenthesized `OR` — SQL's operator precedence let `current_bid_cents < amount` alone satisfy the whole clause, bypassing the `status='open'` and deadline checks entirely. Found via a real bid landing on a `pending` auction during end-to-end verification. Fixed by wrapping the `OR` expression in one more pair of parens.

### Verified
- **Stage 5 end-to-end, with real Stripe test-mode transactions**: auction creation, bidding (including a concurrency test confirming exactly one of two simultaneous equal bids wins), the interest-flow guard, deadline closing via the lazy on-read fallback, the synthetic accepted-interest handoff into the generic completion/review pipeline, payment-gated completion, a real hosted Stripe Checkout payment, and a real payout transfer to the owner's connected account — all confirmed working live. Also confirmed the no-bids path closes correctly without unlocking reviews.

## [2.14.0] - 2026-09-06

### Added
- **Stage 5: auction listings**, reusing Stage 4's Stripe Connect integration as-is. New `auction` listing type with a starting bid and deadline; bidding is a single atomic transaction so concurrent bids and last-second deadline sniping are both handled safely with no special isolation level. Unlike rentals, auctions don't get their own bespoke booking table — closing an auction inserts a synthetic already-accepted row into the existing generic interest system for the highest bidder, so the whole existing completion/review pipeline works unmodified. This app's first background job: a 60-second in-process sweep closes expired auctions (plus a lazy on-read fallback so a missed tick, e.g. the free-tier instance asleep, never breaks correctness — only delays a notification). Winner-only Stripe Checkout for payment capture, sharing the existing webhook route (now branching on session metadata) with an immediate payout to the owner on payment (no deposit to hold, unlike a rental). New migration `0008_needy_professor_monster.sql`.

## [2.13.1] - 2026-09-06

### Fixed
- **Stripe Connect onboarding rejected native return/refresh URLs.** Account Links (unlike Checkout Sessions) require real `https://` URLs — a `try://settings` custom scheme from `Linking.createURL()` failed with `return_url_invalid`. Native now uses the deployed web origin instead.
- **Rental Checkout Sessions failed on newer Stripe accounts** with "the product tax code is missing" — those accounts default to Managed Payments (Stripe as merchant of record), which is incompatible with this app's collect-then-transfer model. Explicitly disabled (`managed_payments: { enabled: false }`) on the rental Checkout Session.

### Verified
- **Stage 4 end-to-end, with real Stripe test-mode transactions**: rental listing → booking request/accept → hosted Stripe Checkout payment (test card) → webhook-confirmed booking → owner payout transfer → deposit refund, all working live with a real connected test account that completed bank-account linking.

### Known gap
- The "Payouts" status in Settings never shows onboarding as complete, even once it genuinely is — the webhook destination's event scope is "Your account" only, not "connected accounts," so Stripe never sends `account.updated` for a connected account's capability changes. Fixing this needs a second webhook destination (new signing secret required); deferred since it only affects a status indicator, not real payments or payouts.

## [2.13.0] - 2026-09-06

### Added
- **Stage 4: rental listings with Stripe Connect** — the payment provider decision that had blocked this stage since the project began is now made (Stripe Connect, confirmed in the user's dashboard). New `rental` listing type with per-day pricing and an optional refundable deposit; a dedicated `rentalBookings` table tracks each booking's own lifecycle (`requested` → `accepted` → `confirmed` (paid) → `completed`) separately from the listing itself, since a rental listing stays open indefinitely for repeat bookings — a deliberate deviation from how every other listing type works. New `RentalAvailabilityCalendar` component for date-range selection. Stripe Connect Express onboarding lives under a new "Payouts" row in Settings; a new webhook route confirms payment and tracks onboarding completion. On completion, the owner is paid out (minus a configurable `PLATFORM_FEE_PERCENT`, defaulting to 0) and the deposit is refunded or partially claimed, trust-based with no arbitration UI. New migration `0007_melted_king_cobra.sql`.
  - Known follow-up: rentals can't be reviewed yet (the existing review flow triggers off `listing.status === 'completed'`, which a rental listing never reaches by design).

## [2.12.0] - 2026-09-06

### Added
- **Reputation category breakdown and badges** — flagged as "not yet done" back when Stage 2 shipped. `GET /api/reviews/users/:userId` now also returns `byType` (average rating + review count per listing type — e.g. a separate average for "Give away" vs "Lesson") and `badges`, four thresholds computed from completed-listing counts by type plus overall rating: Generous Giver (10+ give-aways completed), Mentor (5+ lessons), Trusted Trader (10+ exchanges), Five-Star (5+ reviews averaging 4.5+). New `countCompletedListingsByType` in `listingsRepo.ts`; shown on the profile screen below the star rating. Query-only, no migration.

## [2.11.0] - 2026-09-06

### Added
- **Native date/time picker for Room reminders/events**, replacing the plain-text "YYYY-MM-DD HH:MM" input — the last flagged gap for Stage 6. New `components/DateTimeField.tsx` uses `@react-native-community/datetimepicker` (inline `datetime` mode on iOS; chained date-then-time `DateTimePickerAndroid.open()` dialogs on Android, since Android's native picker only supports one mode at a time), with a `DateTimeField.web.tsx` override rendering a real `<input type="datetime-local">`. Verified: correct native module resolution per platform (checked both compiled bundles), and on web, the exact request payload the picker produces was confirmed to create a room item with the correct `dueAt` end-to-end.



### Added
- **Search relevance ranking and trending categories** (Stage 7's last remaining "not started" item). Search now also matches `tags`, not just title/description. When a query is present, results are ranked by relevance (title match > tag match > description-only match) before falling back to recency; a plain browse keeps the existing newest-first order. New `GET /api/listings/trending-categories` (top categories by open-listing count) surfaces as tappable quick-filter chips on the browse feed. Query-only backend change, no migration.

### Fixed
- **Missing peer dependencies crashed the app outside the Metro dev environment.** `expo-doctor` flagged `expo-font` (required by `@expo/vector-icons`) and `react-native-worklets` (required by Reanimated 4, which split its native engine into a separate package since SDK 57) as missing. Installed both and registered the `expo-font` config plugin.
- **`expo-notifications` crashed on import in Expo Go (Android).** One of its internal modules registers a device-push-token listener as a top-level side effect — exactly what SDK 53 disallowed in Expo Go — so the crash happened at `import` time, before any in-app guard could run. `notificationService.ts` now does a genuinely conditional `require()` of the module, only outside Expo Go; every notification method degrades to a no-op/null inside it. `useNotifications.ts`'s type-only `import * as Notifications` was switched to `import type` for the same reason — an unused namespace import isn't reliably elided by Babel and was loading the module regardless.
- **GitHub Pages 404'd on any nested route** (a direct link, a refresh, a shared URL, or an occasional click racing ahead of hydration) — this is a single-page web export, so only `index.html` exists as a physical file. The Pages deploy now also copies it to `404.html`; GitHub Pages serves that for any unmatched path, letting the app's own router take over for whatever URL is already in the address bar.
- **The landing page's "Get Started"/"Sign In" buttons could fail to navigate on web.** `Button.tsx` wasn't wrapped in `React.forwardRef`, which `expo-router`'s `<Link asChild>` needs to reliably attach its merged href/onClick props to the child's underlying element. Every other `Link asChild` in the app wraps a plain `TouchableOpacity`, which already forwards refs correctly as a built-in RN component, so this only affected those two buttons.

## [2.9.0] - 2026-09-06

### Added
- **Calendar view for Rooms.** Every reminder/event across all of a user's rooms, in one month-grid view — closes the last "not built" gap flagged for Stage 6.
  - Backend: `GET /api/rooms/calendar` (`listCalendarItemsForOwner` in `server/src/db/roomsRepo.ts`) joins `room_items` to `rooms`, filtered to the caller's own rooms with `type IN (reminder, event)` and a non-null `dueAt`. Query-only addition — no migration needed.
  - Frontend: new `app/rooms/calendar.tsx`, a hand-built month grid (no calendar library) reached via a calendar icon in the "My Space" header. Days with items get a dot; tapping a day lists its items below the grid (icon, title, room name, time); tapping an item jumps to its room.
  - Verified: clean typecheck/lint, and the month-grid date math (`buildMonthGrid`, `dateKey`/`parseDateKey` round-trip) confirmed correct across a leap year (Feb 2028, 29 days) and a non-leap February (2027, 28 days) via direct execution.

## [2.8.0] - 2026-09-05

### Added
- **Multi-photo support for listings and room moments.** The `media[]` array field already supported multiple photos on both the DB and API side (Stage 1/6) — only the create/detail UI artificially capped it at one.
  - New `components/MultiPhotoPicker.tsx` (upload up to 5 photos, tap to remove) used by both `app/listings/create.tsx` and `app/rooms/add-item.tsx` (for `moment` items).
  - New `components/PhotoGallery.tsx` (a single full-width photo, or a horizontally-scrolling filmstrip when there's more than one) used by both `app/listings/detail.tsx` and `app/rooms/detail.tsx`.
  - Updated `docs/PRODUCT_PLAN.md` and the published plan artifact.
  - Verified: clean typecheck/lint/test, and a visual pass confirming the picker's empty state renders correctly in the create-listing flow.

## [2.7.0] - 2026-09-05

### Changed
- **The signed-in home screen is now the browse feed**, not a link to it. Closes out the one "not yet done" item flagged when Stage 1 shipped (`docs/PRODUCT_PLAN.md` §7: "the new home screen becomes the sharing/browse feed").
  - Extracted the browse/search/create UI from `app/listings/index.tsx` into a shared `modules/listings/components/ListingsFeed.tsx`, used by both the standalone `/listings` screen and the home screen.
  - `app/index.tsx`'s signed-in view: replaced the big hero + "Quick Actions" tile grid with a compact 128px photo-hero header (brand, Messages/My Space/Settings/theme-toggle icon buttons, avatar+greeting linking to Profile) directly above the feed.
  - Moved "Log out" from the home screen into `app/settings/index.tsx`, where it fits better now that home no longer has room for it.
  - Verified: clean typecheck/lint/test, and a visual pass on both themes plus the standalone `/listings` screen and the new Settings logout button.

## [2.6.0] - 2026-09-05

### Fixed
- **Push notifications never actually worked**, even before this session's changes: `useNotifications()` existed but was never called anywhere in the app, and the one place that did fetch a push token (`notificationService.getPushToken()`) only ever saved it to local `AsyncStorage` — it was never sent to the backend, so no push notification could ever have been delivered to a real device. Fixed both gaps.
  - Backend: new `pushToken` column on `users`. `POST /api/users/me/push-token` registers it. `server/src/utils/pushNotifications.ts` sends via Expo's push API — fire-and-forget, so a delivery failure (missing/invalid token, Expo's service being down) never breaks the action that triggered it.
  - Wired into real marketplace/room events: interest received on your listing, your interest accepted, a listing marked completed (prompts a review), and being added to a shared room.
  - Frontend: `app/_layout.tsx` now mounts a `PushNotificationSync` component for authenticated users, which calls `useNotifications()` — this is what actually requests permission and registers the token; previously the hook was simply dead code. `notificationService.registerPushToken()` sends the fetched token to the backend.
  - Updated `docs/PRODUCT_PLAN.md` and the published plan artifact: Stage 7 now also covers push notifications.
  - Verified: clean typecheck/lint/test, and a visual pass confirming the new `PushNotificationSync` mount doesn't break the app on web (expo-notifications logs an expected "not fully supported on web" warning there, not an error).

## [2.5.0] - 2026-09-05

### Added
- **Stage 7 (partial): admin moderation tooling.** Reports captured since Stage 2 were never surfaced anywhere — now viewable and actionable.
  - Backend: `resolved` column on `reports` (migration `0005_shallow_speedball.sql`). Admin access is granted purely by email via the new `ADMIN_EMAILS` env var — no DB role, no self-service way to grant it (`server/src/middleware/requireAdmin.ts`). `GET /api/admin/reports` (`server/src/routes/admin.ts`) resolves each report's actual target (listing title/status, or user name/email) so an admin doesn't have to cross-reference ids by hand; `POST /api/admin/reports/:id/resolve` and `POST /api/admin/listings/:id/close` take action.
  - Frontend: `app/admin/index.tsx` — deliberately not linked from any navigation (reached by URL only), since it's an internal tool, not a user-facing feature.
  - Updated `docs/PRODUCT_PLAN.md` and the published plan artifact: Stage 7 marked partially built, with search/discovery, push notifications, and app store submission explicitly flagged as not started (the last one isn't buildable in-session at all — it needs the user's own developer accounts).
  - Verified: clean typecheck/lint/test across app and server.

## [2.4.0] - 2026-09-05

### Added
- **Stage 6 of the roadmap: personal space ("Rooms")** — skipped ahead of Stages 4/5 (rentals, auctions), which are blocked on a payment-provider decision the user deferred.
  - Backend: new `rooms`, `room_members`, and `room_items` tables (migration `0004_freezing_marvel_apes.sql`). A single flexible `room_items` table — like `listings` — covers `note`, `link`, `reminder`, `event`, `wish`, `moment`, and `plan` (with an optional JSON checklist) rather than one table per type. `server/src/routes/rooms.ts`: CRUD for rooms and items, `GET /api/rooms/discover` for browsing public rooms (excludes blocked users, same as listings), and email-based member invites for `shared` rooms. Only the room owner can add/edit/delete items — visibility only controls who can *view*.
  - Frontend: new `modules/rooms/` (store/service/hooks, same conventions as `modules/listings/`). Screens: `app/rooms/index.tsx` (My Rooms / Discover tabs), `create.tsx` (name, description, visibility picker), `detail.tsx` (items list, inline email-invite for shared rooms), `add-item.tsx` (type-specific fields — URL for links, due date/time for reminders/events, a checklist builder for plans, photo upload for moments reusing the existing generic upload endpoint).
  - Home screen's Quick Actions gained a "My Space" tile, reflowed into a 3-row grid.
  - Updated `docs/PRODUCT_PLAN.md` and the published plan artifact to mark Stage 6 built and note the Stage 4/5 payment-provider gate explicitly.
  - Verified: clean typecheck/lint/test across app and server, and a visual pass on the new Quick Actions grid, My Space tabs, and create-room screen (including the visibility hint text changing per option).

## [2.3.0] - 2026-09-05

### Added
- **Stage 3 of the roadmap: trial listings.** A new `trial` listing type — a fixed try-period in days (`trialDays`) before returning the item. Reuses the existing express-interest → accept → complete lifecycle and chat for handoff coordination; no new mechanics were needed.
  - Backend: `trial_days` column on `listings` (migration `0003_bent_randall.sql`), validated server-side (required for `trial`, rejected for every other type, same pattern as `wantInReturn` for `exchange`).
  - Frontend: "Trial" type chip in the create form with a day-count field, a "Try it for up to N days" info box on the listing detail screen, and a type-aware CTA ("Ask to Try").
  - **Deliberately skipped** the "convert to rental" hook originally scoped for this stage — with no Rental type to convert into yet (Stage 4), building it now would just be dead UI. Deferred to Stage 4.
  - Updated `docs/PRODUCT_PLAN.md` and the published plan artifact to mark Stage 3 built.
  - Verified: clean typecheck/lint/test across app and server, and a visual pass on the new Trial chip and conditional day-count field.

## [2.2.0] - 2026-09-05

### Added
- **Stage 2 of the roadmap: trust & safety.**
  - Reputation summary on profiles (average rating + review count), built on Stage 1's reviews endpoint — `app/profile/index.tsx`, `modules/listings/hooks/useReputation.ts`.
  - Reporting a listing or user: new `reports` table, `POST /api/safety/reports` (`server/src/routes/safety.ts`). Captures the report only — no admin review UI yet, that's still Stage 7.
  - Blocking a user: new `blocks` table, `POST`/`DELETE /api/safety/blocks`. A blocked user's listings are filtered out of the blocker's browse feed (`listListings`'s new `excludeOwnerIds`). Manage blocked users at the new `app/settings/blocked.tsx`; report/block actions added to `app/listings/detail.tsx` (non-owner view only).
  - Migration `0002_smiling_shooting_star.sql`.
  - Verified: clean typecheck/lint/test across app and server, a real end-to-end pass against production (two test accounts, create/browse/block, cleaned up afterward), and a visual pass on the new Settings entry, Blocked Users screen, and profile reputation badge.
- Updated `docs/PRODUCT_PLAN.md` (and the published plan artifact) to mark Stages 1–2 built and resolve the "product name" and "repurpose vs. fresh repo" open decisions.

## [2.1.0] - 2026-09-05

### Added
- **Renamed the product to TrY** and pivoted its purpose: from a personal tracker app to a trust-first sharing platform. Full product spec at `docs/PRODUCT_PLAN.md` (also published as an artifact — see the session for the link).
  - Rebranding: `app.config.ts` (name, slug, scheme, iOS/Android bundle identifiers), `package.json` name, `README.md`, in-app branding text and hero copy in `app/index.tsx`. The GitHub repo itself stays `awesome-tracker-app` for now — a separate, deliberate decision not yet made.
- **Stage 1 of the roadmap: core free listings.** People can share an **Idea**, teach a **Lesson**, **Give away** something for free, or propose an **Exchange** — no money involved (that's deferred to later stages, pending a deliberate payment-provider choice).
  - Backend: new `listings`, `listing_interests`, and `reviews` tables (Drizzle migration `0001_low_legion.sql`); `server/src/routes/listings.ts` (CRUD, browse/search by type/category/keyword, express-interest / accept-interest / mark-completed flow) and `server/src/routes/reviews.ts` (post-completion star ratings tied to a real listing — no anonymous reviews, per the trust-first design principle).
  - Frontend: a new `modules/listings/` module (store/service/hooks, mirroring the existing chat module's conventions) and three screens — `app/listings/index.tsx` (browse/search/filter), `app/listings/create.tsx` (post a listing, with photo upload reusing the existing generic upload endpoint), `app/listings/detail.tsx` (express interest, owner accepts, mark completed, leave a review).
  - The home screen's Quick Actions gained a "Browse & Share" tile as the new primary entry point; a full home-screen takeover (making the browse feed itself the home screen) is left for a later polish pass, per the plan.
  - Verified: clean typecheck/lint/test across both the app and `server/`, a successful `expo export -p web`, and a visual pass on the rebrand plus the browse/create screens (including the error state when the API is unreachable, and the conditional "what would you like in return" field for Exchange listings).

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
