import { calcHaflaga } from './haflaga';
import { calcOnahBeinonit } from './onahBeinonit';
import type { Chumrot, Minhag, Period, VesetResult } from './types';
import { calcYomHaChodesh } from './yomHaChodesh';

function sortPeriodsAsc(a: Period, b: Period): number {
  return a.dateGregorian.localeCompare(b.dateGregorian);
}

function getMostRecentPeriod(periods: Period[]): Period | undefined {
  if (periods.length === 0) {
    return undefined;
  }
  return [...periods].sort(sortPeriodsAsc).at(-1);
}

function compareVesetResults(a: VesetResult, b: VesetResult): number {
  const byDate = a.dateGregorian.localeCompare(b.dateGregorian);
  if (byDate !== 0) {
    return byDate;
  }
  if (a.onah !== b.onah) {
    return a.onah === 'day' ? -1 : 1;
  }
  return a.type.localeCompare(b.type);
}

/**
 * Computes all three standard vestos for the given period history.
 * Passes minhag to select the base strategy and chumrot to apply
 * additional strictnesses on top.
 * Sources: Shulchan Aruch Yoreh De'ah 189:2, 189:4, 189:6
 *
 * @param periods - All recorded periods (unsorted)
 * @param minhag  - Community tradition
 * @param chumrot - Additional strictnesses
 */
export function calcAllVesetim(
  periods: Period[],
  minhag: Minhag,
  chumrot: Chumrot,
): VesetResult[] {
  const latest = getMostRecentPeriod(periods);
  const out: VesetResult[] = [];

  if (latest) {
    out.push(...calcOnahBeinonit(latest, minhag, chumrot));
    out.push(...calcYomHaChodesh(latest, minhag, chumrot));
  }

  out.push(...calcHaflaga(periods, minhag, chumrot));

  return out.sort(compareVesetResults);
}
