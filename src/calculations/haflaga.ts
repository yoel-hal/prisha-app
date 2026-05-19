/**
 * Haflaga — interval between last two periods, projected forward.
 * Source: Shulchan Aruch Yoreh De'ah 189:4
 */

import { HDate } from '@hebcal/hdate';

import { formatGregorianLocal, hebrewDateToGregorian } from './onah';
import type { Minhag, Period, VesetResult } from './types';

function toHDate(date: Period['dateHebrew']): HDate {
  return new HDate(date.day, date.month, date.year);
}

function vesetId(
  type: VesetResult['type'],
  sourcePeriodId: string,
  dateGregorian: string,
  onah: VesetResult['onah'],
): string {
  return `veset-${type}-${sourcePeriodId}-${dateGregorian}-${onah}`;
}

/**
 * Computes the haflaga vest from the interval between the two most recent periods.
 * Source: Shulchan Aruch Yoreh De'ah 189:4.
 *
 * @param periods - All recorded periods (will be sorted by `dateGregorian` ascending)
 * @param minhag - Minhag label stored on the result for display
 */
export function calcHaflaga(periods: Period[], minhag: Minhag): VesetResult[] {
  const sorted = [...periods].sort((a, b) => a.dateGregorian.localeCompare(b.dateGregorian));
  if (sorted.length < 2) {
    return [];
  }

  const previous = sorted[sorted.length - 2]!;
  const latest = sorted[sorted.length - 1]!;

  const hPrev = toHDate(previous.dateHebrew);
  const hLatest = toHDate(latest.dateHebrew);
  const intervalDays = hLatest.abs() - hPrev.abs();

  const nextAbs = hLatest.abs() + intervalDays;
  const nextH = new HDate(nextAbs);
  const dateHebrew = {
    year: nextH.getFullYear(),
    month: nextH.getMonth(),
    day: nextH.getDate(),
  };
  const dateGregorian = formatGregorianLocal(hebrewDateToGregorian(dateHebrew));

  return [
    {
      id: vesetId('haflaga', latest.id, dateGregorian, latest.onah),
      type: 'haflaga',
      dateGregorian,
      dateHebrew,
      onah: latest.onah,
      sourcePeriodId: latest.id,
      minhagLabel: minhag,
      isKavuah: false,
    },
  ];
}
