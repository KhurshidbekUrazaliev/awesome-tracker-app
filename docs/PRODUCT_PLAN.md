# Product Plan: TrY — A Trust-First Sharing Platform

**Status:** Draft v1 — name decided (**TrY**), Stages 1–2 built.
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
| **Auction** | Yes | Owner lists an item for bidding with a deadline. Highest bid at deadline wins. **Requires payment integration — deferred to Stage 5.** |

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
- Create/edit/delete a listing, with media upload (reuse existing Supabase Storage) — `server/src/routes/listings.ts`, `app/listings/create.tsx`.
- Browse/search by category and keyword — `app/listings/index.tsx`.
- Basic interaction flow: express interest / propose a trade → owner accepts → mark completed — `app/listings/detail.tsx`.
- Basic star rating + review (`server/src/routes/reviews.ts`, `server/src/db/reviewsRepo.ts`), shown on the listing detail screen once completed.
- **Explicitly out of scope for Stage 1 (not built yet):** trial, rental, auction, payments, verification badges, personal Rooms.
- **Not yet done:** the home screen still shows the old "Quick Actions" tile layout with a "Browse & Share" entry point, rather than fully becoming the browse feed itself (see §7 "Remove / repurpose"). Full home-screen takeover is left for a later polish pass.

### Stage 2 — Trust & safety deepening — ✅ Built
- Reputation summary on profiles (average rating + review count) — `server/src/routes/reviews.ts` (already built in Stage 1), `app/profile/index.tsx`, `modules/listings/hooks/useReputation.ts`.
- Reporting a listing or user — `reports` table, `server/src/routes/safety.ts` (`POST /api/safety/reports`). Captures the report only; no admin review UI yet (that's still Stage 7).
- Blocking a user — `blocks` table, `server/src/routes/safety.ts` (`POST`/`DELETE /api/safety/blocks`). A blocked user's listings are filtered out of the blocker's browse feed (`listListings`'s `excludeOwnerIds`). Manage blocked users at `app/settings/blocked.tsx`; report/block actions live on `app/listings/detail.tsx`.
- **Not yet done:** full category breakdown on the reputation summary (currently just average + count, not broken down by listing type as originally scoped) and reputation badges. Left for a later polish pass alongside the home-screen takeover noted in Stage 1.

### Stage 3 — Trial listings
- New `trial` type: fixed try-period, handoff coordination via chat, "convert to rental" hook (inert until Stage 4 ships).

### Stage 4 — Rental listings (payments, part 1)
- **Requires a deliberate decision on a payment provider** (Stripe Connect is the common choice for marketplace payouts between users, but this is an explicit open decision — see §6).
- Availability calendar per item, pricing per duration, deposit/escrow handling, pickup/return confirmation flow.

### Stage 5 — Auction listings (payments, part 2)
- Bidding engine, deadline-based closing, automatic winner notification, payment capture on win (reuses Stage 4's payment integration).

### Stage 6 — Personal space ("Rooms")
- Notes, media, links, reminders, calendar, wishlists, moments, plans, checklists, as described in §2.5.
- Sharing controls: private / shared-with-specific-people / public.

### Stage 7 — Polish & launch
- Search/discovery improvements (better ranking, trending topics).
- Push notifications (bids, trade proposals, reminders).
- Admin moderation tooling hardened.
- App Store / Google Play submission (the existing codebase is Expo/React Native, so this targets iOS + Android + web from one codebase).

---

## 6. Open Decisions (not yet made — flag these before continuing)

1. ~~**Product name.**~~ **Decided: TrY.** Reflected in `app.config.ts` (name/slug/scheme/bundle id), `package.json`, and the in-app branding. Note: the GitHub repo itself is still named `awesome-tracker-app` — renaming the repo/deploy URLs is a separate, deliberate decision not yet made (see `app.config.ts` comment on `experiments.baseUrl`).
2. ~~**Repurpose the existing codebase, or start fresh?**~~ **Decided: repurposed.** Stage 1 was built directly on top of the existing "AwesomeProject" codebase (auth, profile, chat, Supabase/Render/GitHub Pages pipeline all reused as-is).
3. **Payment provider** for Stage 4/5 (rentals, auctions). Needs a deliberate choice (e.g., Stripe Connect for marketplace payouts) before those stages start — do not casually wire up payment code without this decision being made explicitly.
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
