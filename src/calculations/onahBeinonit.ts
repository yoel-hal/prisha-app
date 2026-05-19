/**
 * Onah Beinonit — the 30th day from period start, same onah.
 * Source: Shulchan Aruch Yoreh De'ah 189:2
 */

import { addHebrewDays, formatGregorianLocal, hebrewDateToGregorian } from './onah';
import type { Minhag, Period, VesetResult } from './types';

/** Inclusive Hebrew-day counting: day 1 is the anchor Hebrew date; day 30 is anchor + 29 Hebrew days. */
const HEBREW_DAYS_FROM_DAY_1_TO_DAY_30 = 29;

function vesetId(
  type: VesetResult['type'],
  sourcePeriodId: string,
  dateGregorian: string,
  onah: VesetResult['onah'],
): string {
  return `veset-${type}-${sourcePeriodId}-${dateGregorian}-${onah}`;
}

function resultFor(
  period: Period,
  minhag: Minhag,
  dateHebrew: Period['dateHebrew'],
  onah: Period['onah'],
): VesetResult {
  const dateGregorian = formatGregorianLocal(hebrewDateToGregorian(dateHebrew));
  return {
    id: vesetId('onahBeinonit', period.id, dateGregorian, onah),
    type: 'onahBeinonit',
    dateGregorian,
    dateHebrew,
    onah,
    sourcePeriodId: period.id,
    minhagLabel: minhag,
    isKavuah: false,
  };
}

/**
 * Computes onah beinonit (thirtieth-day vest) for a single established period.
 * Source: Shulchan Aruch Yoreh De'ah 189:2.
 *
 * @param period - The anchor period (Hebrew date = day 1 of the count)
 * @param minhag - Nusach / family minhag affecting whether one or both onot are kept
 */
export function calcOnahBeinonit(period: Period, minhag: Minhag): VesetResult[] {
  const day30Hebrew = addHebrewDays(period.dateHebrew, HEBREW_DAYS_FROM_DAY_1_TO_DAY_30);

  if (minhag === 'yireim') {
    return [
      resultFor(period, minhag, day30Hebrew, 'day'),
      resultFor(period, minhag, day30Hebrew, 'night'),
    ];
  }

  if (minhag === 'chabad' && period.onah === 'night') {
    return [
      resultFor(period, minhag, day30Hebrew, 'day'),
      resultFor(period, minhag, day30Hebrew, 'night'),
    ];
  }

  return [resultFor(period, minhag, day30Hebrew, period.onah)];
}
