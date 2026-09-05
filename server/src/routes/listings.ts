import { Router } from 'express';
import { randomUUID as uuid } from 'node:crypto';
import { z } from 'zod';
import {
  createInterest,
  createListing,
  deleteListing,
  findAcceptedInterest,
  findInterestById,
  findListingRowById,
  getListingById,
  LISTING_TYPES,
  listInterestsForListing,
  listListings,
  listListingsByOwner,
  setInterestStatus,
  setListingStatus,
  updateListing,
} from '../db/listingsRepo';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.use(requireAuth);

const listingTypeSchema = z.enum(LISTING_TYPES);

const createListingSchema = z.object({
  type: listingTypeSchema,
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(4000),
  category: z.string().trim().min(1).max(60),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).optional(),
  media: z.array(z.string().url()).max(10).optional(),
  wantInReturn: z.string().trim().min(1).max(500).optional(),
});

const updateListingSchema = createListingSchema.partial().omit({ type: true });

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const querySchema = z.object({
      type: listingTypeSchema.optional(),
      category: z.string().trim().min(1).optional(),
      q: z.string().trim().min(1).optional(),
    });
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid query' });
    }
    res.json(await listListings(parsed.data));
  })
);

router.get(
  '/mine',
  asyncHandler(async (req, res) => {
    res.json(await listListingsByOwner(req.userId!));
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = createListingSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid input' });
    }
    if (parsed.data.type !== 'exchange' && parsed.data.wantInReturn) {
      return res.status(400).json({ message: 'wantInReturn is only valid for exchange listings' });
    }

    const listing = await createListing({
      id: uuid(),
      ownerId: req.userId!,
      type: parsed.data.type,
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      tags: parsed.data.tags ?? [],
      media: parsed.data.media ?? [],
      wantInReturn: parsed.data.wantInReturn,
    });
    res.status(201).json(listing);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const listing = await getListingById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json(listing);
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const row = await findListingRowById(req.params.id);
    if (!row) return res.status(404).json({ message: 'Listing not found' });
    if (row.ownerId !== req.userId) {
      return res.status(403).json({ message: 'You can only edit your own listings' });
    }

    const parsed = updateListingSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid input' });
    }

    const listing = await updateListing(req.params.id, parsed.data);
    res.json(listing);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const row = await findListingRowById(req.params.id);
    if (!row) return res.status(404).json({ message: 'Listing not found' });
    if (row.ownerId !== req.userId) {
      return res.status(403).json({ message: 'You can only delete your own listings' });
    }
    await deleteListing(req.params.id);
    res.status(204).send();
  })
);

router.post(
  '/:id/interest',
  asyncHandler(async (req, res) => {
    const row = await findListingRowById(req.params.id);
    if (!row) return res.status(404).json({ message: 'Listing not found' });
    if (row.ownerId === req.userId) {
      return res.status(400).json({ message: 'You cannot express interest in your own listing' });
    }
    if (row.status !== 'open') {
      return res.status(400).json({ message: 'This listing is no longer open' });
    }

    const bodySchema = z.object({ message: z.string().trim().max(1000).optional() });
    const parsed = bodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid input' });
    }

    const interest = await createInterest({
      id: uuid(),
      listingId: req.params.id,
      requesterId: req.userId!,
      message: parsed.data.message,
    });
    res.status(201).json(interest);
  })
);

router.get(
  '/:id/interests',
  asyncHandler(async (req, res) => {
    const row = await findListingRowById(req.params.id);
    if (!row) return res.status(404).json({ message: 'Listing not found' });
    if (row.ownerId !== req.userId) {
      return res.status(403).json({ message: 'Only the listing owner can view interests' });
    }
    res.json(await listInterestsForListing(req.params.id));
  })
);

router.post(
  '/:id/interests/:interestId/accept',
  asyncHandler(async (req, res) => {
    const row = await findListingRowById(req.params.id);
    if (!row) return res.status(404).json({ message: 'Listing not found' });
    if (row.ownerId !== req.userId) {
      return res.status(403).json({ message: 'Only the listing owner can accept an interest' });
    }

    const interest = await findInterestById(req.params.interestId);
    if (!interest || interest.listingId !== req.params.id) {
      return res.status(404).json({ message: 'Interest not found' });
    }

    await setInterestStatus(interest.id, 'accepted');
    await setListingStatus(row.id, 'pending');
    res.status(204).send();
  })
);

router.post(
  '/:id/complete',
  asyncHandler(async (req, res) => {
    const row = await findListingRowById(req.params.id);
    if (!row) return res.status(404).json({ message: 'Listing not found' });
    if (row.ownerId !== req.userId) {
      return res.status(403).json({ message: 'Only the listing owner can mark it completed' });
    }

    const accepted = await findAcceptedInterest(row.id);
    if (!accepted) {
      return res.status(400).json({ message: 'Accept an interest before marking this listing completed' });
    }

    await setListingStatus(row.id, 'completed');
    res.json({ counterpartyId: accepted.requesterId });
  })
);

export default router;
