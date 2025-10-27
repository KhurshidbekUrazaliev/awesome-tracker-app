import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

interface UserStore {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  clearUser: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),
      clearUser: () =>
        set({
          user: null,
          isAuthenticated: false,
        }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
