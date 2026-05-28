import { useMemo } from 'react';

import { calcAllVesetim } from '../calculations';
import type { VesetResult } from '../calculations/types';
import { usePeriodsStore } from '../store/periodsStore';
import { useSettingsStore } from '../store/settingsStore';

export function useVesetCalculations(): { vesetim: VesetResult[] } {
  const periods = usePeriodsStore((state) => state.periods);
  const minhag = useSettingsStore((state) => state.minhag);
  const chumrot = useSettingsStore((state) => state.chumrot);

  const vesetim = useMemo(
    () => calcAllVesetim(periods, minhag, chumrot),
    [periods, minhag, chumrot],
  );

  return { vesetim };
}
