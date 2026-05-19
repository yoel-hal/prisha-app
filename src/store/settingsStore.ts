import { create } from 'zustand';

import type { Chumrot, Minhag } from '../calculations/types';
import { getSettings, saveSettings as saveSettingsToFirestore } from '../firebase/firestore';

const DEFAULT_CHUMROT: Chumrot = {
  kavuah: false,
  veshetEinah: false,
  onahBeinonitIfHaflaga: false,
};

interface SettingsState {
  minhag: Minhag;
  chumrot: Chumrot;
  setMinhag: (minhag: Minhag) => void;
  setChumrot: (chumrot: Chumrot) => void;
  loadSettings: (coupleId: string) => Promise<void>;
  saveSettings: (coupleId: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  minhag: 'ashkenaz',
  chumrot: DEFAULT_CHUMROT,
  setMinhag: (minhag) => set({ minhag }),
  setChumrot: (chumrot) => set({ chumrot }),
  loadSettings: async (coupleId) => {
    const settings = await getSettings(coupleId);
    if (settings) {
      set({
        minhag: settings.minhag,
        chumrot: settings.chumrot,
      });
    }
  },
  saveSettings: async (coupleId) => {
    const { minhag, chumrot } = get();
    await saveSettingsToFirestore(coupleId, { minhag, chumrot });
  },
}));
