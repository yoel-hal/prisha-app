import { useMemo } from 'react';

import {
  calcHaflaga,
  calcOnahBeinonit,
  calcYomHaChodesh,
} from '../calculations';
import type { Period, VesetResult } from '../calculations/types';
import type { PeriodDraft } from '../store/periodDraftStore';
import { usePeriodsStore } from '../store/periodsStore';
import { useSettingsStore } from '../store/settingsStore';

const DRAFT_PERIOD_ID = '__draft__';

function draftToPeriod(draft: PeriodDraft): Period {
  return {
    id: DRAFT_PERIOD_ID,
    dateGregorian: draft.dateGregorian,
    dateHebrew: draft.dateHebrew,
    onah: draft.onah,
    notes: draft.notes.trim() || undefined,
    createdAt: '',
    createdBy: '',
  };
}

export type PeriodPreviewVesetim = {
  onahBeinonit: VesetResult[];
  haflaga: VesetResult[] | null;
  yomHaChodesh: VesetResult[];
};

export function usePeriodPreviewVesetim(
  draft: PeriodDraft,
): PeriodPreviewVesetim {
  const periods = usePeriodsStore((state) => state.periods);
  const minhag = useSettingsStore((state) => state.minhag);
  const chumrot = useSettingsStore((state) => state.chumrot);

  return useMemo(() => {
    const draftPeriod = draftToPeriod(draft);
    const allPeriods = [...periods, draftPeriod].sort((a, b) =>
      a.dateGregorian.localeCompare(b.dateGregorian),
    );

    return {
      onahBeinonit: calcOnahBeinonit(draftPeriod, minhag, chumrot),
      haflaga:
        allPeriods.length >= 2
          ? calcHaflaga(allPeriods, minhag, chumrot)
          : null,
      yomHaChodesh: calcYomHaChodesh(draftPeriod, minhag, chumrot),
    };
  }, [draft, periods, minhag, chumrot]);
}
