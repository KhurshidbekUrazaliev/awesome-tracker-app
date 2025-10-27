import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthStore {
  token: string | null;
  isLoading: boolean;
  error: string | null;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  isLoading: false,
  error: null,
  
  setToken: (token) => set({ token }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  logout: async () => {
    await AsyncStorage.removeItem('authToken');
    set({ token: null, error: null });
  },
}));
