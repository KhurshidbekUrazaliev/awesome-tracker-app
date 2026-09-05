import apiClient from '@/services/apiClient';
import type { BlockedUser } from '../store/useSafetyStore';

export type ReportTargetType = 'listing' | 'user';

class SafetyService {
  async report(targetType: ReportTargetType, targetId: string, reason: string): Promise<void> {
    await apiClient.post('/safety/reports', { targetType, targetId, reason });
  }

  async blockUser(blockedId: string): Promise<void> {
    await apiClient.post('/safety/blocks', { blockedId });
  }

  async unblockUser(blockedId: string): Promise<void> {
    await apiClient.delete(`/safety/blocks/${blockedId}`);
  }

  async getBlockedUsers(): Promise<BlockedUser[]> {
    const response = await apiClient.get<BlockedUser[]>('/safety/blocks');
    return response.data;
  }
}

export default new SafetyService();
