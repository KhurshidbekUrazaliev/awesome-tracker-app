import { Router } from 'express';
import { randomUUID as uuid } from 'node:crypto';
import { z } from 'zod';
import {
  closeAuctionIfExpired,
  createInterest,
  createListing,
  deleteListing,
  findAcceptedInterest,
  findInterestById,
  findListingRowById,
  getListingById,
  LISTING_TYPES,
  listBidsForListing,
  listInterestsForListing,
  listListings,
  listListingsByOwner,
  listTrendingCategories,
  placeBid,
  setInterestStatus,
  setListingCheckoutSession,
  setListingStatus,
  updateListing,
} from '../db/listingsRepo';
import {
  createBookingRequest,
  findBookingRowById,
  hasConfirmedOverlap,
  listBookingsForListing,
  listBookingsForRenter,
  listConfirmedRanges,
  setBookingCheckoutSession,
  setBookingStatus,
  completeBooking as completeBookingRow,
} from '../db/rentalBookingsRepo';
import { listBlockedIds } from '../db/safetyRepo';
import { getPushToken, getStripeAccountId } from '../db/usersRepo';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { sendPushNotification } from '../utils/pushNotifications';
import { getPlatformFeePercent, getStripe } from '../utils/stripe';

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
  trialDays: z.number().int().min(1).max(90).optional(),
  pricePerDayCents: z.number().int().min(50).max(1_000_000).optional(),
  depositAmountCents: z.number().int().min(0).max(1_000_000).optional(),
  startingBidCents: z.number().int().min(50).max(1_000_000).optional(),
  auctionEndsAt: z.string().datetime().optional(),
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
    const excludeOwnerIds = await listBlockedIds(req.userId!);
    res.json(await listListings({ ...parsed.data, excludeOwnerIds }));
  })
);

router.get(
  '/mine',
  asyncHandler(async (req, res) => {
    res.json(await listListingsByOwner(req.userId!));
  })
);

router.get(
  '/trending-categories',
  asyncHandler(async (_req, res) => {
    res.json(await listTrendingCategories());
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
    if (parsed.data.type === 'trial' && !parsed.data.trialDays) {
      return res.status(400).json({ message: 'trialDays is required for trial listings' });
    }
    if (parsed.data.type !== 'trial' && parsed.data.trialDays) {
      return res.status(400).json({ message: 'trialDays is only valid for trial listings' });
    }
    if (parsed.data.type === 'rental' && !parsed.data.pricePerDayCents) {
      return res.status(400).json({ message: 'pricePerDayCents is required for rental listings' });
    }
    if (parsed.data.type !== 'rental' && (parsed.data.pricePerDayCents || parsed.data.depositAmountCents)) {
      return res.status(400).json({ message: 'pricePerDayCents/depositAmountCents are only valid for rental listings' });
    }
    if (parsed.data.type === 'auction' && (!parsed.data.startingBidCents || !parsed.data.auctionEndsAt)) {
      return res.status(400).json({ message: 'startingBidCents and auctionEndsAt are required for auction listings' });
    }
    if (parsed.data.type !== 'auction' && (parsed.data.startingBidCents || parsed.data.auctionEndsAt)) {
      return res.status(400).json({ message: 'startingBidCents/auctionEndsAt are only valid for auction listings' });
    }
    if (parsed.data.auctionEndsAt && new Date(parsed.data.auctionEndsAt) <= new Date()) {
      return res.status(400).json({ message: 'auctionEndsAt must be in the future' });
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
      trialDays: parsed.data.trialDays,
      pricePerDayCents: parsed.data.pricePerDayCents,
      depositAmountCents: parsed.data.depositAmountCents,
      startingBidCents: parsed.data.startingBidCents,
      auctionEndsAt: parsed.data.auctionEndsAt ? new Date(parsed.data.auctionEndsAt) : undefined,
    });
    res.status(201).json(listing);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    // Lazy fallback: an auction past its deadline is closed here on-read, so
    // viewing it is always self-correcting even if the closing interval in
    // index.ts missed a tick (e.g. the free-tier instance was asleep).
    const row = await findListingRowById(req.params.id);
    if (!row) return res.status(404).json({ message: 'Listing not found' });
    await closeAuctionIfExpired(row);

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
    if (row.type === 'rental') {
      return res.status(400).json({ message: 'Use the booking flow for rental listings' });
    }
    if (row.type === 'auction') {
      return res.status(400).json({ message: 'Use the bidding flow for auction listings' });
    }
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

    sendPushNotification(
      await getPushToken(row.ownerId),
      'New interest in your listing',
      `Someone's interested in "${row.title}"`,
      { listingId: row.id }
    );

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

    sendPushNotification(
      await getPushToken(interest.requesterId),
      'Your interest was accepted!',
      `The owner of "${row.title}" said yes — coordinate the handoff in Messages.`,
      { listingId: row.id }
    );

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
    if (row.type === 'auction' && !row.stripePaymentIntentId) {
      return res.status(400).json({ message: "Waiting for the winner's payment before this can be marked completed" });
    }

    await setListingStatus(row.id, 'completed');

    sendPushNotification(
      await getPushToken(accepted.requesterId),
      'All done!',
      `"${row.title}" is marked completed — leave a review when you get a chance.`,
      { listingId: row.id }
    );

    res.json({ counterpartyId: accepted.requesterId });
  })
);

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');

