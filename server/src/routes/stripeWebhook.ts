import { Router } from 'express';
import type Stripe from 'stripe';
import { confirmBookingPayment, findBookingRowByCheckoutSessionId, hasConfirmedOverlap, setBookingStatus } from '../db/rentalBookingsRepo';
import { confirmAuctionPayment, findListingRowById } from '../db/listingsRepo';
import { getPushToken, getStripeAccountId, setStripeOnboardingComplete } from '../db/usersRepo';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../logger';
import { sendPushNotification } from '../utils/pushNotifications';
import { getPlatformFeePercent, getStripe } from '../utils/stripe';

const router = Router();

// Not behind requireAuth — Stripe calls this unauthenticated, verified by signature instead.
// Mounted in index.ts with express.raw() so req.body is the raw buffer signature verification needs.
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const signature = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret || typeof signature !== 'string') {
      return res.status(400).send('Missing webhook signature/secret');
    }

    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (err) {
      logger.warn({ err }, 'Stripe webhook signature verification failed');
      return res.status(400).send('Invalid signature');
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;

        if (session.metadata?.type === 'auction') {
          const listingId = session.metadata.listingId;
          if (!listingId || !paymentIntentId) break;

          const listing = await findListingRowById(listingId);
          if (!listing || listing.status !== 'pending' || listing.stripeCheckoutSessionId !== session.id) break;

          await confirmAuctionPayment(listingId, paymentIntentId);

          // A sale is a sale — no deposit to hold, unlike rentals, so the owner is paid out immediately.
          const ownerStripeAccountId = await getStripeAccountId(listing.ownerId);
          if (ownerStripeAccountId && listing.currentBidCents) {
            const stripe = getStripe();
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            const chargeId = typeof paymentIntent.latest_charge === 'string' ? paymentIntent.latest_charge : undefined;
            const platformFeeCents = Math.round((listing.currentBidCents * getPlatformFeePercent()) / 100);
            await stripe.transfers.create({
              amount: listing.currentBidCents - platformFeeCents,
              currency: listing.currency,
              destination: ownerStripeAccountId,
              source_transaction: chargeId,
            });
          }

          sendPushNotification(
            await getPushToken(listing.ownerId),
            'Auction paid!',
            `The winner of "${listing.title}" has paid — mark it completed once you've handed it off.`,
            { listingId: listing.id }
          );
          break;
        }

        const bookingId = session.metadata?.bookingId;
        if (!bookingId) break;

        const booking = await findBookingRowByCheckoutSessionId(session.id);
        if (!booking || booking.status !== 'accepted') break;

        // Last-resort race check: reject if another booking confirmed the same dates in between.
        if (await hasConfirmedOverlap(booking.listingId, booking.startDate, booking.endDate, booking.id)) {
          await setBookingStatus(booking.id, 'cancelled');
          logger.warn({ bookingId }, 'Booking paid but dates were already taken — cancelled and left for manual refund');
          break;
        }

        if (paymentIntentId) await confirmBookingPayment(booking.id, paymentIntentId);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logger.warn({ paymentIntentId: paymentIntent.id }, 'Stripe payment failed');
        break;
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        const complete = !!account.charges_enabled && !!account.payouts_enabled;
        await setStripeOnboardingComplete(account.id, complete);
        break;
      }

      default:
        break;
    }

    res.json({ received: true });
  })
);

export default router;
