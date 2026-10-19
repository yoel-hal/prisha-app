import { formatGregorianLocal, hebrewDateToGregorian } from './onah';
import { onahKey, previousOnah, type HebrewOnah } from './hebrewCalendar';
import type { Minhag, Period, VesetResult, VesetType } from './types';

/** Builds a result. The civil date is added here only, for display. */
export function makeResult(
  type: VesetType,
  source: Period,
  target: HebrewOnah,
  minhag: Minhag,
  isKavuah = false,
): VesetResult {
  const dateGregorian = formatGregorianLocal(hebrewDateToGregorian(target.date));
  return {
    // Same id shape as before v1, so synced calendar events keep their ids.
    id: `veset-${type}-${source.id}-${dateGregorian}-${target.onah}`,
    type,
    dateGregorian,
    dateHebrew: target.date,
    onah: target.onah,
    sourcePeriodId: source.id,
    minhagLabel: minhag,
    isKavuah,
  };
}

/** The targets plus, with Ohr Zarua, the onah before each of them. */
export function withOhrZarua(targets: HebrewOnah[], ohrZarua: boolean): HebrewOnah[] {
  return ohrZarua ? [...targets.map(previousOnah), ...targets] : targets;
}

/** Drops repeated onot and sorts in Hebrew order (night before day). */
export function uniqueOnot(targets: HebrewOnah[]): HebrewOnah[] {
  const byKey = new Map<number, HebrewOnah>();
  for (const target of targets) {
    byKey.set(onahKey(target.date, target.onah), target);
  }
  return [...byKey.entries()].sort((a, b) => a[0] - b[0]).map(([, target]) => target);
}
