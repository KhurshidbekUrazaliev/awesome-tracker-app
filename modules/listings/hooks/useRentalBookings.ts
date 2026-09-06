import { useCallback, useEffect, useState } from 'react';
import { Linking, Platform } from 'react-native';
import listingsService from '../services/listingsService';
import type { BookedRange, Booking } from '../store/useListingsStore';

/** `enabled` should be `listing.type === 'rental'` — skips fetching bookings for every other listing type. */
export function useRentalBookings(listingId: string, isOwner: boolean, enabled: boolean) {
  const [bookings, setBookings] = useState<Booking[]>([]); // owner's full view
  const [bookedRanges, setBookedRanges] = useState<BookedRange[]>([]); // public availability view
  const [myBookings, setMyBookings] = useState<Booking[]>([]); // renter's own bookings on this listing
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    try {
      setIsLoading(true);
      setError(null);
      if (isOwner) {
        setBookings(await listingsService.getBookings(listingId) as Booking[]);
      } else {
        const [ranges, mine] = await Promise.all([
          listingsService.getBookings(listingId) as Promise<BookedRange[]>,
          listingsService.getMyBookings(listingId),
        ]);
        setBookedRanges(ranges);
        setMyBookings(mine);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load availability');
    } finally {
      setIsLoading(false);
    }
  }, [listingId, isOwner, enabled]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const requestBooking = async (startDate: string, endDate: string) => {
    const booking = await listingsService.requestBooking(listingId, startDate, endDate);
    await load();
    return booking;
  };

  const acceptBooking = async (bookingId: string) => {
    await listingsService.acceptBooking(listingId, bookingId);
    await load();
  };

  const declineBooking = async (bookingId: string) => {
    await listingsService.declineBooking(listingId, bookingId);
    await load();
  };

  const payForBooking = async (bookingId: string) => {
    const url = await listingsService.getCheckoutUrl(listingId, bookingId);
    if (Platform.OS === 'web') {
      window.location.href = url;
    } else {
      await Linking.openURL(url);
    }
  };

  const completeBooking = async (bookingId: string, resolution: { depositAction: 'refund' | 'claim'; claimAmountCents?: number }) => {
    await listingsService.completeBooking(listingId, bookingId, resolution);
    await load();
  };

  return {
    bookings,
    bookedRanges,
    myBookings,
    isLoading,
    error,
    requestBooking,
    acceptBooking,
    declineBooking,
    payForBooking,
    completeBooking,
    refresh: load,
  };
}
