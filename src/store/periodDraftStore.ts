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
  /** Bumped after a period is saved, so the add-period form remounts empty. */
  formKey: number;
  setDraft: (draft: PeriodDraft) => void;
  clearDraft: () => void;
  /** Clears the draft and resets the add-period form (today, day onah, no notes). */
  resetAfterSave: () => void;
}

export const usePeriodDraftStore = create<PeriodDraftState>((set) => ({
  draft: null,
  formKey: 0,
  setDraft: (draft) => set({ draft }),
  clearDraft: () => set({ draft: null }),
  resetAfterSave: () => set((state) => ({ draft: null, formKey: state.formKey + 1 })),
}));
