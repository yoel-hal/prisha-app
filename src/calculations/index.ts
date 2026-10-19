import { calcHaflaga, calcKavuahHaflaga } from './haflaga';
import { daysInHebrewMonth, normalizePeriods, onahKey } from './hebrewCalendar';
import { calcOnahBeinonit } from './onahBeinonit';
import { makeResult, uniqueOnot, withOhrZarua } from './results';
import type { Chumrot, Minhag, Period, VesetResult } from './types';
import { calcYomHaChodesh, nextMonthSameDay } from './yomHaChodesh';

export { calcHaflaga } from './haflaga';
export { calcOnahBeinonit } from './onahBeinonit';
export { calcYomHaChodesh } from './yomHaChodesh';
export { DEFAULT_CHUMROT, normalizeChumrot } from './chumrot';

function compareVesetResults(a: VesetResult, b: VesetResult): number {
  return (
    onahKey(a.dateHebrew, a.onah) - onahKey(b.dateHebrew, b.onah) ||
    a.type.localeCompare(b.type)
  );
}

/**
 * All vesatot for the period history, by the rules in docs/חישובי-עונות-v1.docx:
 * - calculations use the Hebrew date and onah only; periods on the same Hebrew date count once
 * - kavuah haflaga or chodesh: only that fixed veset, no onah beinonit
 * - otherwise: onah beinonit from the latest period, haflaga from the last two, and
 *   yom hachodesh from every period until its date passes (open question 2, interim)
 *
 * @param periods - All recorded periods (any order)
 * @param minhag  - Community tradition
 * @param chumrot - Chumrot and kavuah from the settings
 */
export function calcAllVesetim(
  periods: Period[],
  minhag: Minhag,
  chumrot: Chumrot,
): VesetResult[] {
  const sorted = normalizePeriods(periods);
  const latest = sorted[sorted.length - 1];
  if (!latest) {
    return [];
  }

  const out: VesetResult[] = [];
  const { kavuah } = chumrot;

  if (kavuah.type === 'haflaga') {
    out.push(...calcKavuahHaflaga(latest, kavuah.days, minhag, chumrot));
  } else if (kavuah.type === 'chodesh') {
    out.push(...calcKavuahChodesh(latest, kavuah.dayOfMonth, minhag, chumrot));
  } else {
    out.push(...calcOnahBeinonit(latest, minhag, chumrot));
    out.push(...calcHaflaga(sorted, minhag, chumrot));
    const latestKey = onahKey(latest.dateHebrew, latest.onah);
    for (const period of sorted) {
      const results = calcYomHaChodesh(period, minhag, chumrot);
      // An earlier period's yom hachodesh that falls on or before the latest period has passed.
      out.push(
        ...(period === latest
          ? results
          : results.filter((r) => onahKey(r.dateHebrew, r.onah) > latestKey)),
      );
    }
  }

  return out.sort(compareVesetResults);
}

/** Kavuah chodesh: the next `dayOfMonth` after the latest period, in its onah. */
function calcKavuahChodesh(
  latest: Period,
  dayOfMonth: number,
  minhag: Minhag,
  chumrot: Chumrot,
): VesetResult[] {
  const current = latest.dateHebrew;
  const date =
    dayOfMonth > current.day && dayOfMonth <= daysInHebrewMonth(current.month, current.year)
      ? { ...current, day: dayOfMonth }
      : nextMonthSameDay(current, chumrot.shortMonthRule, dayOfMonth);
  if (!date) {
    return [];
  }
  return uniqueOnot(withOhrZarua([{ date, onah: latest.onah }], chumrot.ohrZarua)).map(
    (target) => makeResult('yomHaChodesh', latest, target, minhag, true),
  );
}
