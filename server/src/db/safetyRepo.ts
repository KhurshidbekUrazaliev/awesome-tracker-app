import { and, eq } from 'drizzle-orm';
import { db } from './client';
import { blocks, reports, users } from './schema';
import { toPublicUser, type PublicUser } from './usersRepo';

export const REPORT_TARGET_TYPES = ['listing', 'user'] as const;
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];

export async function createReport(input: {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
}): Promise<void> {
  await db.insert(reports).values(input);
}

export async function blockUser(blockerId: string, blockedId: string): Promise<void> {
  await db.insert(blocks).values({ blockerId, blockedId }).onConflictDoNothing();
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
  await db.delete(blocks).where(and(eq(blocks.blockerId, blockerId), eq(blocks.blockedId, blockedId)));
}

export async function isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  const [row] = await db
    .select({ blockerId: blocks.blockerId })
    .from(blocks)
    .where(and(eq(blocks.blockerId, blockerId), eq(blocks.blockedId, blockedId)))
    .limit(1);
  return !!row;
}

/** Every user id that blockerId has blocked — used to filter listings/browsing out of their feed. */
export async function listBlockedIds(blockerId: string): Promise<string[]> {
  const rows = await db.select({ blockedId: blocks.blockedId }).from(blocks).where(eq(blocks.blockerId, blockerId));
  return rows.map((r) => r.blockedId);
}

export interface BlockedUser {
  user: PublicUser;
  createdAt: string;
}

export async function listBlockedUsers(blockerId: string): Promise<BlockedUser[]> {
  const rows = await db
    .select()
    .from(blocks)
    .innerJoin(users, eq(blocks.blockedId, users.id))
    .where(eq(blocks.blockerId, blockerId));
  return rows.map((r) => ({ user: toPublicUser(r.users), createdAt: r.blocks.createdAt.toISOString() }));
}
