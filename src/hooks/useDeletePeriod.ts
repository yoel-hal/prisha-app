import { useCallback, useState } from 'react';

import { calcAllVesetim } from '../calculations';
import { deletePeriod as deletePeriodFromFirestore } from '../firebase/firestore';
import { useAuthStore } from '../store/authStore';
import { usePeriodsStore } from '../store/periodsStore';
import { useSettingsStore } from '../store/settingsStore';

/** Deletes a period by id and runs veset recalculation on the remaining periods. */
export function useDeletePeriod() {
  const coupleId = useAuthStore((state) => state.coupleId);
  const minhag = useSettingsStore((state) => state.minhag);
  const chumrot = useSettingsStore((state) => state.chumrot);
  const [isDeleting, setIsDeleting] = useState(false);

  const remove = useCallback(
    async (periodId: string): Promise<boolean> => {
      if (!coupleId) {
        return false;
      }

      setIsDeleting(true);
      try {
        await deletePeriodFromFirestore(coupleId, periodId);
        const remaining = usePeriodsStore
          .getState()
          .periods.filter((period) => period.id !== periodId);
        usePeriodsStore.getState().deletePeriod(periodId);
        calcAllVesetim(remaining, minhag, chumrot);
        return true;
      } finally {
        setIsDeleting(false);
      }
    },
    [coupleId, minhag, chumrot],
  );

  return { remove, isDeleting };
}
