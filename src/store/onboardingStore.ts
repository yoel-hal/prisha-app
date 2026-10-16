import { create } from 'zustand';

import type { Chumrot, Minhag } from '../calculations/types';
import type { OnboardingLanguage } from '../firebase/firestore';
import i18n from '../i18n';

const DEFAULT_CHUMROT: Chumrot = {
  kavuah: false,
  veshetEinah: false,
  onahBeinonitIfHaflaga: false,
  bothOnotOnBeinonit: false,
  bothOnotOnYomHaChodesh: false,
};

// Default to the language the app is showing, so skipping the language step
// (or reloading mid-onboarding on web) doesn't save English for a Hebrew user.
function initialState() {
  return {
    language: (i18n.language === 'he' ? 'he' : 'en') as OnboardingLanguage,
    minhag: 'ashkenaz' as Minhag,
    chumrot: DEFAULT_CHUMROT,
    country: '',
  };
}

interface OnboardingState {
  language: OnboardingLanguage;
  minhag: Minhag;
  chumrot: Chumrot;
  country: string;
  setLanguage: (language: OnboardingLanguage) => void;
  setMinhag: (minhag: Minhag) => void;
  setChumrot: (chumrot: Chumrot) => void;
  setCountry: (country: string) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState(),
  setLanguage: (language) => set({ language }),
  setMinhag: (minhag) => set({ minhag }),
  setChumrot: (chumrot) => set({ chumrot }),
  setCountry: (country) => set({ country }),
  reset: () => set(initialState()),
}));
