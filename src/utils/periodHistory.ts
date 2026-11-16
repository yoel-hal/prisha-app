import { calcAllVesetim } from '../calculations';
import { normalizePeriods, onahKey } from '../calculations/hebrewCalendar';
import type { Chumrot, Minhag, Period, VesetResult } from '../calculations/types';

/**
 * - upcoming: still in force and not yet come
 * - passed: its date has gone by
 * - replaced: a later period came first and took its place (haflaga is always
 *   counted from the last two periods)
 */
export type VesetStatus = 'upcoming' | 'passed' | 'replaced';

export type PeriodVeset = {
  veset: VesetResult;
  status: VesetStatus;
  /** The period that replaced it (status "replaced"). */
  replacedBy?: Period;
};

/**
 * Everything that was calculated from one period: what the app showed right after it
 * was recorded (the calculation with the periods up to it), with today's status.
 * Uses the current settings, also for the past.
 */
export function vesetimFromPeriod(
  periods: Period[],
  periodId: string,
  minhag: Minhag,
  chumrot: Chumrot,
  current: VesetResult[],
  today: string,
): PeriodVeset[] {
  const sorted = normalizePeriods(periods);
  const index = sorted.findIndex((period) => period.id === periodId);
  if (index === -1) {
    return [];
  }
  const next = sorted[index + 1];
  const currentIds = new Set(current.map((v) => v.id));

  return calcAllVesetim(sorted.slice(0, index + 1), minhag, chumrot)
    .filter((veset) => veset.sourcePeriodId === periodId)
    .map((veset): PeriodVeset => {
      if (currentIds.has(veset.id)) {
        return { veset, status: veset.dateGregorian >= today ? 'upcoming' : 'passed' };
      }
      if (
        veset.type === 'haflaga' &&
        next &&
        onahKey(next.dateHebrew, next.onah) < onahKey(veset.dateHebrew, veset.onah)
      ) {
        return { veset, status: 'replaced', replacedBy: next };
      }
      return { veset, status: 'passed' };
    });
}
