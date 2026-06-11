import type { SupportedLanguage } from '../i18n';

/** Locale-aware display for a `YYYY-MM-DD` gregorian date string. */
export function formatGregorianDisplay(
  dateGregorian: string,
  language: SupportedLanguage,
): string {
  const parsed = new Date(`${dateGregorian}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return dateGregorian;
  }
  const locale = language === 'he' ? 'he-IL' : 'en-US';
  return parsed.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
