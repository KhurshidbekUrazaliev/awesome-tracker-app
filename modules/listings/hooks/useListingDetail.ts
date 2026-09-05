import { useCallback, useEffect, useState } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { useListingsStore, type Listing } from '../store/useListingsStore';
import listingsService from '../services/listingsService';

export function useListingDetail(listingId: string) {
  const { user } = useUserStore();
  const { interestsByListing, setInterests, addInterest, updateInterestStatus } = useListingsStore();
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = !!(listing && user && listing.ownerId === user.id);
  const interests = interestsByListing[listingId] || [];

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await listingsService.getListing(listingId);
      setListing(data);
      if (user && data.ownerId === user.id) {
        setInterests(listingId, await listingsService.getInterests(listingId));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load listing');
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId, user?.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const expressInterest = async (message?: string) => {
    const interest = await listingsService.expressInterest(listingId, message);
    addInterest(interest);
  };

  const acceptInterest = async (interestId: string) => {
    await listingsService.acceptInterest(listingId, interestId);
    updateInterestStatus(listingId, interestId, 'accepted');
    setListing((prev) => (prev ? { ...prev, status: 'pending' } : prev));
  };

  const complete = async () => {
    const { counterpartyId } = await listingsService.completeListing(listingId);
    setListing((prev) => (prev ? { ...prev, status: 'completed' } : prev));
    return counterpartyId;
  };

  const submitReview = async (rating: number, comment?: string) => {
    await listingsService.submitReview({ listingId, rating, comment });
  };

  return {
    listing,
    isOwner,
    interests,
    isLoading,
    error,
    expressInterest,
    acceptInterest,
    complete,
    submitReview,
    refresh: load,
  };
}
