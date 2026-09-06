import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { reverseGeocode, searchPlaces } from '../utils/geo';

const router = Router();
router.use(requireAuth);

const reverseSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

router.get(
  '/reverse',
  asyncHandler(async (req, res) => {
    const parsed = reverseSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid input' });
    }
    const place = await reverseGeocode(parsed.data.lat, parsed.data.lng);
    res.json(place ?? { lat: parsed.data.lat, lng: parsed.data.lng });
  })
);

const searchSchema = z.object({ q: z.string().trim().min(1).max(200) });

router.get(
  '/search',
  asyncHandler(async (req, res) => {
    const parsed = searchSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid input' });
    }
    res.json(await searchPlaces(parsed.data.q));
  })
);

export default router;
