import { useMemo } from 'react';

import { calcAllVesetim } from '../calculations';
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
  /** null when there is only one period, so no haflaga yet. */
  haflaga: VesetResult[] | null;
  yomHaChodesh: VesetResult[];
};

/**
 * What saving the draft would add: the full calculation with the draft included,
 * limited to the vesatot that come from the draft.
 */
export function usePeriodPreviewVesetim(draft: PeriodDraft): PeriodPreviewVesetim {
  const periods = usePeriodsStore((state) => state.periods);
  const minhag = useSettingsStore((state) => state.minhag);
  const chumrot = useSettingsStore((state) => state.chumrot);

  return useMemo(() => {
    const all = calcAllVesetim([...periods, draftToPeriod(draft)], minhag, chumrot);
    const fromDraft = (type: VesetResult['type']) =>
      all.filter((r) => r.type === type && r.sourcePeriodId === DRAFT_PERIOD_ID);

    return {
      onahBeinonit: fromDraft('onahBeinonit'),
      haflaga: periods.length >= 1 || chumrot.kavuah.type === 'haflaga' ? fromDraft('haflaga') : null,
      yomHaChodesh: fromDraft('yomHaChodesh'),
    };
  }, [draft, periods, minhag, chumrot]);
}
