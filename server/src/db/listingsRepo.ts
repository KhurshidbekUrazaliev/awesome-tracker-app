import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { db } from './client';
import { listingInterests, listings, users } from './schema';
import { toPublicUser, type PublicUser } from './usersRepo';

export const LISTING_TYPES = ['idea', 'lesson', 'give_away', 'exchange'] as const;
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
}

/** Browse/search open listings, newest first, each with its owner attached. */
export async function listListings(filters: ListingFilters): Promise<PublicListing[]> {
  const conditions = [eq(listings.status, filters.status ?? 'open')];
  if (filters.type) conditions.push(eq(listings.type, filters.type));
  if (filters.category) conditions.push(eq(listings.category, filters.category));
  if (filters.q) {
    const like = `%${filters.q}%`;
    conditions.push(or(ilike(listings.title, like), ilike(listings.description, like))!);
  }

  const rows = await db
    .select()
    .from(listings)
    .innerJoin(users, eq(listings.ownerId, users.id))
    .where(and(...conditions))
    .orderBy(desc(listings.createdAt));

  return rows.map((r) => toPublicListing(r.listings, r.users));
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
