# Product Plan: TrY — A Trust-First Sharing Platform

**Status:** Draft v1 — name decided (**TrY**), Stages 1–3 and 6 built (including the full home-screen takeover), Stage 7 partially built (admin moderation tooling, push notifications). Stages 4–5 (rentals, auctions) remain blocked on a payment-provider decision.
**Purpose of this document:** A complete, standalone specification of the product so that any engineer or AI assistant picking this up — with zero prior context — can continue the build without re-deriving the vision from scratch.

---

## 1. Vision

A platform where people share what they have — ideas, knowledge, spare things, time — with each other, built around **trust, charity, and care** rather than profit-maximization. It is explicitly **not** a general-purpose social media feed (not "Instagram, but X"). Every other feature (personal notes, calendars, media) is secondary to this core sharing mechanic.

**One-sentence pitch:** A community marketplace for generosity — where people give away, teach, trade, lend, rent, and auction what they have, all backed by a real trust and reputation system.

### Guiding principles (apply these when making any product decision)
1. **Trust before transaction.** Every interaction should build a visible, persistent reputation. A user's history of good conduct is a first-class, visible part of their profile — not an afterthought bolted on later.
2. **Charity and care are default-visible.** Free give-away and exchange listings are not a lesser tier bolted onto a rental marketplace — they are equally prominent in discovery.
3. **Money is not required to participate.** A user should be able to have a full, valuable experience on the platform (giving, teaching, trading) without ever paying or charging anything.
4. **Slow, staged build.** Ship the free/trust-based core first. Defer anything requiring real payment processing until that core is proven and a payment provider is deliberately chosen (see Open Decisions).

---

## 2. Core Concepts & Data Model

### 2.1 User
Inherited from the existing codebase (this plan builds on top of an existing Expo/React Native + Express/Postgres app that already has this):
- Auth (JWT-based signup/login)
- Profile (name, avatar, bio)
- **New for this product:** a public **reputation summary** on every profile (rating average, count of completed exchanges, "goodness" history — see §4).

### 2.2 Listing — the central object
Every piece of shareable content is a **Listing**. A Listing has:

| Field | Description |
|---|---|
| `id` | unique identifier |
| `owner_id` | the user who created it |
| `type` | one of: `idea`, `lesson`, `give_away`, `exchange`, `trial`, `rental`, `auction` (see §3) |
| `title`, `description` | freeform text |
| `media[]` | photos/video attached (reuses existing Supabase Storage upload pipeline) |
| `category` / `tags[]` | for search and browse |
| `status` | `open`, `pending`, `completed`, `closed`/`expired` |
| `created_at`, `updated_at` | timestamps |
| type-specific fields | see §3 per type |

### 2.3 Trust & Reputation
A separate first-class system, not a field bolted onto Listing:
- **Review**: left by one user about another, tied to a specific completed Listing interaction. Has a star rating (1–5) and a short text comment.
- **Reputation summary**: computed per user — average rating, total completed interactions, and a breakdown by listing type (e.g., "12 successful give-aways, 3 rentals returned on time").
- **Verification** (later stage): optional identity/phone verification badge to increase trust for higher-stakes interactions (rentals, trials).

### 2.4 Messaging
Reuses the existing chat system already in the codebase (conversations, messages, unread tracking) to let two users coordinate a handoff once they've connected on a Listing. No new messaging system needed.

### 2.5 Personal Space ("Rooms") — secondary feature
Everything from the earlier brainstorm (notes, media, links, ideas, reminders, calendar, wishes, moments, plans, checklists) lives here. A user's personal space is organized into **Rooms**, each with a privacy level (private / shared with specific people / public). This is explicitly **not** the app's homepage or primary value proposition — it's a supporting feature for users who want a personal workspace alongside the sharing marketplace. Build this **after** the core sharing mechanic (Stage 6, see §5).

---

## 3. Listing Types — Detailed Spec

| Type | Money involved? | Core mechanic |
|---|---|---|
| **Idea** | No | A freeform post — a thought or concept. Others browse, comment, save. No transaction/completion state. |
| **Lesson** | No | Structured "teach something" content on a topic. Searchable by subject. Optionally has steps/sections. Others can save/bookmark. |
| **Give away** | No | Pure charity. Owner offers an item for free. Interested users request it; owner picks one and marks it `completed`. |
| **Exchange** | No (barter) | Owner offers item/skill A, wants item/skill B in return. Other users submit trade proposals; owner accepts one. |
| **Trial** | Usually free, sometimes a small refundable deposit | Owner lets someone borrow/use an item for a short, fixed period **purely to try it** — not a commitment to rent or buy. Can optionally convert into a Rental afterward if both sides agree. |
| **Rental** | Yes | Owner lists an item available for rent at a price per duration (day/week). Requires an availability calendar and a defined pickup/return flow. **Requires payment integration — deferred to Stage 4.** |
| **Auction** | Yes | Owner lists an item for bidding with a deadline. Highest bid at deadline wins. — see Stage 5. |

