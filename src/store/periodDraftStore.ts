import { create } from 'zustand';

import type { HebrewDate, Onah } from '../calculations/types';

export type PeriodDraft = {
  dateGregorian: string;
  dateHebrew: HebrewDate;
  onah: Onah;
  notes: string;
};

interface PeriodDraftState {
  draft: PeriodDraft | null;
  setDraft: (draft: PeriodDraft) => void;
  clearDraft: () => void;
}

export const usePeriodDraftStore = create<PeriodDraftState>((set) => ({
  draft: null,
  setDraft: (draft) => set({ draft }),
  clearDraft: () => set({ draft: null }),
}));
