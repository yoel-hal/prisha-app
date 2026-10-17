import { gematriya, HDate, Locale } from '@hebcal/hdate';

import type { HebrewDate } from '../calculations/types';
import type { SupportedLanguage } from '../i18n';

/** Hebrew month name in Hebrew letters, without nikud (e.g. חשון, אדר ב׳). */
export function hebrewMonthName(month: number, year: number): string {
  return Locale.gettext(new HDate(1, month, year).getMonthName(), 'he-x-NoNikud');
}

/** Hebrew day of month in letters (e.g. א׳, ט״ו). */
export function hebrewDayLetters(day: number): string {
  return gematriya(day);
}

/** Hebrew year in letters (e.g. תשפ״ז). */
export function hebrewYearLetters(year: number): string {
  return gematriya(year);
}

/**
 * Day and month in Hebrew letters (e.g. ה׳ חשון). Hebrew dates are always written in
 * Hebrew letters, in both app languages; `language` is kept for call sites.
 */
export function formatHebrewDate(
  date: HebrewDate,
  _language?: SupportedLanguage,
): string {
  return `${hebrewDayLetters(date.day)} ${hebrewMonthName(date.month, date.year)}`;
}

/** Day, month and year in Hebrew letters (e.g. ה׳ חשון תשפ״ז). */
export function formatHebrewDateWithYear(date: HebrewDate): string {
  return `${formatHebrewDate(date)} ${hebrewYearLetters(date.year)}`;
}

/** Month and year in Hebrew letters (e.g. חשון תשפ״ז). */
export function formatHebrewMonthYear(
  date: Pick<HebrewDate, 'month' | 'year'> & Partial<HebrewDate>,
  _language?: SupportedLanguage,
): string {
  return `${hebrewMonthName(date.month, date.year)} ${hebrewYearLetters(date.year)}`;
}
