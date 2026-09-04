import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { randomUUID as uuid } from 'node:crypto';
import { z } from 'zod';
import { deleteUser, findUserById, toPublicUser, updateUserProfile } from '../db/usersRepo';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { uploadToStorage } from '../storage';

const router = Router();
router.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  avatar: z.string().max(2048).optional(),
});

router.get(
  '/me',
  asyncHandler(async (req, res) => {
    const user = await findUserById(req.userId!);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(toPublicUser(user));
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await findUserById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(toPublicUser(user));
  })
);

router.patch(
  '/me',
  asyncHandler(async (req, res) => {
    const parsed = updateProfileSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid input' });
    }

    const updates: { name?: string; avatar?: string } = {};
    if (parsed.data.name) updates.name = parsed.data.name;
    if (parsed.data.avatar) updates.avatar = parsed.data.avatar;

    const user = await updateUserProfile(req.userId!, updates);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  })
);

router.post(
  '/me/avatar',
  upload.single('avatar'),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No avatar file uploaded' });

    const ext = path.extname(req.file.originalname) || '.jpg';
    const avatarUrl = await uploadToStorage(
      `avatars/${req.userId}/${uuid()}${ext}`,
      req.file.buffer,
      req.file.mimetype
    );

    const user = await updateUserProfile(req.userId!, { avatar: avatarUrl });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ avatar: avatarUrl });
  })
);

router.delete(
  '/me',
  asyncHandler(async (req, res) => {
    await deleteUser(req.userId!);
    res.status(204).send();
  })
);

export default router;
