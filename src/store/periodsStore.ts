import { create } from 'zustand';

import type { Period } from '../calculations/types';

interface PeriodsState {
  periods: Period[];
  isLoading: boolean;
  setPeriods: (periods: Period[]) => void;
  setLoading: (loading: boolean) => void;
  addPeriod: (period: Period) => void;
  updatePeriod: (period: Period) => void;
  deletePeriod: (id: string) => void;
}

export const usePeriodsStore = create<PeriodsState>((set) => ({
  periods: [],
  isLoading: true,
  setPeriods: (periods) => set({ periods, isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),
  addPeriod: (period) =>
    set((state) => ({
      periods: [...state.periods, period].sort((a, b) =>
        a.dateGregorian.localeCompare(b.dateGregorian),
      ),
    })),
  updatePeriod: (period) =>
    set((state) => ({
      periods: state.periods
        .map((existing) => (existing.id === period.id ? period : existing))
        .sort((a, b) => a.dateGregorian.localeCompare(b.dateGregorian)),
    })),
  deletePeriod: (id) =>
    set((state) => ({
      periods: state.periods.filter((period) => period.id !== id),
    })),
}));
