import { HDate } from '@hebcal/hdate';

import type { HebrewDate, Onah } from './types';

/**
 * Returns the opposite onah (day ↔ night).
 * Halachic basis: A full Jewish calendar day spans a night onah followed by a day onah
 * (evening then morning until sunset); the companion onah is the other half of that calendar day.
 * Source: Shulchan Aruch Yoreh De'ah 184–189 (definition of onot in vestos calculation).
 *
 * @param onah - The established onah ("day" or "night")
 * @returns The complementary onah on the same Hebrew calendar date
 */
export function oppositeOnah(onah: Onah): Onah {
  return onah === 'day' ? 'night' : 'day';
}

function toHDate(date: HebrewDate): HDate {
  return new HDate(date.day, date.month, date.year);
}

function fromHDate(h: HDate): HebrewDate {
  return {
    year: h.getFullYear(),
    month: h.getMonth(),
    day: h.getDate(),
  };
}

/**
 * Converts a Hebrew calendar date to the corresponding civil (Gregorian) calendar date.
 * Uses the Hebcal perpetual Hebrew calendar (`HDate` from `@hebcal/hdate`, the same engine as `@hebcal/core`);
 * the returned `Date` is at local midnight for the **daytime** mapping used by the library (see `HDate.greg()`).
 * Source: Calendar conversion is a prerequisite for applying vestos in contemporary practice;
 * halachic day/night boundaries for onot still follow local sunset (not encoded here).
 * Source: Shulchan Aruch Yoreh De'ah 189 (vestos); calendar math per accepted luach tables.
 *
 * @param date - Hebrew year, month (1=Nisan … 7=Tishrei per `@hebcal/hdate`), and day
 */
export function hebrewDateToGregorian(date: HebrewDate): Date {
  return toHDate(date).greg();
}

/**
 * Converts a Gregorian `Date` (local date portion; time ignored) to Hebrew calendar components via `@hebcal/hdate` / `@hebcal/core` calendar tables.
 * Source: Same calendar layer as vestos sources in Shulchan Aruch Yoreh De'ah 189, which presuppose
 * correct mapping between Hebrew dates and civil dates for recording hargashah / flow.
 *
 * @param date - Civil calendar instant; hours/minutes are ignored for the Hebrew date
 */
export function gregorianToHebrewDate(date: Date): HebrewDate {
  const h = new HDate(date);
  return fromHDate(h);
}

/**
 * Adds a number of Hebrew calendar days (sunrise-to-sunrise style day steps in the luach).
 * Used for counting the thirty-day vest (onah beinonit) and haflaga day intervals.
 * Source: Shulchan Aruch Yoreh De'ah 189:2–4 (onah beinonit and haflaga are counted in calendar days).
 *
 * @param date - Starting Hebrew date (day 1 of a count typically includes this date)
 * @param days - Number of days to add (may be negative)
 */
export function addHebrewDays(date: HebrewDate, days: number): HebrewDate {
  return fromHDate(toHDate(date).add(days, 'day'));
}

/**
 * Adds whole Hebrew months, preserving the Hebrew day-of-month where possible
 * (month length and leap years are resolved by the luach, as in yom ha'chodesh).
 * Source: Shulchan Aruch Yoreh De'ah 189:6 (yom ha'chodesh: same calendar day next Hebrew month).
 *
 * @param date - Anchor Hebrew date
 * @param months - Number of Hebrew months to add (may be negative)
 */
export function addHebrewMonths(date: HebrewDate, months: number): HebrewDate {
  return fromHDate(toHDate(date).add(months, 'month'));
}

/**
 * Returns true if both dates are the identical Hebrew calendar day
 * (same Hebrew year, month, and day-of-month).
 * Useful when comparing anchors for yom ha'chodesh and other same-day rules.
 * Source: Shulchan Aruch Yoreh De'ah 189:6 (same yom in the Hebrew month cycle).
 *
 * @param a - First Hebrew date
 * @param b - Second Hebrew date
 */
export function isSameHebrewDayOfMonth(a: HebrewDate, b: HebrewDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

/**
 * Formats a `Date` as `YYYY-MM-DD` in **local** civil time (no UTC shift).
 * Used to populate `dateGregorian` string fields alongside Hebrew dates.
 */
export function formatGregorianLocal(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Parses a `YYYY-MM-DD` string as local civil noon (no UTC shift). */
export function parseGregorianLocal(value: string): Date {
  return new Date(`${value}T12:00:00`);
}
