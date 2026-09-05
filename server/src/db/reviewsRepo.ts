import { eq, sql } from 'drizzle-orm';
import { db } from './client';
import { countCompletedListingsByType, type ListingType } from './listingsRepo';
import { listings, reviews, users } from './schema';
import { toPublicUser, type PublicUser } from './usersRepo';

export interface PublicReview {
  id: string;
  listingId: string;
  reviewerId: string;
  reviewer?: PublicUser;
  revieweeId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export type ReputationByType = Partial<Record<ListingType, { averageRating: number; count: number }>>;

export const BADGES = [
  { id: 'generous_giver', label: 'Generous Giver', description: '10+ give-aways completed' },
  { id: 'mentor', label: 'Mentor', description: '5+ lessons completed' },
  { id: 'trusted_trader', label: 'Trusted Trader', description: '10+ exchanges completed' },
  { id: 'five_star', label: 'Five-Star', description: '5+ reviews averaging 4.5 or higher' },
] as const;
export type BadgeId = (typeof BADGES)[number]['id'];

export interface ReputationSummary {
  averageRating: number | null;
  totalReviews: number;
  byType: ReputationByType;
  badges: BadgeId[];
}

function toPublicReview(row: typeof reviews.$inferSelect, reviewer?: typeof users.$inferSelect): PublicReview {
  return {
    id: row.id,
    listingId: row.listingId,
    reviewerId: row.reviewerId,
    reviewer: reviewer ? toPublicUser(reviewer) : undefined,
    revieweeId: row.revieweeId,
    rating: row.rating,
    comment: row.comment ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function createReview(input: {
  id: string;
  listingId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
}): Promise<PublicReview> {
  const [row] = await db.insert(reviews).values(input).returning();
  return toPublicReview(row);
}

/** Whether reviewerId has already reviewed revieweeId for this specific listing (one review per pair per listing). */
export async function hasReviewed(listingId: string, reviewerId: string, revieweeId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(
      sql`${reviews.listingId} = ${listingId} and ${reviews.reviewerId} = ${reviewerId} and ${reviews.revieweeId} = ${revieweeId}`
    )
    .limit(1);
  return !!row;
}

export async function listReviewsForUser(userId: string): Promise<PublicReview[]> {
  const rows = await db
    .select()
    .from(reviews)
    .innerJoin(users, eq(reviews.reviewerId, users.id))
    .where(eq(reviews.revieweeId, userId))
    .orderBy(reviews.createdAt);
  return rows.map((r) => toPublicReview(r.reviews, r.users));
}

export async function getReputationSummary(userId: string): Promise<ReputationSummary> {
  const [overall, byTypeRows, completedCounts] = await Promise.all([
    db
      .select({
        averageRating: sql<number | null>`avg(${reviews.rating})::float`,
        totalReviews: sql<number>`count(*)::int`,
      })
      .from(reviews)
      .where(eq(reviews.revieweeId, userId)),
    db
      .select({
        type: listings.type,
        averageRating: sql<number>`avg(${reviews.rating})::float`,
        count: sql<number>`count(*)::int`,
      })
      .from(reviews)
      .innerJoin(listings, eq(reviews.listingId, listings.id))
      .where(eq(reviews.revieweeId, userId))
      .groupBy(listings.type),
    countCompletedListingsByType(userId),
  ]);

  const averageRating = overall[0]?.averageRating ?? null;
  const totalReviews = overall[0]?.totalReviews ?? 0;

  const byType: ReputationByType = {};
  for (const row of byTypeRows) {
    byType[row.type as ListingType] = { averageRating: row.averageRating, count: row.count };
  }

  const badges: BadgeId[] = [];
  if (completedCounts.give_away >= 10) badges.push('generous_giver');
  if (completedCounts.lesson >= 5) badges.push('mentor');
  if (completedCounts.exchange >= 10) badges.push('trusted_trader');
  if (totalReviews >= 5 && averageRating !== null && averageRating >= 4.5) badges.push('five_star');

  return { averageRating, totalReviews, byType, badges };
}
