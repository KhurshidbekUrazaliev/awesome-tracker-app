import { Router } from 'express';
import { findListingRowById, setListingStatus } from '../db/listingsRepo';
import { listAllReports, resolveReport } from '../db/safetyRepo';
import { findUserById, toPublicUser } from '../db/usersRepo';
import { requireAuth } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireAdmin';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get(
  '/reports',
  asyncHandler(async (req, res) => {
    const reports = await listAllReports();

    // Resolve what's actually being reported so an admin doesn't have to
    // cross-reference ids by hand — low volume, so N+1 lookups are fine here.
    const withTargets = await Promise.all(
      reports.map(async (report) => {
        if (report.targetType === 'listing') {
          const listing = await findListingRowById(report.targetId);
          return { ...report, target: listing ? { title: listing.title, status: listing.status } : null };
        }
        const user = await findUserById(report.targetId);
        return { ...report, target: user ? toPublicUser(user) : null };
      })
    );

    res.json(withTargets);
  })
);

router.post(
  '/reports/:id/resolve',
  asyncHandler(async (req, res) => {
    await resolveReport(req.params.id);
    res.status(204).send();
  })
);

router.post(
  '/listings/:id/close',
  asyncHandler(async (req, res) => {
    const listing = await findListingRowById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    await setListingStatus(req.params.id, 'closed');
    res.status(204).send();
  })
);

export default router;
