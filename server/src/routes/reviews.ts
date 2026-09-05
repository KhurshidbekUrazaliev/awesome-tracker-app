import { Router } from 'express';
import { randomUUID as uuid } from 'node:crypto';
import { z } from 'zod';
import { findListingRowById, findAcceptedInterest } from '../db/listingsRepo';
import { createReview, getReputationSummary, hasReviewed, listReviewsForUser } from '../db/reviewsRepo';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.use(requireAuth);

const createReviewSchema = z.object({
  listingId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = createReviewSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid input' });
    }

    const listing = await findListingRowById(parsed.data.listingId);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.status !== 'completed') {
      return res.status(400).json({ message: 'You can only review a completed listing' });
    }

    const accepted = await findAcceptedInterest(listing.id);
    if (!accepted) return res.status(400).json({ message: 'This listing has no accepted counterparty' });

    const reviewerId = req.userId!;
    const parties = [listing.ownerId, accepted.requesterId];
    if (!parties.includes(reviewerId)) {
      return res.status(403).json({ message: 'Only the two parties to this listing can review each other' });
    }
    const revieweeId = parties.find((id) => id !== reviewerId)!;

    if (await hasReviewed(listing.id, reviewerId, revieweeId)) {
      return res.status(409).json({ message: 'You already reviewed this listing' });
    }

    const review = await createReview({
      id: uuid(),
      listingId: listing.id,
      reviewerId,
      revieweeId,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    });
    res.status(201).json(review);
  })
);

router.get(
  '/users/:userId',
  asyncHandler(async (req, res) => {
    const [summary, reviews] = await Promise.all([
      getReputationSummary(req.params.userId),
      listReviewsForUser(req.params.userId),
    ]);
    res.json({ summary, reviews });
  })
);

export default router;
