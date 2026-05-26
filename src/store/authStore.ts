import type { User } from 'firebase/auth';
import { create } from 'zustand';

export interface UserProfileState {
  firstName: string;
  lastName: string;
  country: string;
  phone: string;
}

export type AppLockType = 'pin' | 'biometric';

interface AuthState {
  user: User | null;
  firstName: string;
  lastName: string;
  country: string;
  phone: string;
  coupleId: string | null;
  isPartnerMode: boolean;
  ownerUserId: string | null;
  ownerName: string | null;
  isCoupleBootstrapping: boolean;
  firestoreOnboardingComplete: boolean;
  appLockEnabled: boolean;
  appLockType: AppLockType | null;
  isAppLocked: boolean;
  setUser: (user: User | null) => void;
  setUserProfile: (profile: UserProfileState) => void;
  setCoupleId: (id: string | null) => void;
  setPartnerMode: (
    isPartner: boolean,
    ownerUserId: string | null,
    ownerName: string | null,
  ) => void;
  setCoupleBootstrapping: (bootstrapping: boolean) => void;
  setFirestoreOnboardingComplete: (complete: boolean) => void;
  resetCoupleState: () => void;
  setAppLock: (enabled: boolean, type: AppLockType | null) => void;
  setIsAppLocked: (locked: boolean) => void;
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
  isPartnerMode: false,
  ownerUserId: null,
  ownerName: null,
  isCoupleBootstrapping: false,
  firestoreOnboardingComplete: false,
  appLockEnabled: false,
  appLockType: null,
  isAppLocked: false,
  setUser: (user) =>
    set((state) => {
      if (!user) {
        return {
          user: null,
          ...emptyProfile,
          coupleId: null,
          isCoupleBootstrapping: false,
          firestoreOnboardingComplete: false,
          isAppLocked: false,
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
              isCoupleBootstrapping: false,
              firestoreOnboardingComplete: false,
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
  setPartnerMode: (isPartner, ownerUserId, ownerName) =>
    set({ isPartnerMode: isPartner, ownerUserId, ownerName }),
  setCoupleBootstrapping: (bootstrapping) =>
    set({ isCoupleBootstrapping: bootstrapping }),
  setFirestoreOnboardingComplete: (complete) =>
    set({ firestoreOnboardingComplete: complete }),
  resetCoupleState: () =>
    set({
      ownerUserId: null,
      ownerName: null,
    }),
  setAppLock: (enabled, type) =>
    set({
      appLockEnabled: enabled,
      appLockType: type,
      isAppLocked: false,
    }),
  setIsAppLocked: (locked) => set({ isAppLocked: locked }),
}));
