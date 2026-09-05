import { Router } from 'express';
import { randomUUID as uuid } from 'node:crypto';
import { z } from 'zod';
import { REPORT_TARGET_TYPES, blockUser, createReport, listBlockedUsers, unblockUser } from '../db/safetyRepo';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.use(requireAuth);

const createReportSchema = z.object({
  targetType: z.enum(REPORT_TARGET_TYPES),
  targetId: z.string().min(1),
  reason: z.string().trim().min(1).max(1000),
});

router.post(
  '/reports',
  asyncHandler(async (req, res) => {
    const parsed = createReportSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid input' });
    }
    await createReport({ id: uuid(), reporterId: req.userId!, ...parsed.data });
    res.status(201).json({ message: 'Report received' });
  })
);

router.get(
  '/blocks',
  asyncHandler(async (req, res) => {
    res.json(await listBlockedUsers(req.userId!));
  })
);

router.post(
  '/blocks',
  asyncHandler(async (req, res) => {
    const bodySchema = z.object({ blockedId: z.string().min(1) });
    const parsed = bodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid input' });
    }
    if (parsed.data.blockedId === req.userId) {
      return res.status(400).json({ message: 'You cannot block yourself' });
    }
    await blockUser(req.userId!, parsed.data.blockedId);
    res.status(201).json({ message: 'User blocked' });
  })
);

router.delete(
  '/blocks/:blockedId',
  asyncHandler(async (req, res) => {
    await unblockUser(req.userId!, req.params.blockedId);
    res.status(204).send();
  })
);

export default router;
