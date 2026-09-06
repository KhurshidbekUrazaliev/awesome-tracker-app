import { Router } from 'express';
import { z } from 'zod';
import { findUserById, getConnectStatus, getStripeAccountId, setStripeAccountId } from '../db/usersRepo';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { getStripe } from '../utils/stripe';

const router = Router();
router.use(requireAuth);

router.get(
  '/connect/status',
  asyncHandler(async (req, res) => {
    res.json(await getConnectStatus(req.userId!));
  })
);

const onboardSchema = z.object({
  refreshUrl: z.string().min(1),
  returnUrl: z.string().min(1),
});

router.post(
  '/connect/onboard',
  asyncHandler(async (req, res) => {
    const parsed = onboardSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid input' });
    }

    const stripe = getStripe();
    let accountId = await getStripeAccountId(req.userId!);

    if (!accountId) {
      const user = await findUserById(req.userId!);
      const account = await stripe.accounts.create({
        type: 'express',
        email: user?.email,
        capabilities: { transfers: { requested: true } },
      });
      accountId = account.id;
      await setStripeAccountId(req.userId!, accountId);
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      type: 'account_onboarding',
      refresh_url: parsed.data.refreshUrl,
      return_url: parsed.data.returnUrl,
    });

    res.json({ url: accountLink.url });
  })
);

export default router;
