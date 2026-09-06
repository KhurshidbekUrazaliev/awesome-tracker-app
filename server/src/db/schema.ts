import { pgTable, text, timestamp, primaryKey, index, integer, jsonb, boolean, date, doublePrecision } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  avatar: text('avatar'),
  // Home location, set by the user in Settings. Powers "near me" browsing and
  // is the fallback location for listings that don't set their own. Never
  // exposed to other users as raw coordinates — see toPublicUser.
  locationLat: doublePrecision('location_lat'),
  locationLng: doublePrecision('location_lng'),
  locationCity: text('location_city'),
  locationRegion: text('location_region'),
  locationCountry: text('location_country'),
  locationCountryCode: text('location_country_code'),
  // Expo push token, registered by the client after requesting notification
  // permission. Null until the user has granted permission at least once.
  pushToken: text('push_token'),
  // Stripe Connect Express account, for owners who want to receive rental
  // payouts (Stage 4). Null until they complete onboarding.
  stripeAccountId: text('stripe_account_id'),
  stripeOnboardingComplete: boolean('stripe_onboarding_complete').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const conversations = pgTable('conversations', {
  id: text('id').primaryKey(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const conversationParticipants = pgTable(
  'conversation_participants',
  {
    conversationId: text('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    lastReadAt: timestamp('last_read_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.conversationId, table.userId] }),
    index('conversation_participants_user_id_idx').on(table.userId),
  ]
);

export const messages = pgTable(
  'messages',
  {
    id: text('id').primaryKey(),
    conversationId: text('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    senderId: text('sender_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('messages_conversation_id_created_at_idx').on(table.conversationId, table.createdAt)]
);

/**
 * idea, lesson, give_away, exchange, trial — no money involved. rental
 * (Stage 4, see docs/PRODUCT_PLAN.md) is the first paid type, via Stripe
 * Connect. auction (Stage 5) reuses the same Stripe Connect integration but,
 * unlike rental, fits the generic open→pending→completed lifecycle via a
 * synthetic accepted listingInterests row created when the auction closes —
 * see auctionBids below for the per-bid history.
 */
export const listings = pgTable(
  'listings',
  {
    id: text('id').primaryKey(),
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // 'idea' | 'lesson' | 'give_away' | 'exchange' | 'trial' | 'rental' | 'auction'
    title: text('title').notNull(),
    description: text('description').notNull(),
    category: text('category').notNull(),
    tags: text('tags').array().notNull().default([]),
    media: text('media').array().notNull().default([]),
    // Where this listing physically is — required for the 5 physical types
    // (give_away/exchange/trial/rental/auction) so a distance check can run
    // before a transaction starts; not required for idea/lesson. Defaults to
    // the owner's profile location at creation but can be overridden (the
    // item may be at a storage unit, etc.). Never exposed to other users as
    // raw coordinates — see toPublicListing.
    locationLat: doublePrecision('location_lat'),
    locationLng: doublePrecision('location_lng'),
    locationCity: text('location_city'),
    locationRegion: text('location_region'),
    locationCountry: text('location_country'),
    locationCountryCode: text('location_country_code'),
    // Only meaningful for type = 'exchange': what the owner wants in return.
    wantInReturn: text('want_in_return'),
    // Only meaningful for type = 'trial': how many days the borrower gets to try it.
    trialDays: integer('trial_days'),
    // Only meaningful for type = 'rental'. A rental listing stays 'open'
    // indefinitely (available for repeat bookings) — see rentalBookings for
    // the per-booking lifecycle.
    pricePerDayCents: integer('price_per_day_cents'),
    depositAmountCents: integer('deposit_amount_cents'),
    // Only meaningful for type = 'auction'. currentBidCents/currentBidderId
    // are the source of truth for the current price — auctionBids is just
    // the audit trail. stripeCheckoutSessionId/stripePaymentIntentId track
    // the winner's payment (there's no per-transaction row for auctions the
    // way rentalBookings has for rentals).
    startingBidCents: integer('starting_bid_cents'),
    auctionEndsAt: timestamp('auction_ends_at', { withTimezone: true }),
    currentBidCents: integer('current_bid_cents'),
    currentBidderId: text('current_bidder_id').references(() => users.id, { onDelete: 'set null' }),
    stripeCheckoutSessionId: text('stripe_checkout_session_id'),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    currency: text('currency').notNull().default('usd'),
    status: text('status').notNull().default('open'), // 'open' | 'pending' | 'completed' | 'closed'
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('listings_status_created_at_idx').on(table.status, table.createdAt),
    index('listings_owner_id_idx').on(table.ownerId),
    index('listings_category_idx').on(table.category),
    index('listings_type_status_ends_at_idx').on(table.type, table.status, table.auctionEndsAt),
  ]
);

/** One user expressing interest in / proposing a trade on someone else's listing. */
export const listingInterests = pgTable(
  'listing_interests',
  {
    id: text('id').primaryKey(),
    listingId: text('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    requesterId: text('requester_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    message: text('message'),
    status: text('status').notNull().default('pending'), // 'pending' | 'accepted' | 'declined'
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('listing_interests_listing_id_idx').on(table.listingId)]
);

/**
 * A review left by one user about another after a completed listing
 * interaction. Always tied to a real listing — no anonymous/free-floating
 * reviews — so reputation can't be gamed (see docs/PRODUCT_PLAN.md §4).
 */
export const reviews = pgTable(
  'reviews',
  {
    id: text('id').primaryKey(),
    listingId: text('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    reviewerId: text('reviewer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    revieweeId: text('reviewee_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('reviews_reviewee_id_idx').on(table.revieweeId)]
);

/**
 * Stage 2 (trust & safety): a user or listing flagged for review. No admin
 * review UI yet (that's Stage 7, "Admin moderation tooling hardened") — this
 * just captures the report so it exists to build on.
 */
export const reports = pgTable(
  'reports',
  {
    id: text('id').primaryKey(),
    reporterId: text('reporter_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    targetType: text('target_type').notNull(), // 'listing' | 'user'
    targetId: text('target_id').notNull(),
    reason: text('reason').notNull(),
    resolved: boolean('resolved').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('reports_target_idx').on(table.targetType, table.targetId)]
);

/** One user blocking another — hides the blocked user's listings from the blocker's browse feed. */
export const blocks = pgTable(
  'blocks',
  {
    blockerId: text('blocker_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    blockedId: text('blocked_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.blockerId, table.blockedId] }),
    index('blocks_blocked_id_idx').on(table.blockedId),
  ]
);

/**
 * Stage 6 (personal space): a Room is a user's own container for one area of
 * their life (see docs/PRODUCT_PLAN.md §2.5) — secondary to the sharing
 * marketplace, not the app's primary feature. Only the owner can add/edit/
 * delete items; visibility controls who can *view* the room.
 */
export const rooms = pgTable(
  'rooms',
  {
    id: text('id').primaryKey(),
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    visibility: text('visibility').notNull().default('private'), // 'private' | 'shared' | 'public'
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('rooms_owner_id_idx').on(table.ownerId),
    index('rooms_visibility_idx').on(table.visibility),
  ]
);

/** People a 'shared' room has been explicitly shared with. Irrelevant for private/public rooms. */
export const roomMembers = pgTable(
  'room_members',
  {
    roomId: text('room_id')
      .notNull()
      .references(() => rooms.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.roomId, table.userId] }),
    index('room_members_user_id_idx').on(table.userId),
  ]
);

/**
 * One piece of content inside a Room. A single flexible table (like
 * `listings`) rather than one table per content type — most of the
 * originally-brainstormed types (notes, links, reminders, calendar events,
 * wishlist items, moments, plans) fit the same few fields.
 */
export const roomItems = pgTable(
  'room_items',
  {
    id: text('id').primaryKey(),
    roomId: text('room_id')
      .notNull()
      .references(() => rooms.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // 'note' | 'link' | 'reminder' | 'event' | 'wish' | 'moment' | 'plan'
    title: text('title').notNull(),
    content: text('content'),
    // Only meaningful for type = 'link'.
    url: text('url'),
    media: text('media').array().notNull().default([]),
    // Only meaningful for type = 'reminder' | 'event'.
    dueAt: timestamp('due_at', { withTimezone: true }),
    // Only meaningful for type = 'plan': an array of {text, done} checklist entries.
    checklist: jsonb('checklist'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('room_items_room_id_idx').on(table.roomId, table.createdAt)]
);

/**
 * Stage 4: one renter's request for a date range on a `rental` listing, and
 * its lifecycle through payment and settlement. Deliberately a dedicated
 * table rather than an extension of `listingInterests` — a rental listing
 * stays 'open' indefinitely (repeat bookings), so booking lifecycle can't be
 * tracked via `listings.status` the way the other listing types are.
 */
export const rentalBookings = pgTable(
  'rental_bookings',
  {
    id: text('id').primaryKey(),
    listingId: text('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    renterId: text('renter_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    // Snapshot of the listing's pricing at request time, so a later price
    // change doesn't retroactively affect an in-flight or past booking.
    rentalFeeCents: integer('rental_fee_cents').notNull(),
    depositAmountCents: integer('deposit_amount_cents').notNull().default(0),
    // 'requested' | 'accepted' | 'confirmed' | 'declined' | 'completed' | 'cancelled'
    status: text('status').notNull().default('requested'),
    stripeCheckoutSessionId: text('stripe_checkout_session_id'),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    // Set only once the booking is completed.
    depositResolution: text('deposit_resolution'), // 'refunded' | 'claimed' | null
    depositClaimedCents: integer('deposit_claimed_cents'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('rental_bookings_listing_id_status_idx').on(table.listingId, table.status)]
);

/**
 * One bid on an auction listing. Pure audit/history — the current price and
 * winner live denormalized on listings.currentBidCents/currentBidderId,
 * updated atomically alongside each insert here (see placeBid).
 */
export const auctionBids = pgTable(
  'auction_bids',
  {
    id: text('id').primaryKey(),
    listingId: text('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    bidderId: text('bidder_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    amountCents: integer('amount_cents').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('auction_bids_listing_id_created_at_idx').on(table.listingId, table.createdAt)]
);
