import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { randomUUID as uuid } from 'node:crypto';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, '..', '..', 'uploads'),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || '';
      cb(null, `${uuid()}${ext}`);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
});

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  res.status(201).json({
    url: `/uploads/${req.file.filename}`,
    fileName: req.file.originalname,
    fileSize: req.file.size,
  });
});

export default router;
