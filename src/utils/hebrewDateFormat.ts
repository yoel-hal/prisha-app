import { HDate } from '@hebcal/hdate';

import type { HebrewDate } from '../calculations/types';
import type { SupportedLanguage } from '../i18n';

export function formatHebrewDate(
  date: HebrewDate,
  language: SupportedLanguage,
): string {
  const hdate = new HDate(date.day, date.month, date.year);
  const locale = language === 'he' ? 'he' : 'en';
  return hdate.render(locale, false);
}

export function formatHebrewMonthYear(
  date: HebrewDate,
  language: SupportedLanguage,
): string {
  const hdate = new HDate(1, date.month, date.year);
  const locale = language === 'he' ? 'he' : 'en';
  return hdate.render(locale, true).replace(/^\d+\s*/, '').trim();
}
