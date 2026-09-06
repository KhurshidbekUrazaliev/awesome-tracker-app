import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

/**
 * Lazily instantiated — unlike DATABASE_URL, STRIPE_SECRET_KEY is only
 * required once a payment/Connect route is actually hit, so a server without
 * it configured yet can still run everything else.
 */
export function getStripe(): Stripe {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not set. Copy .env.example to .env and configure it.');
    }
    stripeClient = new Stripe(secretKey);
  }
  return stripeClient;
}

/** Platform's cut of the rental fee (not the deposit), as a percentage. Defaults to 0. */
export function getPlatformFeePercent(): number {
  const raw = process.env.PLATFORM_FEE_PERCENT;
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}