function daysBetween(startDate: string, endDate: string): number {
  const ms = new Date(`${endDate}T00:00:00Z`).getTime() - new Date(`${startDate}T00:00:00Z`).getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

router.post(
  '/:id/bookings',
  asyncHandler(async (req, res) => {
    const row = await findListingRowById(req.params.id);
    if (!row) return res.status(404).json({ message: 'Listing not found' });
    if (row.type !== 'rental') return res.status(400).json({ message: 'This listing is not a rental' });
    if (row.ownerId === req.userId) return res.status(400).json({ message: 'You cannot book your own listing' });
    if (row.status !== 'open') return res.status(400).json({ message: 'This listing is not accepting bookings' });

    const bodySchema = z.object({ startDate: dateStringSchema, endDate: dateStringSchema });
    const parsed = bodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid input' });
    }

    const days = daysBetween(parsed.data.startDate, parsed.data.endDate);
    if (days < 1) return res.status(400).json({ message: 'endDate must be after startDate' });

    const booking = await createBookingRequest({
      id: uuid(),
      listingId: row.id,
      renterId: req.userId!,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      rentalFeeCents: row.pricePerDayCents! * days,
      depositAmountCents: row.depositAmountCents ?? 0,
    });

    sendPushNotification(
      await getPushToken(row.ownerId),
      'New booking request',
      `Someone wants to book "${row.title}" for ${days} day${days === 1 ? '' : 's'}`,
      { listingId: row.id, bookingId: booking.id }
    );

    res.status(201).json(booking);
  })
);

router.get(
  '/:id/bookings',
  asyncHandler(async (req, res) => {
    const row = await findListingRowById(req.params.id);
    if (!row) return res.status(404).json({ message: 'Listing not found' });

    if (row.ownerId === req.userId) {
      return res.json(await listBookingsForListing(row.id));
    }
    if (req.query.mine === 'true') {
      return res.json(await listBookingsForRenter(row.id, req.userId!));
    }
    // Non-owners only see which date ranges are already taken, not who booked them or for how much.
    res.json(await listConfirmedRanges(row.id));
  })
);

router.get(
  '/:id/bookings/:bookingId',
  asyncHandler(async (req, res) => {
    const row = await findListingRowById(req.params.id);
    if (!row) return res.status(404).json({ message: 'Listing not found' });

    const booking = await findBookingRowById(req.params.bookingId);
    if (!booking || booking.listingId !== row.id) return res.status(404).json({ message: 'Booking not found' });
    if (booking.renterId !== req.userId && row.ownerId !== req.userId) {
      return res.status(403).json({ message: 'This booking belongs to someone else' });
    }

    res.json({
      id: booking.id,
      listingId: booking.listingId,
      renterId: booking.renterId,
      startDate: booking.startDate,
      endDate: booking.endDate,
      rentalFeeCents: booking.rentalFeeCents,
      depositAmountCents: booking.depositAmountCents,
      status: booking.status,
      depositResolution: booking.depositResolution ?? undefined,
      depositClaimedCents: booking.depositClaimedCents ?? undefined,
      createdAt: booking.createdAt.toISOString(),
    });
  })
);

