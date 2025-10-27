import { create } from 'zustand';

interface ProfileData {
  bio?: string;
  website?: string;
  location?: string;
  phone?: string;
}

interface ProfileStore {
  profileData: ProfileData;
  isLoading: boolean;
  setProfileData: (data: ProfileData) => void;
  updateProfileData: (data: Partial<ProfileData>) => void;
  setLoading: (loading: boolean) => void;
}

export const useProfileStore = create<ProfileStore>((set) => ({
  profileData: {},
  isLoading: false,

  setProfileData: (profileData) => set({ profileData }),

  updateProfileData: (data) =>
    set((state) => ({
      profileData: { ...state.profileData, ...data },
    })),

  setLoading: (isLoading) => set({ isLoading }),
}));
