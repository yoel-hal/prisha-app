import { months } from '@hebcal/hdate';

import { DEFAULT_CHUMROT } from '../chumrot';
import { formatGregorianLocal, hebrewDateToGregorian } from '../onah';
import type { Chumrot, Onah, Period, VesetResult, VesetType } from '../types';
import { formatHebrewDate } from '../../utils/hebrewDateFormat';

export { months };

/** Builds a `Period`; the civil date is derived from the Hebrew date, as in the app. */
export function makePeriod(
  partial: Pick<Period, 'id' | 'dateGregorian' | 'dateHebrew' | 'onah'> &
    Partial<Pick<Period, 'notes' | 'createdAt' | 'createdBy'>>,
): Period {
  return {
    notes: undefined,
    createdAt: '2020-01-01T00:00:00.000Z',
    createdBy: 'test-user',
    ...partial,
  };
}

/** A period on a Hebrew date, e.g. hp('a', 'night', 5, months.KISLEV, 5787). */
export function hp(
  id: string,
  onah: Onah,
  day: number,
  month: number,
  year: number,
  createdAt?: string,
): Period {
  const dateHebrew = { year, month, day };
  return makePeriod({
    id,
    onah,
    dateHebrew,
    dateGregorian: formatGregorianLocal(hebrewDateToGregorian(dateHebrew)),
    ...(createdAt ? { createdAt } : {}),
  });
}

/** The doc's example period "א": the night of ה׳ כסלו תשפ״ז (motzei Shabbat 14.11.2026). */
export const A = hp('a', 'night', 5, months.KISLEV, 5787);
/** "א-יום": the day of ה׳ כסלו תשפ״ז. */
export const A_DAY = hp('a-day', 'day', 5, months.KISLEV, 5787);

export function chumrot(overrides: Partial<Chumrot> = {}): Chumrot {
  return { ...DEFAULT_CHUMROT, ...overrides };
}

/** "ליל ד׳ טבת" / "יום ד׳ טבת", the way the doc writes results. */
export function label(result: Pick<VesetResult, 'onah' | 'dateHebrew'>): string {
  return `${result.onah === 'night' ? 'ליל' : 'יום'} ${formatHebrewDate(result.dateHebrew)}`;
}

export function labels(results: VesetResult[], type?: VesetType): string[] {
  return results.filter((r) => !type || r.type === type).map(label);
}
