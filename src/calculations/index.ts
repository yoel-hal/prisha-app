import { calcHaflaga } from './haflaga';
import { calcOnahBeinonit } from './onahBeinonit';
import type { Minhag, Period, VesetResult } from './types';
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
 * Computes all three standard vestos (onah beinonit, haflaga, yom ha'chodesh) for the given history.
 * Uses the most recent period as the anchor for onah beinonit and yom ha'chodesh; passes the full
 * list to haflaga (which internally uses the last two by civil sort order).
 * Sources: Shulchan Aruch Yoreh De'ah 189:2, 189:4, 189:6.
 *
 * @param periods - Recorded periods (unsorted; will be ordered where needed)
 * @param minhag - Minhag affecting onah beinonit / yom ha'chodesh detail
 */
export function calcAllVesetim(periods: Period[], minhag: Minhag): VesetResult[] {
  const latest = getMostRecentPeriod(periods);
  const out: VesetResult[] = [];

  if (latest) {
    out.push(...calcOnahBeinonit(latest, minhag));
    out.push(...calcYomHaChodesh(latest, minhag));
  }

  out.push(...calcHaflaga(periods, minhag));

  return out.sort(compareVesetResults);
}
