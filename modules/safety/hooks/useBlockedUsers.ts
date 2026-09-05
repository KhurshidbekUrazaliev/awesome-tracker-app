import { useCallback, useEffect, useState } from 'react';
import { useSafetyStore } from '../store/useSafetyStore';
import safetyService from '../services/safetyService';

export function useBlockedUsers() {
  const { blockedUsers, setBlockedUsers, removeBlockedUser } = useSafetyStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setBlockedUsers(await safetyService.getBlockedUsers());
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load blocked users');
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setBlockedUsers]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const unblock = async (userId: string) => {
    await safetyService.unblockUser(userId);
    removeBlockedUser(userId);
  };

  return { blockedUsers, isLoading, error, unblock, refresh: load };
}
