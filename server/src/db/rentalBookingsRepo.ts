import { and, eq, gte, lte, ne } from 'drizzle-orm';
import { db } from './client';
import { rentalBookings, users } from './schema';
import { toPublicUser, type PublicUser } from './usersRepo';

export type BookingStatus = 'requested' | 'accepted' | 'confirmed' | 'declined' | 'completed' | 'cancelled';

export interface PublicBooking {
  id: string;
  listingId: string;
  renterId: string;
  renter?: PublicUser;
  startDate: string;
  endDate: string;
  rentalFeeCents: number;
  depositAmountCents: number;
  status: BookingStatus;
  depositResolution?: 'refunded' | 'claimed';
  depositClaimedCents?: number;
  createdAt: string;
}

function toPublicBooking(row: typeof rentalBookings.$inferSelect, renter?: typeof users.$inferSelect): PublicBooking {
  return {
    id: row.id,
    listingId: row.listingId,
    renterId: row.renterId,
    renter: renter ? toPublicUser(renter) : undefined,
    startDate: row.startDate,
    endDate: row.endDate,
    rentalFeeCents: row.rentalFeeCents,
    depositAmountCents: row.depositAmountCents,
    status: row.status as BookingStatus,
    depositResolution: (row.depositResolution as PublicBooking['depositResolution']) ?? undefined,
    depositClaimedCents: row.depositClaimedCents ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function createBookingRequest(input: {
  id: string;
  listingId: string;
  renterId: string;
  startDate: string;
  endDate: string;
  rentalFeeCents: number;
  depositAmountCents: number;
}): Promise<PublicBooking> {
  const [row] = await db.insert(rentalBookings).values(input).returning();
  return toPublicBooking(row);
}

export async function findBookingRowById(id: string) {
  const [row] = await db.select().from(rentalBookings).where(eq(rentalBookings.id, id)).limit(1);
  return row;
}

export async function findBookingRowByCheckoutSessionId(sessionId: string) {
  const [row] = await db.select().from(rentalBookings).where(eq(rentalBookings.stripeCheckoutSessionId, sessionId)).limit(1);
  return row;
}

/** All bookings for a listing — the owner's full view (every status, requester attached). */
export async function listBookingsForListing(listingId: string): Promise<PublicBooking[]> {
  const rows = await db
    .select()
    .from(rentalBookings)
    .innerJoin(users, eq(rentalBookings.renterId, users.id))
    .where(eq(rentalBookings.listingId, listingId));
  return rows.map((r) => toPublicBooking(r.rental_bookings, r.users));
}

/** One renter's own bookings on a listing, any status — lets them see where their request stands on revisit. */
export async function listBookingsForRenter(listingId: string, renterId: string): Promise<PublicBooking[]> {
  const rows = await db
    .select()
    .from(rentalBookings)
    .where(and(eq(rentalBookings.listingId, listingId), eq(rentalBookings.renterId, renterId)));
  return rows.map((r) => toPublicBooking(r));
}

/** Just the confirmed date ranges for a listing — the public availability-calendar view (no renter identity). */
export async function listConfirmedRanges(listingId: string): Promise<{ startDate: string; endDate: string }[]> {
  const rows = await db
    .select({ startDate: rentalBookings.startDate, endDate: rentalBookings.endDate })
    .from(rentalBookings)
    .where(and(eq(rentalBookings.listingId, listingId), eq(rentalBookings.status, 'confirmed')));
  return rows;
}

/** Whether a date range overlaps an already-confirmed booking on this listing. */
export async function hasConfirmedOverlap(listingId: string, startDate: string, endDate: string, excludeBookingId?: string): Promise<boolean> {
  const conditions = [
    eq(rentalBookings.listingId, listingId),
    eq(rentalBookings.status, 'confirmed'),
    lte(rentalBookings.startDate, endDate),
    gte(rentalBookings.endDate, startDate),
  ];
  if (excludeBookingId) conditions.push(ne(rentalBookings.id, excludeBookingId));
  const [row] = await db
    .select({ id: rentalBookings.id })
    .from(rentalBookings)
    .where(and(...conditions))
    .limit(1);
  return !!row;
}

export async function setBookingStatus(id: string, status: BookingStatus): Promise<void> {
  await db.update(rentalBookings).set({ status, updatedAt: new Date() }).where(eq(rentalBookings.id, id));
}

export async function setBookingCheckoutSession(id: string, stripeCheckoutSessionId: string): Promise<void> {
  await db.update(rentalBookings).set({ stripeCheckoutSessionId, updatedAt: new Date() }).where(eq(rentalBookings.id, id));
}

export async function confirmBookingPayment(id: string, stripePaymentIntentId: string): Promise<void> {
  await db
    .update(rentalBookings)
    .set({ status: 'confirmed', stripePaymentIntentId, updatedAt: new Date() })
    .where(eq(rentalBookings.id, id));
}

export async function completeBooking(
  id: string,
  resolution: { depositResolution: 'refunded' | 'claimed'; depositClaimedCents?: number }
): Promise<void> {
  await db
    .update(rentalBookings)
    .set({
      status: 'completed',
      depositResolution: resolution.depositResolution,
      depositClaimedCents: resolution.depositClaimedCents,
      updatedAt: new Date(),
    })
    .where(eq(rentalBookings.id, id));
}