router.post(
  '/:id/bookings/:bookingId/accept',
  asyncHandler(async (req, res) => {
    const row = await findListingRowById(req.params.id);
    if (!row) return res.status(404).json({ message: 'Listing not found' });
    if (row.ownerId !== req.userId) return res.status(403).json({ message: 'Only the listing owner can accept a booking' });

    const booking = await findBookingRowById(req.params.bookingId);
    if (!booking || booking.listingId !== row.id) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status !== 'requested') return res.status(400).json({ message: 'This booking is no longer pending' });

    if (await hasConfirmedOverlap(row.id, booking.startDate, booking.endDate)) {
      return res.status(409).json({ message: 'Those dates were just booked by someone else' });
    }

    await setBookingStatus(booking.id, 'accepted');

    sendPushNotification(
      await getPushToken(booking.renterId),
      'Booking accepted!',
      `The owner of "${row.title}" said yes — complete payment to confirm your dates.`,
      { listingId: row.id, bookingId: booking.id }
    );

    res.status(204).send();
  })
);

router.post(
  '/:id/bookings/:bookingId/decline',
  asyncHandler(async (req, res) => {
    const row = await findListingRowById(req.params.id);
    if (!row) return res.status(404).json({ message: 'Listing not found' });
    if (row.ownerId !== req.userId) return res.status(403).json({ message: 'Only the listing owner can decline a booking' });

    const booking = await findBookingRowById(req.params.bookingId);
    if (!booking || booking.listingId !== row.id) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status !== 'requested' && booking.status !== 'accepted') {
      return res.status(400).json({ message: 'This booking can no longer be declined' });
    }

    await setBookingStatus(booking.id, 'declined');

    sendPushNotification(
      await getPushToken(booking.renterId),
      'Booking declined',
      `The owner of "${row.title}" wasn't able to accept your request.`,
      { listingId: row.id, bookingId: booking.id }
    );

    res.status(204).send();
  })
);

router.get(
  '/:id/bookings/:bookingId/checkout-url',
  asyncHandler(async (req, res) => {
    const row = await findListingRowById(req.params.id);
    if (!row) return res.status(404).json({ message: 'Listing not found' });

    const booking = await findBookingRowById(req.params.bookingId);
    if (!booking || booking.listingId !== row.id) return res.status(404).json({ message: 'Booking not found' });
    if (booking.renterId !== req.userId) return res.status(403).json({ message: 'This booking belongs to someone else' });
    if (booking.status !== 'accepted') return res.status(400).json({ message: 'This booking is not ready for payment' });

    const ownerStripeAccountId = await getStripeAccountId(row.ownerId);
    if (!ownerStripeAccountId) {
      return res.status(400).json({ message: "The owner hasn't set up payouts yet — try again later" });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      // Managed Payments makes Stripe the merchant of record, which conflicts with
      // this platform's "collect then transfer" model (see server/src/utils/stripe.ts).
      managed_payments: { enabled: false },
      line_items: [
        {
          price_data: {
            currency: row.currency,
            product_data: { name: `${row.title} — ${booking.startDate} to ${booking.endDate}` },
            unit_amount: booking.rentalFeeCents,
          },
          quantity: 1,
        },
        ...(booking.depositAmountCents > 0
          ? [
              {
                price_data: {
                  currency: row.currency,
                  product_data: { name: 'Refundable deposit' },
                  unit_amount: booking.depositAmountCents,
                },
                quantity: 1,
              },
            ]
          : []),
      ],
      metadata: { bookingId: booking.id },
      success_url: `try://listings/detail?id=${row.id}&payment=success`,
      cancel_url: `try://listings/detail?id=${row.id}&payment=cancelled`,
    });

    await setBookingCheckoutSession(booking.id, session.id);
    res.json({ url: session.url });
  })
);

