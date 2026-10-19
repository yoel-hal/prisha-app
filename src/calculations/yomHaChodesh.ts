import {
  daysInHebrewMonth,
  nextHebrewMonth,
} from './hebrewCalendar';
import { makeResult, tag, uniqueOnot, withOhrZarua } from './results';
import type { Chumrot, HebrewDate, Minhag, Period, ShortMonthRule, VesetResult } from './types';

/**
 * The same day of month in the next Hebrew month, or null when there is none.
 * On the 30th, when the next month has 29 days, `rule` decides (default: none).
 */
export function nextMonthSameDay(
  date: HebrewDate,
  rule: ShortMonthRule,
  dayOfMonth = date.day,
): HebrewDate | null {
  const next = nextHebrewMonth(date.month, date.year);
  if (dayOfMonth <= daysInHebrewMonth(next.month, next.year)) {
    return { ...next, day: dayOfMonth };
  }
  if (rule === 'twentyNinth') {
    return { ...next, day: 29 };
  }
  if (rule === 'firstOfFollowing') {
    return { ...nextHebrewMonth(next.month, next.year), day: 1 };
  }
  return null;
}

/**
 * Yom hachodesh: the same Hebrew day in the next month, same onah.
 * Only Ohr Zarua applies (Kreisi uPleisi and Chavot Daat are onah beinonit only).
 * Source: Shulchan Aruch Yoreh De'ah 189:6; docs/חישובי-עונות-v1.docx §3.
 */
export function calcYomHaChodesh(
  period: Period,
  minhag: Minhag,
  chumrot: Chumrot,
): VesetResult[] {
  const date = nextMonthSameDay(period.dateHebrew, chumrot.shortMonthRule);
  if (!date) {
    return [];
  }
  return uniqueOnot(withOhrZarua(tag([{ date, onah: period.onah }], 'main'), chumrot.ohrZarua)).map(
    (target) => makeResult('yomHaChodesh', period, target, minhag),
  );
}
