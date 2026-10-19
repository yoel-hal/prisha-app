import { addDays, normalizePeriods, toAbs } from './hebrewCalendar';
import { makeResult, tag, uniqueOnot, withOhrZarua } from './results';
import type { Chumrot, Minhag, Period, VesetResult } from './types';

/**
 * Haflaga from the last two periods only (earlier periods don't count without a kavuah):
 * the same number of days again from the latest, in the latest period's onah.
 * Ohr Zarua applies here too (open question 5, interim).
 * Source: Shulchan Aruch Yoreh De'ah 189:4; docs/חישובי-עונות-v1.docx §4.
 */
export function calcHaflaga(
  periods: Period[],
  minhag: Minhag,
  chumrot: Chumrot,
): VesetResult[] {
  const sorted = normalizePeriods(periods);
  if (sorted.length < 2) {
    return [];
  }
  const prev = sorted[sorted.length - 2]!;
  const latest = sorted[sorted.length - 1]!;
  const interval = toAbs(latest.dateHebrew) - toAbs(prev.dateHebrew);
  return haflagaResults(latest, interval, minhag, chumrot, false);
}

/** Kavuah haflaga of `days` (counting both days) from the latest period. */
export function calcKavuahHaflaga(
  latest: Period,
  days: number,
  minhag: Minhag,
  chumrot: Chumrot,
): VesetResult[] {
  return haflagaResults(latest, days - 1, minhag, chumrot, true);
}

function haflagaResults(
  latest: Period,
  daysLater: number,
  minhag: Minhag,
  chumrot: Chumrot,
  isKavuah: boolean,
): VesetResult[] {
  const date = addDays(latest.dateHebrew, daysLater);
  return uniqueOnot(withOhrZarua(tag([{ date, onah: latest.onah }], 'main'), chumrot.ohrZarua)).map(
    (target) => makeResult('haflaga', latest, target, minhag, isKavuah),
  );
}
