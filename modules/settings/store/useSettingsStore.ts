import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Settings {
  notifications: {
    enabled: boolean;
    messages: boolean;
    updates: boolean;
    sound: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    showOnlineStatus: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    biometricEnabled: boolean;
  };
}

interface SettingsStore extends Settings {
  updateNotifications: (notifications: Partial<Settings['notifications']>) => void;
  updatePrivacy: (privacy: Partial<Settings['privacy']>) => void;
  updateSecurity: (security: Partial<Settings['security']>) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      notifications: {
        enabled: true,
        messages: true,
        updates: true,
        sound: true,
      },
      privacy: {
        profileVisibility: 'public',
        showOnlineStatus: true,
      },
      security: {
        twoFactorEnabled: false,
        biometricEnabled: false,
      },

      updateNotifications: (notifications) =>
        set((state) => ({
          notifications: { ...state.notifications, ...notifications },
        })),

      updatePrivacy: (privacy) =>
        set((state) => ({
          privacy: { ...state.privacy, ...privacy },
        })),

      updateSecurity: (security) =>
        set((state) => ({
          security: { ...state.security, ...security },
        })),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
