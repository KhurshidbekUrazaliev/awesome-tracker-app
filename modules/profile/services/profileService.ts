import apiClient from '@/services/apiClient';
import { User } from '@/store/useUserStore';

class ProfileService {
  async getProfile(userId: string): Promise<User> {
    const response = await apiClient.get<User>(`/users/${userId}`);
    return response.data;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.patch<User>('/users/me', data);
    return response.data;
  }

  async updateAvatar(uri: string): Promise<{ avatar: string }> {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'avatar';
    
    formData.append('avatar', {
      uri,
      name: filename,
      type: 'image/jpeg',
    } as any);

    const response = await apiClient.post<{ avatar: string }>('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  async deleteAccount(): Promise<void> {
    await apiClient.delete('/users/me');
  }
}

export default new ProfileService();
