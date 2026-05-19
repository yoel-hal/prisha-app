/**
 * Yom HaChodesh — same Hebrew calendar day next Hebrew month, same onah.
 * Source: Shulchan Aruch Yoreh De'ah 189:6
 */

import { addHebrewMonths, formatGregorianLocal, hebrewDateToGregorian } from './onah';
import type { Minhag, Period, VesetResult } from './types';

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
    id: vesetId('yomHaChodesh', period.id, dateGregorian, onah),
    type: 'yomHaChodesh',
    dateGregorian,
    dateHebrew,
    onah,
    sourcePeriodId: period.id,
    minhagLabel: minhag,
    isKavuah: false,
  };
}

/**
 * Computes yom ha'chodesh (calendar-day vest in the next Hebrew month).
 * Source: Shulchan Aruch Yoreh De'ah 189:6.
 *
 * @param period - Anchor period whose Hebrew date defines the day-of-month
 * @param minhag - Some communities keep both onot on that Hebrew date (yireim)
 */
export function calcYomHaChodesh(period: Period, minhag: Minhag): VesetResult[] {
  const nextMonthHebrew = addHebrewMonths(period.dateHebrew, 1);

  if (minhag === 'yireim') {
    return [
      resultFor(period, minhag, nextMonthHebrew, 'day'),
      resultFor(period, minhag, nextMonthHebrew, 'night'),
    ];
  }

  return [resultFor(period, minhag, nextMonthHebrew, period.onah)];
}
