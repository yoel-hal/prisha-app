import { useCallback, useState } from 'react';

import { calcAllVesetim } from '../calculations';
import {
  formatGregorianLocal,
  gregorianToHebrewDate,
  hebrewDateToGregorian,
  parseGregorianLocal,
} from '../calculations/onah';
import type { HebrewDate, Onah, Period, VesetResult } from '../calculations/types';
import {
  deletePeriod as deletePeriodFromFirestore,
  updatePeriod as updatePeriodInFirestore,
} from '../firebase/firestore';
import { useAuthStore } from '../store/authStore';
import { usePeriodDraftStore } from '../store/periodDraftStore';
import { usePeriodsStore } from '../store/periodsStore';
import { useSettingsStore } from '../store/settingsStore';

function initialGregorianDate(period?: Period): Date {
  if (period) {
    return parseGregorianLocal(period.dateGregorian);
  }
  const draft = usePeriodDraftStore.getState().draft;
  if (draft) {
    return parseGregorianLocal(draft.dateGregorian);
  }
  return new Date();
}

function initialHebrewDate(period?: Period): HebrewDate {
  if (period) {
    return period.dateHebrew;
  }
  const draft = usePeriodDraftStore.getState().draft;
  if (draft) {
    return draft.dateHebrew;
  }
  return gregorianToHebrewDate(new Date());
}

function initialOnah(period?: Period): Onah {
  if (period) {
    return period.onah;
  }
  return usePeriodDraftStore.getState().draft?.onah ?? 'day';
}

function initialNotes(period?: Period): string {
  if (period) {
    return period.notes ?? '';
  }
  return usePeriodDraftStore.getState().draft?.notes ?? '';
}

export function usePeriodForm(existingPeriod?: Period) {
  const coupleId = useAuthStore((state) => state.coupleId);
  const user = useAuthStore((state) => state.user);
  const minhag = useSettingsStore((state) => state.minhag);
  const chumrot = useSettingsStore((state) => state.chumrot);
  const isEdit = existingPeriod !== undefined;

  const [gregorianDate, setGregorianDate] = useState(() =>
    initialGregorianDate(existingPeriod),
  );
  const [hebrewDate, setHebrewDate] = useState<HebrewDate>(() =>
    initialHebrewDate(existingPeriod),
  );
  const [onah, setOnah] = useState<Onah>(() => initialOnah(existingPeriod));
  const [notes, setNotes] = useState(() => initialNotes(existingPeriod));
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const setGregorian = useCallback((date: Date) => {
    setGregorianDate(date);
    setHebrewDate(gregorianToHebrewDate(date));
  }, []);

  const setHebrew = useCallback((date: HebrewDate) => {
    setHebrewDate(date);
    setGregorianDate(hebrewDateToGregorian(date));
  }, []);

  const recalculateVesetim = useCallback(
    (periods: Period[]): VesetResult[] => {
      return calcAllVesetim(periods, minhag, chumrot);
    },
    [minhag, chumrot],
  );

  const save = useCallback(async (): Promise<boolean> => {
    if (!coupleId || !user) {
      return false;
    }

    setIsSaving(true);
    try {
      const dateGregorian = formatGregorianLocal(gregorianDate);
      const trimmedNotes = notes.trim();

      if (isEdit && existingPeriod) {
        const payload: Partial<Period> = {
          dateGregorian,
          dateHebrew: hebrewDate,
          onah,
          notes: trimmedNotes || undefined,
        };
        await updatePeriodInFirestore(coupleId, existingPeriod.id, payload);

        const existing = usePeriodsStore.getState().periods;
        const updated: Period = {
          ...existingPeriod,
          ...payload,
          notes: trimmedNotes || undefined,
        };
        const allPeriods = existing
          .map((period) => (period.id === existingPeriod.id ? updated : period))
          .sort((a, b) => a.dateGregorian.localeCompare(b.dateGregorian));

        usePeriodsStore.getState().updatePeriod(updated);
        recalculateVesetim(allPeriods);
        return true;
      }

      return false;
    } finally {
      setIsSaving(false);
    }
  }, [
    coupleId,
    user,
    gregorianDate,
    hebrewDate,
    onah,
    notes,
    isEdit,
    existingPeriod,
    recalculateVesetim,
  ]);

  const remove = useCallback(async (): Promise<boolean> => {
    if (!coupleId || !existingPeriod) {
      return false;
    }

    setIsDeleting(true);
    try {
      await deletePeriodFromFirestore(coupleId, existingPeriod.id);
      const remaining = usePeriodsStore
        .getState()
        .periods.filter((period) => period.id !== existingPeriod.id);
      usePeriodsStore.getState().deletePeriod(existingPeriod.id);
      recalculateVesetim(remaining);
      return true;
    } finally {
      setIsDeleting(false);
    }
  }, [coupleId, existingPeriod, recalculateVesetim]);

  return {
    isEdit,
    gregorianDate,
    hebrewDate,
    onah,
    notes,
    isSaving,
    isDeleting,
    setGregorian,
    setHebrew,
    setOnah,
    setNotes,
    save,
    remove,
  };
}
