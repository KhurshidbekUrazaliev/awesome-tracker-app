import { eq, sql } from 'drizzle-orm';
import { db } from './client';
import { reviews, users } from './schema';
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

export interface ReputationSummary {
  averageRating: number | null;
  totalReviews: number;
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
  const [row] = await db
    .select({
      averageRating: sql<number | null>`avg(${reviews.rating})::float`,
      totalReviews: sql<number>`count(*)::int`,
    })
    .from(reviews)
    .where(eq(reviews.revieweeId, userId));
  return { averageRating: row?.averageRating ?? null, totalReviews: row?.totalReviews ?? 0 };
}
