import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { randomUUID as uuid } from 'node:crypto';
import { requireAuth } from '../middleware/auth';
import { uploadToStorage } from '../storage';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

router.post(
  '/',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const ext = path.extname(req.file.originalname) || '';
    const url = await uploadToStorage(`files/${req.userId}/${uuid()}${ext}`, req.file.buffer, req.file.mimetype);

    res.status(201).json({
      url,
      fileName: req.file.originalname,
      fileSize: req.file.size,
    });
  })
);

export default router;
