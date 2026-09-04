import { useState } from 'react';
import { useUserStore, type User } from '@/store/useUserStore';
import profileService from '../services/profileService';
import uploadService from '@/services/uploadService';

export function useProfile() {
  const { user, updateUser } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = async (data: Partial<User>) => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedUser = await profileService.updateProfile(data);
      updateUser(updatedUser);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to update profile';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateAvatar = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const image = await uploadService.pickImage();
      if (!image) return;

      const { avatar } = await profileService.updateAvatar(image.uri);
      updateUser({ avatar });
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to update avatar';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isLoading,
    error,
    updateProfile,
    updateAvatar,
  };
}
