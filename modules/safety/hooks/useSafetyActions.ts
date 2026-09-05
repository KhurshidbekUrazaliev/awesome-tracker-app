import { useState } from 'react';
import safetyService, { type ReportTargetType } from '../services/safetyService';

/** One-off report/block actions — no persistent list needed at the call site (see useBlockedUsers for that). */
export function useSafetyActions() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const report = async (targetType: ReportTargetType, targetId: string, reason: string) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await safetyService.report(targetType, targetId, reason);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit report');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const blockUser = async (userId: string) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await safetyService.blockUser(userId);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to block user');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { report, blockUser, isSubmitting, error };
}
