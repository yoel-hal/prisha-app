import { HDate } from '@hebcal/hdate';

import type { HebrewDate, Onah, Period } from './types';

/**
 * Hebrew-calendar helpers for the vesatot calculations. Everything here works on
 * Hebrew dates only; the civil date is display-only and never used in a calculation.
 * Months follow @hebcal/hdate: 1 = Nisan … 6 = Elul, 7 = Tishrei … 11 = Shevat,
 * 12 = Adar (Adar I in a leap year), 13 = Adar II. The year changes at Tishrei.
 */

/** A Hebrew date plus the onah: the unit a veset falls on. */
export type HebrewOnah = { date: HebrewDate; onah: Onah };

const SHEVAT = 11;
const ADAR = 12;
const ADAR_II = 13;
const NISAN = 1;
const ELUL = 6;

export function toAbs(date: HebrewDate): number {
  return new HDate(date.day, date.month, date.year).abs();
}

export function fromAbs(abs: number): HebrewDate {
  const h = new HDate(abs);
  return { year: h.getFullYear(), month: h.getMonth(), day: h.getDate() };
}

export function addDays(date: HebrewDate, days: number): HebrewDate {
  return fromAbs(toAbs(date) + days);
}

/**
 * Sort key: the night of a Hebrew date comes before its day.
 * Two onot are consecutive exactly when their keys differ by 1.
 */
export function onahKey(date: HebrewDate, onah: Onah): number {
  return toAbs(date) * 2 + (onah === 'night' ? 0 : 1);
}

/** The onah right before: before a night is the day of the previous date; before a day is its own night. */
export function previousOnah(target: HebrewOnah): HebrewOnah {
  if (target.onah === 'day') {
    return { date: target.date, onah: 'night' };
  }
  return { date: addDays(target.date, -1), onah: 'day' };
}

export function daysInHebrewMonth(month: number, year: number): number {
  return HDate.daysInMonth(month, year);
}

/**
 * The next Hebrew month: Elul → Tishrei of the next year, Shevat → Adar I,
 * Adar I → Adar II, Adar II → Nisan; in a common year Adar → Nisan.
 * (HDate.add(n, 'month') can land on the wrong month around Tishrei, so it is not used.)
 */
export function nextHebrewMonth(month: number, year: number): { month: number; year: number } {
  const leap = HDate.isLeapYear(year);
  if (month === ELUL) {
    return { month: month + 1, year: year + 1 };
  }
  if (month === ADAR) {
    return leap ? { month: ADAR_II, year } : { month: NISAN, year };
  }
  if (month === ADAR_II) {
    return { month: NISAN, year };
  }
  if (month === SHEVAT) {
    return { month: ADAR, year };
  }
  return { month: month + 1, year };
}

/** Periods in Hebrew order (night before day), one per Hebrew date. */
export function normalizePeriods(periods: Period[]): Period[] {
  const sorted = [...periods].sort(
    (a, b) =>
      onahKey(a.dateHebrew, a.onah) - onahKey(b.dateHebrew, b.onah) ||
      a.createdAt.localeCompare(b.createdAt),
  );
  // A second period on the same Hebrew date is the same sighting (open source):
  // keep only the first one.
  const out: Period[] = [];
  for (const period of sorted) {
    const last = out[out.length - 1];
    if (last && toAbs(last.dateHebrew) === toAbs(period.dateHebrew)) {
      continue;
    }
    out.push(period);
  }
  return out;
}

/** A period already recorded on this Hebrew date (ignoring `exceptId`, the one being edited). */
export function findPeriodOnHebrewDate(
  periods: Period[],
  date: HebrewDate,
  exceptId?: string,
): Period | undefined {
  return periods.find(
    (period) => period.id !== exceptId && isSameHebrewDate(period.dateHebrew, date),
  );
}

export function isSameHebrewDate(a: HebrewDate, b: HebrewDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}
