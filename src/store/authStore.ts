import type { User } from 'firebase/auth';
import { create } from 'zustand';

export interface PendingCoupleInvite {
  inviteId: string;
  coupleId: string;
  inviterEmail: string;
}

export interface OutgoingCoupleInvite {
  inviteId: string;
  partnerEmail: string;
  expiresAt: string;
}

export interface UserProfileState {
  firstName: string;
  lastName: string;
  country: string;
  phone: string;
}

interface AuthState {
  user: User | null;
  firstName: string;
  lastName: string;
  country: string;
  phone: string;
  coupleId: string | null;
  partnerEmail: string | null;
  pendingInvite: PendingCoupleInvite | null;
  outgoingInvite: OutgoingCoupleInvite | null;
  isCoupleBootstrapping: boolean;
  setUser: (user: User | null) => void;
  setUserProfile: (profile: UserProfileState) => void;
  setCoupleId: (id: string | null) => void;
  setPartnerEmail: (email: string | null) => void;
  setPendingInvite: (invite: PendingCoupleInvite | null) => void;
  setOutgoingInvite: (invite: OutgoingCoupleInvite | null) => void;
  setCoupleBootstrapping: (bootstrapping: boolean) => void;
  resetCoupleState: () => void;
}

const emptyProfile: UserProfileState = {
  firstName: '',
  lastName: '',
  country: '',
  phone: '',
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  ...emptyProfile,
  coupleId: null,
  partnerEmail: null,
  pendingInvite: null,
  outgoingInvite: null,
  isCoupleBootstrapping: false,
  setUser: (user) =>
    set((state) => {
      if (!user) {
        return {
          user: null,
          ...emptyProfile,
          coupleId: null,
          partnerEmail: null,
          pendingInvite: null,
          outgoingInvite: null,
          isCoupleBootstrapping: false,
        };
      }

      const switchedAccount =
        state.user !== null && state.user.uid !== user.uid;

      return {
        user,
        ...(switchedAccount
          ? {
              ...emptyProfile,
              coupleId: null,
              partnerEmail: null,
              pendingInvite: null,
              outgoingInvite: null,
              isCoupleBootstrapping: false,
            }
          : {}),
      };
    }),
  setUserProfile: (profile) =>
    set({
      firstName: profile.firstName,
      lastName: profile.lastName,
      country: profile.country,
      phone: profile.phone,
    }),
  setCoupleId: (id) => set({ coupleId: id }),
  setPartnerEmail: (email) => set({ partnerEmail: email }),
  setPendingInvite: (invite) => set({ pendingInvite: invite }),
  setOutgoingInvite: (invite) => set({ outgoingInvite: invite }),
  setCoupleBootstrapping: (bootstrapping) =>
    set({ isCoupleBootstrapping: bootstrapping }),
  resetCoupleState: () =>
    set({
      partnerEmail: null,
      pendingInvite: null,
      outgoingInvite: null,
    }),
}));
