import { and, desc, eq, ilike, notInArray, or, sql } from 'drizzle-orm';
import { db } from './client';
import { listingInterests, listings, users } from './schema';
import { toPublicUser, type PublicUser } from './usersRepo';

export const LISTING_TYPES = ['idea', 'lesson', 'give_away', 'exchange', 'trial'] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export interface PublicListing {
  id: string;
  ownerId: string;
  owner?: PublicUser;
  type: ListingType;
  title: string;
  description: string;
  category: string;
  tags: string[];
  media: string[];
  wantInReturn?: string;
  trialDays?: number;
  status: 'open' | 'pending' | 'completed' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface PublicInterest {
  id: string;
  listingId: string;
  requesterId: string;
  requester?: PublicUser;
  message?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

function toPublicListing(row: typeof listings.$inferSelect, owner?: typeof users.$inferSelect): PublicListing {
  return {
    id: row.id,
    ownerId: row.ownerId,
    owner: owner ? toPublicUser(owner) : undefined,
    type: row.type as ListingType,
    title: row.title,
    description: row.description,
    category: row.category,
    tags: row.tags,
    media: row.media,
    wantInReturn: row.wantInReturn ?? undefined,
    trialDays: row.trialDays ?? undefined,
    status: row.status as PublicListing['status'],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toPublicInterest(row: typeof listingInterests.$inferSelect, requester?: typeof users.$inferSelect): PublicInterest {
  return {
    id: row.id,
    listingId: row.listingId,
    requesterId: row.requesterId,
    requester: requester ? toPublicUser(requester) : undefined,
    message: row.message ?? undefined,
    status: row.status as PublicInterest['status'],
    createdAt: row.createdAt.toISOString(),
  };
}

export interface ListingFilters {
  type?: ListingType;
  category?: string;
  q?: string;
  status?: PublicListing['status'];
  /** Owner ids to exclude — used to hide listings from users the viewer has blocked. */
  excludeOwnerIds?: string[];
}

/** Browse/search open listings. Ranked by relevance when searching, newest first otherwise. */
export async function listListings(filters: ListingFilters): Promise<PublicListing[]> {
  const conditions = [eq(listings.status, filters.status ?? 'open')];
  if (filters.type) conditions.push(eq(listings.type, filters.type));
  if (filters.category) conditions.push(eq(listings.category, filters.category));

  const tagMatches = filters.q ? sql`EXISTS (SELECT 1 FROM unnest(${listings.tags}) AS tag WHERE tag ILIKE ${`%${filters.q}%`})` : undefined;
  if (filters.q) {
    const like = `%${filters.q}%`;
    conditions.push(or(ilike(listings.title, like), ilike(listings.description, like), tagMatches)!);
  }
  if (filters.excludeOwnerIds?.length) {
    conditions.push(notInArray(listings.ownerId, filters.excludeOwnerIds));
  }

  // Relevance: a title match ranks above a tag match, which ranks above a description-only match.
  const relevance = filters.q
    ? sql`CASE WHEN ${ilike(listings.title, `%${filters.q}%`)} THEN 3 WHEN ${tagMatches} THEN 2 ELSE 1 END`
    : undefined;

  const rows = await db
    .select()
    .from(listings)
    .innerJoin(users, eq(listings.ownerId, users.id))
    .where(and(...conditions))
    .orderBy(...(relevance ? [desc(relevance)] : []), desc(listings.createdAt));

  return rows.map((r) => toPublicListing(r.listings, r.users));
}

export interface TrendingCategory {
  category: string;
  count: number;
}

/** Top categories among currently open listings — powers "trending" quick filters on the browse feed. */
export async function listTrendingCategories(limit = 8): Promise<TrendingCategory[]> {
  const rows = await db
    .select({ category: listings.category, count: sql<number>`count(*)::int` })
    .from(listings)
    .where(eq(listings.status, 'open'))
    .groupBy(listings.category)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);
  return rows;
}

/** Completed-listing counts by type for one owner — powers reputation badges. */
export async function countCompletedListingsByType(ownerId: string): Promise<Record<ListingType, number>> {
  const rows = await db
    .select({ type: listings.type, count: sql<number>`count(*)::int` })
    .from(listings)
    .where(and(eq(listings.ownerId, ownerId), eq(listings.status, 'completed')))
    .groupBy(listings.type);

  const counts = Object.fromEntries(LISTING_TYPES.map((t) => [t, 0])) as Record<ListingType, number>;
  for (const row of rows) counts[row.type as ListingType] = row.count;
  return counts;
}

export async function listListingsByOwner(ownerId: string): Promise<PublicListing[]> {
  const rows = await db.select().from(listings).where(eq(listings.ownerId, ownerId)).orderBy(desc(listings.createdAt));
  return rows.map((r) => toPublicListing(r));
}

export async function getListingById(id: string): Promise<PublicListing | undefined> {
  const [row] = await db
    .select()
    .from(listings)
    .innerJoin(users, eq(listings.ownerId, users.id))
    .where(eq(listings.id, id))
    .limit(1);
  return row ? toPublicListing(row.listings, row.users) : undefined;
}

export async function findListingRowById(id: string) {
  const [row] = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  return row;
}

export interface CreateListingInput {
  id: string;
  ownerId: string;
  type: ListingType;
  title: string;
  description: string;
  category: string;
  tags: string[];
  media: string[];
  wantInReturn?: string;
  trialDays?: number;
}

export async function createListing(input: CreateListingInput): Promise<PublicListing> {
  const now = new Date();
  const [row] = await db
    .insert(listings)
    .values({ ...input, createdAt: now, updatedAt: now })
    .returning();
  return toPublicListing(row);
}

export interface UpdateListingInput {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  media?: string[];
  wantInReturn?: string;
  trialDays?: number;
}

export async function updateListing(id: string, updates: UpdateListingInput): Promise<PublicListing | undefined> {
  const [row] = await db
    .update(listings)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(listings.id, id))
    .returning();
  return row ? toPublicListing(row) : undefined;
}

export async function setListingStatus(id: string, status: PublicListing['status']): Promise<void> {
  await db.update(listings).set({ status, updatedAt: new Date() }).where(eq(listings.id, id));
}

export async function deleteListing(id: string): Promise<void> {
  await db.delete(listings).where(eq(listings.id, id));
}

export async function createInterest(input: {
  id: string;
  listingId: string;
  requesterId: string;
  message?: string;
}): Promise<PublicInterest> {
  const [row] = await db.insert(listingInterests).values(input).returning();
  return toPublicInterest(row);
}

export async function listInterestsForListing(listingId: string): Promise<PublicInterest[]> {
  const rows = await db
    .select()
    .from(listingInterests)
    .innerJoin(users, eq(listingInterests.requesterId, users.id))
    .where(eq(listingInterests.listingId, listingId))
    .orderBy(desc(listingInterests.createdAt));
  return rows.map((r) => toPublicInterest(r.listing_interests, r.users));
}

export async function findInterestById(id: string) {
  const [row] = await db.select().from(listingInterests).where(eq(listingInterests.id, id)).limit(1);
  return row;
}

export async function setInterestStatus(id: string, status: PublicInterest['status']): Promise<void> {
  await db.update(listingInterests).set({ status }).where(eq(listingInterests.id, id));
}

/** The one interest on a listing that the owner has accepted, if any. */
export async function findAcceptedInterest(listingId: string) {
  const [row] = await db
    .select()
    .from(listingInterests)
    .where(and(eq(listingInterests.listingId, listingId), eq(listingInterests.status, 'accepted')))
    .limit(1);
  return row;
}
