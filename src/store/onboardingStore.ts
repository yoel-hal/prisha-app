import { create } from 'zustand';

import {
  isOnboardingComplete,
  setOnboardingComplete as persistOnboardingComplete,
} from '../utils/onboarding';

interface OnboardingState {
  loaded: boolean;
  complete: boolean;
  hydrate: () => Promise<void>;
  markComplete: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  loaded: false,
  complete: false,
  hydrate: async () => {
    const complete = await isOnboardingComplete();
    set({ complete, loaded: true });
  },
  markComplete: async () => {
    await persistOnboardingComplete();
    set({ complete: true, loaded: true });
  },
}));
