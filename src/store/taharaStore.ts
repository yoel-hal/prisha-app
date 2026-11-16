import { create } from 'zustand';

import type { TaharaCycle, TaharaSettings } from '../calculations/types';
import { DEFAULT_TAHARA_SETTINGS } from '../firebase/tahara';

interface TaharaStoreState {
  cycles: TaharaCycle[];
  settings: TaharaSettings;
  /** False until the rules allow reading (e.g. rules not deployed yet); the card then stays hidden. */
  available: boolean;
  setCycles: (cycles: TaharaCycle[]) => void;
  setSettings: (settings: TaharaSettings) => void;
  setAvailable: (available: boolean) => void;
}

export const useTaharaStore = create<TaharaStoreState>((set) => ({
  cycles: [],
  settings: DEFAULT_TAHARA_SETTINGS,
  available: false,
  setCycles: (cycles) => set({ cycles, available: true }),
  setSettings: (settings) => set({ settings }),
  setAvailable: (available) => set({ available }),
}));
