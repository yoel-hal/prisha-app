import { useCallback, useEffect, useMemo, useState } from 'react';

import { formatGregorianLocal, gregorianToHebrewDate } from '../calculations/onah';
import { hasNotCleanCheck, hefsekMinDays, taharaState, type TaharaState } from '../calculations/tahara';
import type { CheckKey, CheckResult, TaharaCycle, TaharaSettings } from '../calculations/types';
import {
  addTaharaCycle,
  clearNotCleanChecks,
  getTaharaSettings,
  saveTaharaSettings,
  setTaharaCheck,
  subscribeToTaharaCycles,
} from '../firebase/tahara';
import { useAuthStore } from '../store/authStore';
import { usePeriodsStore } from '../store/periodsStore';
import { useSettingsStore } from '../store/settingsStore';
import { useTaharaStore } from '../store/taharaStore';
import { logError } from '../utils/log';

/** Keeps the hefsek cycles and tahara settings in sync with Firestore. Mount once. */
export function useTaharaSync(): void {
  const coupleId = useAuthStore((state) => state.coupleId);

  useEffect(() => {
    const store = useTaharaStore.getState();
    if (!coupleId) {
      store.setCycles([]);
      store.setAvailable(false);
      return;
    }
    getTaharaSettings(coupleId)
      .then((settings) => useTaharaStore.getState().setSettings(settings))
      .catch((error: unknown) => logError('getTaharaSettings failed', error));
    return subscribeToTaharaCycles(
      coupleId,
      (cycles) => useTaharaStore.getState().setCycles(cycles),
      (error) => {
        logError('subscribeToTaharaCycles failed', error);
        useTaharaStore.getState().setAvailable(false);
      },
    );
  }, [coupleId]);
}

/** Today's civil date, refreshed every minute so the card turns over at midnight. */
function useToday(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => {
      const next = new Date();
      if (next.toDateString() !== now.toDateString()) {
        setNow(next);
      }
    }, 60_000);
    return () => clearInterval(id);
  }, [now]);
  return now;
}

export function useTahara(): {
  state: TaharaState;
  visible: boolean;
  settings: TaharaSettings;
  minDays: number;
  recordHefsek: (daysAgo: 0 | 1) => Promise<void>;
  recordCheck: (key: CheckKey, result: CheckResult | null) => Promise<void>;
  /** Clears the "not clean" marks of a restarted cycle (a mis-tap) and resumes it. */
  undoRestart: (cycle: TaharaCycle) => Promise<void>;
  saveSettings: (settings: TaharaSettings) => Promise<void>;
} {
  const coupleId = useAuthStore((s) => s.coupleId);
  const uid = useAuthStore((s) => s.user?.uid ?? '');
  const periods = usePeriodsStore((s) => s.periods);
  const minhag = useSettingsStore((s) => s.minhag);
  const { cycles, settings, available } = useTaharaStore();
  const today = useToday();

  const minDays = hefsekMinDays(minhag, settings.minDaysOverride);
  const state = useMemo(
    () => taharaState(periods, cycles, gregorianToHebrewDate(today), minDays),
    [periods, cycles, today, minDays],
  );

  const recordHefsek = useCallback(
    async (daysAgo: 0 | 1) => {
      if (!coupleId || (state.kind !== 'hefsekToday' && state.kind !== 'waitHefsek')) {
        return;
      }
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      await addTaharaCycle(coupleId, {
        periodId: state.period.id,
        hefsekDateGregorian: formatGregorianLocal(date),
        hefsekDateHebrew: gregorianToHebrewDate(date),
        checks: {},
        status: 'active',
        createdAt: new Date().toISOString(),
        createdBy: uid,
      });
    },
    [coupleId, state, today, uid],
  );

  const recordCheck = useCallback(
    async (key: CheckKey, result: CheckResult | null) => {
      if (!coupleId || (state.kind !== 'counting' && state.kind !== 'mikvehNight')) {
        return;
      }
      const next = { ...state.cycle.checks };
      if (result) {
        next[key] = result;
      } else {
        delete next[key];
      }
      await setTaharaCheck(coupleId, state.cycle.id, key, result, hasNotCleanCheck({ checks: next }));
    },
    [coupleId, state],
  );

  const undoRestart = useCallback(
    async (cycle: TaharaCycle) => {
      if (coupleId) {
        await clearNotCleanChecks(coupleId, cycle);
      }
    },
    [coupleId],
  );

  const saveSettings = useCallback(
    async (next: TaharaSettings) => {
      if (!coupleId) {
        return;
      }
      useTaharaStore.getState().setSettings(next);
      await saveTaharaSettings(coupleId, next);
    },
    [coupleId],
  );

  return {
    state,
    visible: available && settings.enabled && state.kind !== 'none',
    settings,
    minDays,
    recordHefsek,
    recordCheck,
    undoRestart,
    saveSettings,
  };
}
