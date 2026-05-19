import type { User } from 'firebase/auth';
import { create } from 'zustand';

export interface PendingCoupleInvite {
  inviteId: string;
  coupleId: string;
  inviterEmail: string;
}

interface AuthState {
  user: User | null;
  coupleId: string | null;
  partnerEmail: string | null;
  pendingInvite: PendingCoupleInvite | null;
  setUser: (user: User | null) => void;
  setCoupleId: (id: string | null) => void;
  setPartnerEmail: (email: string | null) => void;
  setPendingInvite: (invite: PendingCoupleInvite | null) => void;
  resetCoupleState: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  coupleId: null,
  partnerEmail: null,
  pendingInvite: null,
  setUser: (user) =>
    set({
      user,
      ...(user
        ? {}
        : {
            coupleId: null,
            partnerEmail: null,
            pendingInvite: null,
          }),
    }),
  setCoupleId: (id) => set({ coupleId: id }),
  setPartnerEmail: (email) => set({ partnerEmail: email }),
  setPendingInvite: (invite) => set({ pendingInvite: invite }),
  resetCoupleState: () =>
    set({
      partnerEmail: null,
      pendingInvite: null,
    }),
}));
