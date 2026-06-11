import { router } from 'expo-router';
import type { User } from 'firebase/auth';
import type { TFunction } from 'i18next';
import { create } from 'zustand';

import {
  deleteUserAccount,
  RequiresReauthError,
  signOut,
} from '../firebase/auth';
import { auth } from '../firebase/config';
import { deleteAllUserData } from '../firebase/firestore';
import { showToast } from '../utils/toast';
import { useOnboardingStore } from './onboardingStore';
import { usePeriodsStore } from './periodsStore';
import {
  DEFAULT_CALENDAR_SETTINGS,
  DEFAULT_NOTIFICATION_SETTINGS,
  useSettingsStore,
} from './settingsStore';

const DEFAULT_CHUMROT = {
  kavuah: false,
  veshetEinah: false,
  onahBeinonitIfHaflaga: false,
  bothOnotOnBeinonit: false,
  bothOnotOnYomHaChodesh: false,
} as const;

export type DeleteAccountResult = 'success' | 'requires_reauth' | 'error';

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
  isDeletingAccount: boolean;
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
  deleteAccount: (t: TFunction) => Promise<DeleteAccountResult>;
}

function clearAllStoresAfterDelete(): void {
  useAuthStore.getState().setFirestoreOnboardingComplete(false);
  useAuthStore.getState().setUser(null);
  usePeriodsStore.setState({ periods: [], isLoading: true });
  useSettingsStore.setState({
    minhag: 'ashkenaz',
    chumrot: DEFAULT_CHUMROT,
    notifications: DEFAULT_NOTIFICATION_SETTINGS,
    calendar: DEFAULT_CALENDAR_SETTINGS,
  });
  useOnboardingStore.getState().reset();
}

const emptyProfile: UserProfileState = {
  firstName: '',
  lastName: '',
  country: '',
  phone: '',
};

export const useAuthStore = create<AuthState>((set, get) => ({
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
  isDeletingAccount: false,
  setUser: (user) =>
    set((state) => {
      if (!user) {
        return {
          user: null,
          ...emptyProfile,
          coupleId: null,
          isCoupleBootstrapping: false,
          firestoreOnboardingComplete: false,
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
    }),
  deleteAccount: async (t) => {
    const { coupleId } = get();
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      return 'error';
    }

    set({ isDeletingAccount: true });

    try {
      try {
        await deleteAllUserData(firebaseUser.uid, coupleId ?? '');
      } catch {
        // Data may already be deleted from a previous attempt — continue
      }

      try {
        await deleteUserAccount();
      } catch (error) {
        if (error instanceof RequiresReauthError) {
          return 'requires_reauth';
        }
        throw error;
      }

      const signOutResult = await signOut();
      if (!signOutResult.success) {
        throw new Error(signOutResult.error ?? 'Sign out failed');
      }

      clearAllStoresAfterDelete();
      router.replace('/(auth)/login');
      return 'success';
    } catch {
      showToast(t('deleteAccount.errorMessage'));
      return 'error';
    } finally {
      set({ isDeletingAccount: false });
    }
  },
}));