router.post(
  '/:id/bookings/:bookingId/complete',
  asyncHandler(async (req, res) => {
    const row = await findListingRowById(req.params.id);
    if (!row) return res.status(404).json({ message: 'Listing not found' });
    if (row.ownerId !== req.userId) return res.status(403).json({ message: 'Only the listing owner can complete a booking' });

    const booking = await findBookingRowById(req.params.bookingId);
    if (!booking || booking.listingId !== row.id) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status !== 'confirmed') return res.status(400).json({ message: 'This booking is not awaiting completion' });

    const bodySchema = z.object({
      depositAction: z.enum(['refund', 'claim']),
      claimAmountCents: z.number().int().min(0).optional(),
    });
    const parsed = bodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid input' });
    }
    const claimAmountCents = parsed.data.depositAction === 'claim' ? parsed.data.claimAmountCents ?? 0 : 0;
    if (claimAmountCents > booking.depositAmountCents) {
      return res.status(400).json({ message: "Can't claim more than the deposit" });
    }

    const ownerStripeAccountId = await getStripeAccountId(row.ownerId);
    if (!ownerStripeAccountId) return res.status(400).json({ message: "The owner hasn't set up payouts" });

    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.retrieve(booking.stripePaymentIntentId!);
    const chargeId = typeof paymentIntent.latest_charge === 'string' ? paymentIntent.latest_charge : undefined;

    const platformFeeCents = Math.round((booking.rentalFeeCents * getPlatformFeePercent()) / 100);
    await stripe.transfers.create({
      amount: booking.rentalFeeCents - platformFeeCents,
      currency: row.currency,
      destination: ownerStripeAccountId,
      source_transaction: chargeId,
    });

    if (parsed.data.depositAction === 'claim' && claimAmountCents > 0) {
      await stripe.transfers.create({
        amount: claimAmountCents,
        currency: row.currency,
        destination: ownerStripeAccountId,
        source_transaction: chargeId,
      });
    }
    const refundAmount = booking.depositAmountCents - claimAmountCents;
    if (refundAmount > 0) {
      await stripe.refunds.create({ payment_intent: booking.stripePaymentIntentId!, amount: refundAmount });
    }

    await completeBookingRow(booking.id, {
      depositResolution: parsed.data.depositAction === 'claim' ? 'claimed' : 'refunded',
      depositClaimedCents: claimAmountCents || undefined,
    });

    sendPushNotification(
      await getPushToken(booking.renterId),
      'Rental completed',
      claimAmountCents > 0
        ? `"${row.title}" is marked completed — $${(claimAmountCents / 100).toFixed(2)} of your deposit was claimed by the owner.`
        : `"${row.title}" is marked completed — your deposit has been refunded. Leave a review when you get a chance.`,
      { listingId: row.id, bookingId: booking.id }
    );

    res.status(204).send();
  })
);

router.post(
  '/:id/bids',
  asyncHandler(async (req, res) => {
    const row = await findListingRowById(req.params.id);
    if (!row) return res.status(404).json({ message: 'Listing not found' });
    if (row.type !== 'auction') return res.status(400).json({ message: 'This listing is not an auction' });
    if (row.ownerId === req.userId) return res.status(400).json({ message: 'You cannot bid on your own listing' });

    const bodySchema = z.object({ amountCents: z.number().int().min(1) });
    const parsed = bodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid input' });
    }

    const updated = await placeBid(row.id, req.userId!, parsed.data.amountCents);
    if (!updated) {
      return res.status(409).json({ message: 'This auction has ended, or your bid is too low' });
    }

    if (row.currentBidderId && row.currentBidderId !== req.userId) {
      sendPushNotification(
        await getPushToken(row.currentBidderId),
        "You've been outbid",
        `Someone placed a higher bid on "${row.title}".`,
        { listingId: row.id }
      );
    }

    res.status(201).json(updated);
  })
);

router.get(
  '/:id/bids',
  asyncHandler(async (req, res) => {
    const row = await findListingRowById(req.params.id);
    if (!row) return res.status(404).json({ message: 'Listing not found' });
    if (row.ownerId !== req.userId) {
      return res.status(403).json({ message: 'Only the listing owner can view bid history' });
    }
    res.json(await listBidsForListing(row.id));
  })
);

router.get(
  '/:id/auction-checkout-url',
  asyncHandler(async (req, res) => {
    const row = await findListingRowById(req.params.id);
    if (!row) return res.status(404).json({ message: 'Listing not found' });
    if (row.type !== 'auction') return res.status(400).json({ message: 'This listing is not an auction' });
    if (row.status !== 'pending') return res.status(400).json({ message: 'This auction is not awaiting payment' });
    if (row.currentBidderId !== req.userId) {
      return res.status(403).json({ message: 'Only the winning bidder can pay for this auction' });
    }
    if (row.stripePaymentIntentId) {
      return res.status(400).json({ message: 'This auction has already been paid for' });
    }

    const ownerStripeAccountId = await getStripeAccountId(row.ownerId);
    if (!ownerStripeAccountId) {
      return res.status(400).json({ message: "The owner hasn't set up payouts yet — try again later" });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      // See the rental checkout-url route above for why this is required.
      managed_payments: { enabled: false },
      line_items: [
        {
          price_data: {
            currency: row.currency,
            product_data: { name: row.title },
            unit_amount: row.currentBidCents!,
          },
          quantity: 1,
        },
      ],
      metadata: { type: 'auction', listingId: row.id },
      success_url: `try://listings/detail?id=${row.id}&payment=success`,
      cancel_url: `try://listings/detail?id=${row.id}&payment=cancelled`,
    });

    await setListingCheckoutSession(row.id, session.id);
    res.json({ url: session.url });
  })
);

export default router;
