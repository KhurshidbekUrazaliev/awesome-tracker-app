import apiClient from '@/services/apiClient';
import type { ReportTargetType } from '@/modules/safety/services/safetyService';

export interface AdminReport {
  id: string;
  reporterId: string;
  reporter?: { id: string; name: string; email: string };
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  resolved: boolean;
  createdAt: string;
  target: { title: string; status: string } | { id: string; name: string; email: string } | null;
}

class AdminService {
  async getReports(): Promise<AdminReport[]> {
    const response = await apiClient.get<AdminReport[]>('/admin/reports');
    return response.data;
  }

  async resolveReport(id: string): Promise<void> {
    await apiClient.post(`/admin/reports/${id}/resolve`);
  }

  async closeListing(id: string): Promise<void> {
    await apiClient.post(`/admin/listings/${id}/close`);
  }
}

export default new AdminService();
