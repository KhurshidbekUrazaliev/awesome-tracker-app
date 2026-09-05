import { NextFunction, Request, Response } from 'express';
import { findUserById } from '../db/usersRepo';

/**
 * Admin access is granted purely by email, via the ADMIN_EMAILS env var
 * (comma-separated) — deliberately no DB role/flag and no self-service way
 * to grant it, so there's no privilege-escalation surface to secure.
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (adminEmails.length === 0) {
    return res.status(403).json({ message: 'Admin access is not configured' });
  }

  const user = await findUserById(req.userId!);
  if (!user || !adminEmails.includes(user.email.toLowerCase())) {
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
}
