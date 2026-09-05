import { eq } from 'drizzle-orm';
import { db } from './client';
import { users } from './schema';

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

function toPublicUser(row: typeof users.$inferSelect): PublicUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatar: row.avatar ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function findUserByEmail(email: string) {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return row;
}

export async function findUserById(id: string) {
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return row;
}

export async function createUser(input: { id: string; email: string; name: string; passwordHash: string }) {
  const [row] = await db
    .insert(users)
    .values({ ...input, email: input.email.toLowerCase() })
    .returning();
  return toPublicUser(row);
}

export async function updateUserProfile(id: string, updates: { name?: string; avatar?: string }) {
  const [row] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
  return row ? toPublicUser(row) : undefined;
}

export async function updateUserPassword(id: string, passwordHash: string) {
  await db.update(users).set({ passwordHash }).where(eq(users.id, id));
}

export async function updatePushToken(id: string, pushToken: string): Promise<void> {
  await db.update(users).set({ pushToken }).where(eq(users.id, id));
}

/** The raw push token for a user, for sending notifications — not part of PublicUser. */
export async function getPushToken(id: string): Promise<string | null> {
  const [row] = await db.select({ pushToken: users.pushToken }).from(users).where(eq(users.id, id)).limit(1);
  return row?.pushToken ?? null;
}

export async function deleteUser(id: string) {
  // Conversations/messages cascade via FK ON DELETE CASCADE (see schema.ts).
  // A conversation with no participants left over is harmless — it just
  // never surfaces in anyone's conversation list again.
  await db.delete(users).where(eq(users.id, id));
}

export async function userExists(id: string) {
  const [row] = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
  return !!row;
}

export { toPublicUser };
