import { useCallback, useState } from 'react';

import type { Period } from '../calculations/types';
import { addPeriod as addPeriodToFirestore } from '../firebase/firestore';
import { useAuthStore } from '../store/authStore';
import { usePeriodDraftStore } from '../store/periodDraftStore';
import { usePeriodsStore } from '../store/periodsStore';

export function useSavePeriodDraft() {
  const coupleId = useAuthStore((state) => state.coupleId);
  const user = useAuthStore((state) => state.user);
  const [isSaving, setIsSaving] = useState(false);

  const save = useCallback(async (): Promise<boolean> => {
    const draft = usePeriodDraftStore.getState().draft;
    if (!draft || !coupleId || !user) {
      return false;
    }

    setIsSaving(true);
    try {
      const trimmedNotes = draft.notes.trim();
      const periodData = {
        dateGregorian: draft.dateGregorian,
        dateHebrew: draft.dateHebrew,
        onah: draft.onah,
        notes: trimmedNotes || undefined,
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
      };

      const id = await addPeriodToFirestore(coupleId, periodData);
      const newPeriod: Period = { id, ...periodData };

      usePeriodsStore.getState().addPeriod(newPeriod);
      usePeriodDraftStore.getState().clearDraft();
      return true;
    } finally {
      setIsSaving(false);
    }
  }, [coupleId, user]);

  return { save, isSaving };
}
