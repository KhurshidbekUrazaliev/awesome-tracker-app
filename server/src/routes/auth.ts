import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { randomUUID as uuid } from 'node:crypto';
import { z } from 'zod';
import { db, persist } from '../db';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { signAuthToken, verifyAuthToken } from '../utils/jwt';
import { toPublicUser } from '../utils/serializers';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

router.post(
  '/signup',
  asyncHandler(async (req, res) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid input' });
    }
    const { name, email, password } = parsed.data;

    if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      id: uuid(),
      email,
      name,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    persist();

    const token = signAuthToken(user.id);
    res.status(201).json({ token, user: toPublicUser(user) });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    const { email, password } = parsed.data;

    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signAuthToken(user.id);
    res.json({ token, user: toPublicUser(user) });
  })
);

router.post('/logout', (_req, res) => {
  // Stateless JWTs: nothing to invalidate server-side. Client drops the token.
  res.status(204).send();
});

router.post(
  '/refresh',
  requireAuth,
  asyncHandler(async (req, res) => {
    const token = signAuthToken(req.userId!);
    res.json({ token });
  })
);

router.post(
  '/forgot-password',
  asyncHandler(async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email : undefined;
    const user = email && db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    // Always respond 200 so this endpoint can't be used to enumerate accounts.
    if (user) {
      const resetToken = signAuthToken(user.id);
      // No email provider is configured in this demo; log the reset link instead.
      // eslint-disable-next-line no-console
      console.log(`[password reset] ${user.email} -> reset token: ${resetToken}`);
    }
    res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
  })
);

router.post(
  '/reset-password',
  asyncHandler(async (req, res) => {
    const { token, password } = req.body ?? {};
    if (typeof token !== 'string' || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ message: 'Invalid token or password' });
    }

    let userId: string;
    try {
      userId = verifyAuthToken(token).sub;
    } catch {
      return res.status(400).json({ message: 'Reset link is invalid or has expired' });
    }

    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      return res.status(400).json({ message: 'Reset link is invalid or has expired' });
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    persist();
    res.status(200).json({ message: 'Password updated' });
  })
);

export default router;
