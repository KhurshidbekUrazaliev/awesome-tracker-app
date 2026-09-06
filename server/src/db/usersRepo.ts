import { eq } from 'drizzle-orm';
import { db } from './client';
import { type LocationInput, type LocationSummary, toLocationSummary } from './locationFields';
import { users } from './schema';

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  location?: LocationSummary;
  createdAt: string;
}

/** `includeCoords` should be true only when the caller is this user themselves (e.g. their own profile edit screen). */
function toPublicUser(row: typeof users.$inferSelect, includeCoords = false): PublicUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatar: row.avatar ?? undefined,
    location: toLocationSummary(row, includeCoords),
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

export async function updateUserProfile(id: string, updates: { name?: string; avatar?: string } & LocationInput) {
  const [row] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
  return row ? toPublicUser(row, true) : undefined;
}

export async function updateUserPassword(id: string, passwordHash: string) {
  await db.update(users).set({ passwordHash }).where(eq(users.id, id));
}

export async function updatePushToken(id: string, pushToken: string): Promise<void> {
  await db.update(users).set({ pushToken }).where(eq(users.id, id));
}

/** A user's raw coordinates, for distance checks — never exposed directly to other users (see toPublicUser). */
export async function getUserLocation(id: string): Promise<{ lat: number; lng: number } | null> {
  const [row] = await db
    .select({ lat: users.locationLat, lng: users.locationLng })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return row?.lat != null && row?.lng != null ? { lat: row.lat, lng: row.lng } : null;
}

/** A user's full location, for defaulting a new listing's location to the owner's profile location. */
export async function getUserLocationFull(id: string): Promise<LocationInput | null> {
  const [row] = await db
    .select({
      locationLat: users.locationLat,
      locationLng: users.locationLng,
      locationCity: users.locationCity,
      locationRegion: users.locationRegion,
      locationCountry: users.locationCountry,
      locationCountryCode: users.locationCountryCode,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  if (!row || row.locationLat == null || row.locationLng == null) return null;
  return {
    locationLat: row.locationLat,
    locationLng: row.locationLng,
    locationCity: row.locationCity ?? undefined,
    locationRegion: row.locationRegion ?? undefined,
    locationCountry: row.locationCountry ?? undefined,
    locationCountryCode: row.locationCountryCode ?? undefined,
  };
}

/** The raw Stripe Connect account id for a user, if any — not part of PublicUser. */
export async function getStripeAccountId(id: string): Promise<string | null> {
  const [row] = await db.select({ stripeAccountId: users.stripeAccountId }).from(users).where(eq(users.id, id)).limit(1);
  return row?.stripeAccountId ?? null;
}

export async function setStripeAccountId(id: string, stripeAccountId: string): Promise<void> {
  await db.update(users).set({ stripeAccountId }).where(eq(users.id, id));
}

export async function setStripeOnboardingComplete(stripeAccountId: string, complete: boolean): Promise<void> {
  await db.update(users).set({ stripeOnboardingComplete: complete }).where(eq(users.stripeAccountId, stripeAccountId));
}

export async function getConnectStatus(id: string): Promise<{ connected: boolean; onboardingComplete: boolean }> {
  const [row] = await db
    .select({ stripeAccountId: users.stripeAccountId, stripeOnboardingComplete: users.stripeOnboardingComplete })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return { connected: !!row?.stripeAccountId, onboardingComplete: row?.stripeOnboardingComplete ?? false };
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
