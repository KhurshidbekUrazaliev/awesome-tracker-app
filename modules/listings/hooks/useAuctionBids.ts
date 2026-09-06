import { useCallback, useEffect, useState } from 'react';
import { Linking, Platform } from 'react-native';
import listingsService from '../services/listingsService';
import type { AuctionBid } from '../store/useListingsStore';

/**
 * `enabled` should be `listing.type === 'auction'` — skips fetching bid
 * history for every other listing type. Unlike rentals, the current
 * bid/price lives on the listing object itself (currentBidCents), not here —
 * after placeBid/payForAuction, the caller should re-fetch the listing via
 * useListingDetail's `refresh()` to pick up the new state.
 */
export function useAuctionBids(listingId: string, isOwner: boolean, enabled: boolean) {
  const [bids, setBids] = useState<AuctionBid[]>([]); // owner's full bid history
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled || !isOwner) return;
    try {
      setIsLoading(true);
      setError(null);
      setBids(await listingsService.getBids(listingId));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load bid history');
    } finally {
      setIsLoading(false);
    }
  }, [listingId, isOwner, enabled]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const placeBid = async (amountCents: number) => {
    return listingsService.placeBid(listingId, amountCents);
  };

  const payForAuction = async () => {
    const url = await listingsService.getAuctionCheckoutUrl(listingId);
    if (Platform.OS === 'web') {
      window.location.href = url;
    } else {
      await Linking.openURL(url);
    }
  };

  return {
    bids,
    isLoading,
    error,
    placeBid,
    payForAuction,
    refresh: load,
  };
}
