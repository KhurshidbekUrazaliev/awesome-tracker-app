import { useEffect, useState } from 'react';
import listingsService, { type TrendingCategory } from '../services/listingsService';

/** Top categories among open listings — powers "trending" quick filters on the browse feed. */
export function useTrendingCategories() {
  const [categories, setCategories] = useState<TrendingCategory[]>([]);

  useEffect(() => {
    listingsService
      .getTrendingCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  return categories;
}
