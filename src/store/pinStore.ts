import { Platform } from 'react-native';
import { create } from 'zustand';

const TAB_ID =
  Platform.OS === 'web' && typeof window !== 'undefined'
    ? (sessionStorage.getItem('tab_id') ??
      (() => {
        const id = Math.random().toString(36).slice(2);
        sessionStorage.setItem('tab_id', id);
        return id;
      })())
    : 'native';

function readWebUnlocked(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return false;
  }
  return sessionStorage.getItem(`unlocked_${TAB_ID}`) === '1';
}

interface PinState {
  /** False on every cold start until the user unlocks. */
  isUnlocked: boolean;
  /** True after app-lock settings are read from secure storage. */
  lockHydrated: boolean;
  setUnlocked: (unlocked: boolean) => void;
  setLockHydrated: (hydrated: boolean) => void;
  resetUnlock: () => void;
}

export const usePinStore = create<PinState>((set) => ({
  isUnlocked: Platform.OS === 'web' ? readWebUnlocked() : false,
  lockHydrated: false,
  setUnlocked: (unlocked) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (unlocked) {
        sessionStorage.setItem(`unlocked_${TAB_ID}`, '1');
      } else {
        sessionStorage.removeItem(`unlocked_${TAB_ID}`);
      }
    }
    set({ isUnlocked: unlocked });
  },
  setLockHydrated: (hydrated) => set({ lockHydrated: hydrated }),
  resetUnlock: () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      sessionStorage.removeItem(`unlocked_${TAB_ID}`);
    }
    set({ isUnlocked: false });
  },
}));
