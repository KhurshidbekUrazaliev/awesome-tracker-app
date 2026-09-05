import { and, desc, eq } from 'drizzle-orm';
import { db } from './client';
import { blocks, reports, users } from './schema';
import { toPublicUser, type PublicUser } from './usersRepo';

export const REPORT_TARGET_TYPES = ['listing', 'user'] as const;
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];

export interface PublicReport {
  id: string;
  reporterId: string;
  reporter?: PublicUser;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  resolved: boolean;
  createdAt: string;
}

function toPublicReport(row: typeof reports.$inferSelect, reporter?: typeof users.$inferSelect): PublicReport {
  return {
    id: row.id,
    reporterId: row.reporterId,
    reporter: reporter ? toPublicUser(reporter) : undefined,
    targetType: row.targetType as ReportTargetType,
    targetId: row.targetId,
    reason: row.reason,
    resolved: row.resolved,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function createReport(input: {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
}): Promise<void> {
  await db.insert(reports).values(input);
}

/** Admin-only: every report, newest first, with the reporter attached. */
export async function listAllReports(): Promise<PublicReport[]> {
  const rows = await db
    .select()
    .from(reports)
    .innerJoin(users, eq(reports.reporterId, users.id))
    .orderBy(desc(reports.createdAt));
  return rows.map((r) => toPublicReport(r.reports, r.users));
}

export async function resolveReport(id: string): Promise<void> {
  await db.update(reports).set({ resolved: true }).where(eq(reports.id, id));
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
