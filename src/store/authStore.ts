import type { User } from 'firebase/auth';
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  coupleId: string | null;
  setUser: (user: User | null) => void;
  setCoupleId: (id: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  coupleId: null,
  setUser: (user) =>
    set({
      user,
      coupleId: user?.uid ?? null,
    }),
  setCoupleId: (id) => set({ coupleId: id }),
}));