### Lifecycle (applies to all transactional types — give away, exchange, trial, rental, auction)
`open` → (someone expresses interest / bids / proposes trade) → `pending` (owner and requester coordinate via chat) → `completed` (both sides confirm) → **both sides leave a review of each other**, feeding into the Trust & Reputation system.

---

## 4. Trust & Reputation System (detail)

This is the feature that most differentiates this platform from a plain classifieds site, and should be built with real care, not an afterthought:

- After every `completed` Listing interaction, **both parties** are prompted to rate and review each other.
- A user's profile shows: overall rating, total completed interactions, and category breakdown.
- **No anonymous reviews** — reviews are tied to a real completed interaction, preventing fake reviews.
- (Later stage) A **"Goodness" score or badge** — a visible, gamified signal that highlights especially generous/trustworthy users (e.g., a badge for "10+ free give-aways completed"), reinforcing the platform's charity-first ethos in a way pure star ratings don't capture.
- (Later stage) Optional identity verification badge for users who want to build extra trust for higher-stakes rentals.

---

## 5. Staged Roadmap

Each stage should be fully working, tested, and deployed before starting the next — do not parallelize stages.

### Stage 1 — Core free listings (no payments) — ✅ Built
- Data model: `Listing` table + type-specific fields for `idea`, `lesson`, `give_away`, `exchange` only (`server/src/db/schema.ts`).
- Create/edit/delete a listing, with media upload (reuse existing Supabase Storage) — `server/src/routes/listings.ts`, `app/listings/create.tsx`. Supports up to 5 photos (`components/MultiPhotoPicker.tsx`, `components/PhotoGallery.tsx` for display — shared with Rooms' "moment" items).
- Browse/search by category and keyword — `app/listings/index.tsx`.
- Basic interaction flow: express interest / propose a trade → owner accepts → mark completed — `app/listings/detail.tsx`.
- Basic star rating + review (`server/src/routes/reviews.ts`, `server/src/db/reviewsRepo.ts`), shown on the listing detail screen once completed.
- **Explicitly out of scope for Stage 1 (not built yet):** trial, rental, auction, payments, verification badges, personal Rooms.
- ✅ **Home screen takeover done**: `app/index.tsx`'s signed-in view now embeds the browse feed directly (`modules/listings/components/ListingsFeed.tsx`, shared with the standalone `/listings` screen) behind a compact photo-hero header — brand, Messages/My Space/Settings/theme-toggle icons, and an avatar+greeting that links to Profile. "Log out" moved to the Settings screen. This was the one "not yet done" item called out below at the time Stage 1 shipped.

### Stage 2 — Trust & safety deepening — ✅ Built
- Reputation summary on profiles (average rating + review count) — `server/src/routes/reviews.ts` (already built in Stage 1), `app/profile/index.tsx`, `modules/listings/hooks/useReputation.ts`.
- Reporting a listing or user — `reports` table, `server/src/routes/safety.ts` (`POST /api/safety/reports`). Captures the report only; no admin review UI yet (that's still Stage 7).
- Blocking a user — `blocks` table, `server/src/routes/safety.ts` (`POST`/`DELETE /api/safety/blocks`). A blocked user's listings are filtered out of the blocker's browse feed (`listListings`'s `excludeOwnerIds`). Manage blocked users at `app/settings/blocked.tsx`; report/block actions live on `app/listings/detail.tsx`.
- ✅ **Reputation category breakdown and badges done**: `GET /api/reviews/users/:userId` now also returns `byType` (average rating + count per listing type reviewed, e.g. separate averages for "Give away" vs "Lesson") and `badges` — four thresholds computed from completed-listing counts by type plus overall rating: Generous Giver (10+ give-aways), Mentor (5+ lessons), Trusted Trader (10+ exchanges), Five-Star (5+ reviews averaging 4.5+). Shown on the profile screen below the star rating.

### Stage 3 — Trial listings — ✅ Built
- New `trial` type: a fixed try-period in days (`trialDays`), reusing the existing express-interest → accept → complete lifecycle and chat for handoff coordination — no new mechanics needed.
- **Skipped the "convert to rental" hook** originally scoped here — with no Rental type to convert into yet (that's Stage 4), building it now would just be dead UI. Deferred entirely to Stage 4, when there's something real to wire it to.

### Stage 4 — Rental listings (payments, part 1) — ✅ Built and fully verified
- **Payment provider decided: Stripe Connect** (2026-09-06) — see §6.
- New `rental` listing type: `pricePerDayCents`/`depositAmountCents`/`currency` on `listings`, plus a dedicated `rentalBookings` table (not an extension of `listingInterests` — a rental listing stays `open` indefinitely for repeat bookings, unlike every other type). Booking lifecycle: `requested` → `accepted` (owner approves, backend re-checks for a date-overlap conflict) → `confirmed` (paid — a Stripe Checkout Session, charged to the platform's balance, not destination-charged) → `completed` (owner settles: transfers the rental fee to the owner's connected account minus `PLATFORM_FEE_PERCENT`, and either refunds the deposit in full or lets the owner claim part/all of it — no arbitration UI, trust-based like the rest of the app).
- Stripe Connect Express onboarding: `POST/GET /api/payments/connect/*`, a "Payouts" row in Settings.
- `POST /api/stripe/webhook` confirms payment (`checkout.session.completed`) and tracks onboarding completion (`account.updated`) — mounted with `express.raw()` ahead of the app's global JSON body parser, the one new wiring point this required.
- Availability calendar: new `components/RentalAvailabilityCalendar.tsx` (date-range selection, forked from the Rooms calendar's month-grid math, not shared — that component's single-day-dot data model doesn't fit ranges).
- **Not yet done**: reviews after a completed rental (the existing review flow is keyed off `listing.status === 'completed'`, which rentals never reach by design — this is a real, scoped follow-up, not an oversight). No automated dispute arbitration for deposit claims, by design (trust-first, same as the rest of the app).
- ✅ **End-to-end verified with real Stripe test-mode transactions (2026-09-06)**: created a rental listing, requested/accepted a booking, completed a real hosted Stripe Checkout payment with a test card, and confirmed the `checkout.session.completed` webhook correctly flipped the booking to `confirmed` — proving out the trickiest part (raw-body signature verification) live. Two real bugs were found and fixed this way: (1) Stripe Account Links reject custom URL schemes for `return_url`/`refresh_url` on native — now uses the deployed web origin instead of `Linking.createURL()`; (2) newer Stripe accounts default to "Managed Payments" (Stripe as merchant of record), which requires a tax code on every Checkout line item — incompatible with this app's collect-then-transfer model, so it's now explicitly disabled (`managed_payments: { enabled: false }`) on the rental Checkout Session.
- ✅ **Payout step verified too**: once the connected test account finished bank-account linking by hand (Stripe's bank-details form runs in a cross-origin iframe that doesn't accept automated browser input, confirmed by trying direct click, typed input, and tab-navigation — none registered; it needed a real click-through), the same booking's `complete` call succeeded for real: `stripe.transfers.create()` paid the rental fee to the owner's connected account, and the deposit was refunded, both confirmed via the booking's final `status: 'completed'`, `depositResolution: 'refunded'`.
- **Known gap found during verification**: the "Payouts" status shown in Settings (`stripeOnboardingComplete`) never flips to true, even after a real owner finishes onboarding and payouts genuinely work. Root cause confirmed in the Stripe dashboard: the `try-rentals-api` webhook destination's "Events from" is scoped to "Your account" only, not "Your account and connected accounts" — so Stripe never sends `account.updated` for a connected Express account's capability changes (confirmed: zero such events exist in the account's event log for either connected account created this session, only two unrelated `account.updated` events for the platform account itself from before this work began). This scope can't be edited on an existing endpoint; fixing it needs a second webhook destination scoped to connected accounts, which mints a new signing secret — deferred for now since it only affects a status indicator, not actual payments or payouts.

### Stage 5 — Auction listings (payments, part 2) — 🔶 Built, pending live verification
- **Reuses Stage 4's Stripe Connect integration as-is** — no new payment-provider decision needed.
- New `auction` listing type: `startingBidCents`/`auctionEndsAt`/`currentBidCents`/`currentBidderId`/`stripeCheckoutSessionId`/`stripePaymentIntentId` on `listings`, plus an `auctionBids` table that's pure audit history — unlike rental, an auction does **not** get its own bespoke booking-style status machine. Instead, closing an auction inserts a synthetic *already-accepted* row into the existing `listingInterests` table for the highest bidder and moves the listing to `pending` — from there it rejoins the same generic `open → pending → completed → review` pipeline every other non-rental type already uses (verified this reuses `findAcceptedInterest`/`POST /:id/complete`/the review flow with zero changes to any of them, since none of that code cares how an accepted interest row was created).
- Bidding: `POST /:id/bids` is a single atomic `UPDATE ... WHERE` (bid must beat the current price *and* the deadline must not have passed) inside a transaction with the audit-log insert — this is what makes bid races and last-second deadline sniping both safe without needing a stricter isolation level.
- **New: this app's first background job.** Nothing here ever ran on a timer before — closing an expired auction needs to happen without anyone visiting it. Chose an in-process `setInterval` (60s, `server/src/index.ts`) over a separate Render Cron Job service, since the correctness-critical part (a bid can never win after its deadline) is already enforced at the database-write level regardless of when the sweep runs — plus a lazy on-read fallback in `GET /api/listings/:id` that closes an expired auction inline whenever anyone views it, covering the case where the free-tier instance was asleep and missed ticks. Net effect: an expired-but-untouched auction can look stale with zero traffic, but nothing can bid on or win it during that window, so the staleness is cosmetic, not a correctness bug.
- Payment capture: winner-only `GET /:id/auction-checkout-url` (Stripe Checkout, same `managed_payments: { enabled: false }` requirement as rentals), the shared webhook route branches on `session.metadata.type` (`'auction'` vs. `'rental'`). Unlike a rental deposit, there's nothing to hold — the owner is paid out (minus `PLATFORM_FEE_PERCENT`) the moment the winner's payment is confirmed, not at completion.
- **One gap the interest-pipeline reuse would otherwise create, closed explicitly**: the generic `POST /:id/complete` has no payment awareness (correctly, since give_away/exchange/trial never involve money) — for auctions it now additionally requires `stripePaymentIntentId` to be set, so an owner can't unlock reviews before the winner has actually paid.
- **Pending**: end-to-end verification with real Stripe test-mode keys (same style as Stage 4's), and the frontend hasn't been exercised in a browser yet.

### Stage 6 — Personal space ("Rooms") — ✅ Built
- Built as a single flexible `room_items` table (like `listings`), not one table per content type: `note`, `link`, `reminder`, `event`, `wish`, `moment`, `plan` (with an optional checklist) all share the same few fields (title/content/url/media/dueAt/checklist).
- Sharing controls: private / shared (invite specific people by email) / public (discoverable — `GET /api/rooms/discover`, excludes blocked users' rooms same as listings). Only the room owner can add/edit/delete items; visibility only controls who can *view*.
- Frontend: `app/rooms/index.tsx` (My Rooms / Discover tabs), `create.tsx`, `detail.tsx` (items list, inline email-invite for shared rooms), `add-item.tsx` (type-specific fields, checklist builder for plans, photo upload for moments reusing the existing upload endpoint).
- Home screen gained a "My Space" quick-action tile.
- ✅ **Multi-photo support** (shared with listings, see below): moments now support up to 5 photos via `components/MultiPhotoPicker.tsx` and `components/PhotoGallery.tsx` — the `media[]` array field already supported this on both the DB and API side; only the create/detail UI artificially capped it at one.
- ✅ **Calendar view**: cross-room month-grid view of every reminder/event, reached via a calendar icon in the "My Space" header (`app/rooms/calendar.tsx`). Backed by `GET /api/rooms/calendar` (`listCalendarItemsForOwner` in `server/src/db/roomsRepo.ts`), which joins `room_items` to `rooms` filtered to `type IN (reminder, event)` with a non-null `dueAt`, across all rooms the caller owns — query-only addition, no schema change. Tapping a day shows that day's items below the grid; tapping an item jumps to its room.
- ✅ **Native date/time picker**: `components/DateTimeField.tsx` (iOS/Android via `@react-native-community/datetimepicker` — inline `datetime` mode on iOS, chained date-then-time `DateTimePickerAndroid.open()` dialogs on Android) with a `DateTimeField.web.tsx` override rendering a native `<input type="datetime-local">`. Replaces the old plain-text "YYYY-MM-DD HH:MM" input for reminder/event `dueAt` in `app/rooms/add-item.tsx`. This closes the last flagged gap for Stage 6 — nothing outstanding.

### Stage 7 — Polish & launch — 🔶 Partially built
- ✅ **Admin moderation tooling**: reports (from Stage 2) were being captured but never surfaced anywhere — now viewable and actionable. Admin access is granted purely by email via the `ADMIN_EMAILS` env var (no DB role, no self-service grant path — see `server/src/middleware/requireAdmin.ts`). `GET /api/admin/reports` resolves each report's actual target (listing title/status, or user name/email) so an admin doesn't have to cross-reference ids by hand; `POST /api/admin/reports/:id/resolve` and `POST /api/admin/listings/:id/close` take action. Frontend: `app/admin/index.tsx` — deliberately not linked from any navigation (reached by URL only), consistent with it being an internal tool, not a user-facing feature.
- ✅ **Search/discovery improvements**: search now also matches tags (previously title/description only), and results are ranked by relevance (title match > tag match > description-only match) instead of pure recency when a query is present — a plain browse (no query) keeps the newest-first order. New `GET /api/listings/trending-categories` (top categories by open-listing count) surfaces as tappable quick-filter chips on the browse feed.
- ✅ **Push notifications**: `useNotifications()` existed in the original tracker app but was never actually called anywhere, and the fetched push token was only ever saved to local `AsyncStorage` — never sent to the backend, so no push could ever have been delivered. Fixed both gaps: a `pushToken` column on `users`, `POST /api/users/me/push-token` to register it, and `app/_layout.tsx` now mounts `useNotifications()` for authenticated users, which registers the token after requesting permission. `server/src/utils/pushNotifications.ts` sends via Expo's push API (fire-and-forget — a delivery failure never breaks the action that triggered it), wired into: interest received on your listing, your interest accepted, listing completed (prompts a review), and added to a shared room.
- ⬜ App Store / Google Play submission — **not something buildable in-session**: needs the user's own Apple Developer / Google Play Developer accounts, app signing, store listing metadata, and a review process. Flagging this explicitly so a future session doesn't assume it's just more code.

---

## 6. Open Decisions (not yet made — flag these before continuing)

1. ~~**Product name.**~~ **Decided: TrY.** Reflected in `app.config.ts` (name/slug/scheme/bundle id), `package.json`, and the in-app branding. Note: the GitHub repo itself is still named `awesome-tracker-app` — renaming the repo/deploy URLs is a separate, deliberate decision not yet made (see `app.config.ts` comment on `experiments.baseUrl`).
2. ~~**Repurpose the existing codebase, or start fresh?**~~ **Decided: repurposed.** Stage 1 was built directly on top of the existing "AwesomeProject" codebase (auth, profile, chat, Supabase/Render/GitHub Pages pipeline all reused as-is).
3. ~~**Payment provider** for Stage 4/5 (rentals, auctions).~~ **Decided: Stripe Connect** (2026-09-06), for marketplace payouts between users. Stage 4 build is now unblocked.
4. **Moderation policy** for public listings and lessons — what's disallowed, and whether moderation is manual (admin review queue) or automated, is not yet decided (deferred to Stage 2 at the earliest).
5. **Verification** requirements (phone/ID) for trial/rental — not yet decided whether this is required or optional.

---

## 7. Technical Foundation (inherited, already built)

This product is being built on top of an existing working codebase, not from scratch:
- **Frontend:** Expo (React Native) + Expo Router, targeting iOS, Android, and Web from one codebase. NativeWind (Tailwind for React Native) for styling, with a working light/dark theme system.
- **Backend:** Express + TypeScript, JWT auth, Postgres via Drizzle ORM, deployed on Render.
- **Storage:** Supabase (Postgres DB + file storage for media/avatars).
- **CI/CD:** GitHub Actions (typecheck/lint/test/build on every push), auto-deploy to GitHub Pages (web) and Render (API).
- **Existing features to reuse directly:** auth, user profiles, avatar/media upload, 1:1 chat/messaging, light/dark theme.
- **Existing features to remove/repurpose:** the current home screen and its "personal tracker" framing — the new home screen becomes the sharing/browse feed described in this plan.

---

## 8. Non-Goals (explicitly out of scope)

- This is **not** a general social media feed (no algorithmic content feed like Instagram/TikTok).
- This is **not** a profit-maximizing marketplace — pricing/fees should never be the platform's primary incentive design.
- Real-money auctions/rentals are **not** in scope until Stage 4/5, and not without a deliberate payment-provider decision first.
