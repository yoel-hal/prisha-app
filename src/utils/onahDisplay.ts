import { hebrewDateToGregorian } from '../calculations/onah';
import type { HebrewDate, Onah } from '../calculations/types';
import type { SupportedLanguage } from '../i18n';
import { formatHebrewDate } from './hebrewDateFormat';

type Translate = (key: string, options?: Record<string, unknown>) => string;

export type OnahDateText = {
  /** "ליל ד׳ טבת" / "יום ד׳ טבת" */
  hebrew: string;
  /** "בערב יום א׳, 13.12.2026" / "יום ב׳, 14.12.2026" / "מוצאי שבת, 14.11.2026" */
  civil: string;
  /** "ליל ד׳ טבת – בערב יום א׳, 13.12.2026" */
  line: string;
  /** For the add-period form: "ליל ה׳ כסלו: מוצאי שבת, 14.11.2026 בערב" */
  formLine: string;
};

const SATURDAY = 6;
const FRIDAY = 5;

function civilDate(date: Date, language: SupportedLanguage): string {
  if (language === 'he') {
    return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
  }
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * How an onah is shown everywhere, so a night can't be read as the wrong evening.
 * A night onah of a Hebrew date starts at sunset of the previous civil day, so its
 * civil text names that evening (never "14 Dec, night" for the evening of the 13th).
 */
export function formatOnahDate(
  date: HebrewDate,
  onah: Onah,
  language: SupportedLanguage,
  t: Translate,
): OnahDateText {
  const hebrewDate = formatHebrewDate(date, language);
  const daytime = hebrewDateToGregorian(date);

  if (onah === 'day') {
    const weekday = t(`onahDate.weekday${daytime.getDay()}`);
    const civil = t('onahDate.dayCivil', { weekday, date: civilDate(daytime, language) });
    const hebrew = t('onahDate.dayOf', { date: hebrewDate });
    return {
      hebrew,
      civil,
      line: t('onahDate.line', { hebrew, civil }),
      formLine: t('onahDate.formLine', { hebrew, civil }),
    };
  }

  const evening = new Date(daytime.getFullYear(), daytime.getMonth(), daytime.getDate() - 1);
  const eveningDate = civilDate(evening, language);
  const day = evening.getDay();
  const named = day === SATURDAY || day === FRIDAY;
  const civil =
    day === SATURDAY
      ? t('onahDate.motzeiShabbat', { date: eveningDate })
      : day === FRIDAY
        ? t('onahDate.leilShabbat', { date: eveningDate })
        : t('onahDate.evening', { weekday: t(`onahDate.weekday${day}`), date: eveningDate });
  const hebrew = t('onahDate.nightOf', { date: hebrewDate });
  return {
    hebrew,
    civil,
    line: t('onahDate.line', { hebrew, civil }),
    // "בערב יום א׳…" already says evening; the named nights get it added.
    formLine: t(named ? 'onahDate.formLineEvening' : 'onahDate.formLine', { hebrew, civil }),
  };
}
