import { useCallback, useEffect, useState } from 'react';
import { useListingsStore, type ListingType } from '../store/useListingsStore';
import listingsService, { type CreateListingInput, type ListingFilters } from '../services/listingsService';

export function useListings() {
  const { listings, setListings } = useListingsStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ListingFilters>({});

  const load = useCallback(
    async (nextFilters: ListingFilters = filters) => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await listingsService.getListings(nextFilters);
        setListings(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load listings');
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setListings]
  );

  useEffect(() => {
    // Fetch on mount / whenever the active filters change — mirrors the
    // fetch-on-mount pattern used by useChat's loadConversations.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const search = (nextFilters: ListingFilters) => setFilters(nextFilters);

  const createListing = async (data: CreateListingInput) => {
    const listing = await listingsService.createListing(data);
    await load(filters);
    return listing;
  };

  return {
    listings,
    isLoading,
    error,
    filters,
    search,
    createListing,
    refresh: () => load(filters),
  };
}

export type { ListingType };
