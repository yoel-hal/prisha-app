import { create } from 'zustand';

interface AdminState {
  pinVerified: boolean;
  setPinVerified: (verified: boolean) => void;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  pinVerified: false,
  setPinVerified: (verified) => set({ pinVerified: verified }),
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
}));
