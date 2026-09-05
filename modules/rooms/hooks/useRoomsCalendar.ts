import { useCallback, useEffect, useState } from 'react';
import roomsService from '../services/roomsService';
import type { CalendarItem } from '../store/useRoomsStore';

export function useRoomsCalendar() {
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setItems(await roomsService.getCalendarItems());
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load calendar');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return { items, isLoading, error, refresh: load };
}
