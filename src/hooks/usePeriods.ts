import { useEffect } from 'react';

import { subscribeToPeriods } from '../firebase/firestore';
import { useAuthStore } from '../store/authStore';
import { usePeriodsStore } from '../store/periodsStore';

export function usePeriods(): { periods: ReturnType<typeof usePeriodsStore.getState>['periods']; isLoading: boolean } {
  const coupleId = useAuthStore((state) => state.coupleId);
  const periods = usePeriodsStore((state) => state.periods);
  const isLoading = usePeriodsStore((state) => state.isLoading);
  const setPeriods = usePeriodsStore((state) => state.setPeriods);

  useEffect(() => {
    if (!coupleId) {
      setPeriods([]);
      return;
    }

    usePeriodsStore.setState({ isLoading: true });

    const unsubscribe = subscribeToPeriods(coupleId, (nextPeriods) => {
      setPeriods(nextPeriods);
    });

    return unsubscribe;
  }, [coupleId, setPeriods]);

  return { periods, isLoading };
}
