import { useCallback, useState } from 'react';

import {
  formatGregorianLocal,
  gregorianToHebrewDate,
  hebrewDateToGregorian,
} from '../calculations/onah';
import { calcAllVesetim } from '../calculations';
import type { HebrewDate, Onah, VesetResult } from '../calculations/types';
import { addPeriod as addPeriodToFirestore } from '../firebase/firestore';
import { useAuthStore } from '../store/authStore';
import { usePeriodsStore } from '../store/periodsStore';
import { useSettingsStore } from '../store/settingsStore';

export function useAddPeriod() {
  const coupleId = useAuthStore((state) => state.coupleId);
  const user = useAuthStore((state) => state.user);
  const minhag = useSettingsStore((state) => state.minhag);

  const [gregorianDate, setGregorianDate] = useState(() => new Date());
  const [hebrewDate, setHebrewDate] = useState<HebrewDate>(() =>
    gregorianToHebrewDate(new Date()),
  );
  const [onah, setOnah] = useState<Onah>('day');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [confirmationVesetim, setConfirmationVesetim] = useState<
    VesetResult[] | null
  >(null);

  const setGregorian = useCallback((date: Date) => {
    setGregorianDate(date);
    setHebrewDate(gregorianToHebrewDate(date));
  }, []);

  const setHebrew = useCallback((date: HebrewDate) => {
    setHebrewDate(date);
    setGregorianDate(hebrewDateToGregorian(date));
  }, []);

  const clearConfirmation = useCallback(() => {
    setConfirmationVesetim(null);
  }, []);

  const save = useCallback(async (): Promise<boolean> => {
    if (!coupleId || !user) {
      return false;
    }

    setIsSaving(true);
    try {
      const periodData = {
        dateGregorian: formatGregorianLocal(gregorianDate),
        dateHebrew: hebrewDate,
        onah,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
      };

      const id = await addPeriodToFirestore(coupleId, periodData);
      const newPeriod = { id, ...periodData };

      const existing = usePeriodsStore.getState().periods;
      const allPeriods = [...existing, newPeriod].sort((a, b) =>
        a.dateGregorian.localeCompare(b.dateGregorian),
      );
      const vesetim = calcAllVesetim(allPeriods, minhag);
      setConfirmationVesetim(vesetim);
      setNotes('');
      return true;
    } finally {
      setIsSaving(false);
    }
  }, [coupleId, user, gregorianDate, hebrewDate, onah, notes, minhag]);

  return {
    gregorianDate,
    hebrewDate,
    onah,
    notes,
    isSaving,
    confirmationVesetim,
    setGregorian,
    setHebrew,
    setOnah,
    setNotes,
    save,
    clearConfirmation,
  };
}
