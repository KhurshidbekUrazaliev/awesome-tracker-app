import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { randomUUID as uuid } from 'node:crypto';
import { db, persist } from '../db';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { toPublicUser } from '../utils/serializers';

const router = Router();
router.use(requireAuth);

const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, '..', '..', 'uploads'),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || '.jpg';
      cb(null, `${uuid()}${ext}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
});

router.get(
  '/me',
  asyncHandler(async (req, res) => {
    const user = db.users.find((u) => u.id === req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(toPublicUser(user));
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = db.users.find((u) => u.id === req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(toPublicUser(user));
  })
);

router.patch(
  '/me',
  asyncHandler(async (req, res) => {
    const user = db.users.find((u) => u.id === req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, avatar } = req.body ?? {};
    if (typeof name === 'string' && name.trim()) user.name = name.trim();
    if (typeof avatar === 'string') user.avatar = avatar;

    persist();
    res.json(toPublicUser(user));
  })
);

router.post(
  '/me/avatar',
  upload.single('avatar'),
  asyncHandler(async (req, res) => {
    const user = db.users.find((u) => u.id === req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!req.file) return res.status(400).json({ message: 'No avatar file uploaded' });

    const avatarUrl = `/uploads/${req.file.filename}`;
    user.avatar = avatarUrl;
    persist();
    res.json({ avatar: avatarUrl });
  })
);

router.delete(
  '/me',
  asyncHandler(async (req, res) => {
    db.users = db.users.filter((u) => u.id !== req.userId);
    db.conversations = db.conversations.filter((c) => !c.participants.includes(req.userId!));
    db.messages = db.messages.filter((m) => m.senderId !== req.userId);
    persist();
    res.status(204).send();
  })
);

export default router;
