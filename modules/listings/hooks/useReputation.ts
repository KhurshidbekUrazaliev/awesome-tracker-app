import { useEffect, useState } from 'react';
import listingsService, { type ReputationSummary } from '../services/listingsService';
import type { Review } from '../store/useListingsStore';

export function useReputation(userId?: string) {
  const [summary, setSummary] = useState<ReputationSummary | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      try {
        setIsLoading(true);
        const data = await listingsService.getUserReputation(userId);
        if (!cancelled) {
          setSummary(data.summary);
          setReviews(data.reviews);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { summary, reviews, isLoading };
}
