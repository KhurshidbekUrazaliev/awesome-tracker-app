import { create } from 'zustand';
import type { User as PublicUser } from '@/store/useUserStore';

export interface BlockedUser {
  user: PublicUser;
  createdAt: string;
}

interface SafetyStore {
  blockedUsers: BlockedUser[];
  setBlockedUsers: (users: BlockedUser[]) => void;
  removeBlockedUser: (userId: string) => void;
}

export const useSafetyStore = create<SafetyStore>((set) => ({
  blockedUsers: [],
  setBlockedUsers: (blockedUsers) => set({ blockedUsers }),
  removeBlockedUser: (userId) =>
    set((state) => ({ blockedUsers: state.blockedUsers.filter((b) => b.user.id !== userId) })),
}));
