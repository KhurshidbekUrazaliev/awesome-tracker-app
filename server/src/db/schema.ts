import { pgTable, text, timestamp, primaryKey, index, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  avatar: text('avatar'),
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
 * Stage 1 listing types only (idea, lesson, give_away, exchange) — no money
 * involved. trial/rental/auction are added in later stages once a payment
 * provider is deliberately chosen (see docs/PRODUCT_PLAN.md, "Open Decisions").
 */
export const listings = pgTable(
  'listings',
  {
    id: text('id').primaryKey(),
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // 'idea' | 'lesson' | 'give_away' | 'exchange' | 'trial'
    title: text('title').notNull(),
    description: text('description').notNull(),
    category: text('category').notNull(),
    tags: text('tags').array().notNull().default([]),
    media: text('media').array().notNull().default([]),
    // Only meaningful for type = 'exchange': what the owner wants in return.
    wantInReturn: text('want_in_return'),
    // Only meaningful for type = 'trial': how many days the borrower gets to try it.
    trialDays: integer('trial_days'),
    status: text('status').notNull().default('open'), // 'open' | 'pending' | 'completed' | 'closed'
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('listings_status_created_at_idx').on(table.status, table.createdAt),
    index('listings_owner_id_idx').on(table.ownerId),
    index('listings_category_idx').on(table.category),
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
