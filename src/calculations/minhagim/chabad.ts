import { HDate } from '@hebcal/hdate';

import {
  addHebrewDays,
  addHebrewMonths,
  formatGregorianLocal,
  hebrewDateToGregorian,
} from '../onah';
import type { MinhagStrategy, Period, VesetResult } from '../types';

function makeId(
  type: VesetResult['type'],
  periodId: string,
  dateGregorian: string,
  onah: VesetResult['onah'],
): string {
  return `veset-${type}-${periodId}-${dateGregorian}-${onah}`;
}

export const chabadMinhag: MinhagStrategy = {
  calcOnahBeinonit(period) {
    // Chabad base rule: if the period started at night, also keep the preceding
    // day-onah on day 30 (leil sheloshim). This is a BASE minhag rule for Chabad,
    // not a chumra — it applies regardless of the chumrot settings.
    // Source: Chabad practice per Shulchan Aruch HaRav / Chabad poskim.
    // NOTE: If a rav clarifies this rule, update here.
    const day30 = addHebrewDays(period.dateHebrew, 29);
    const dateGregorian = formatGregorianLocal(hebrewDateToGregorian(day30));
    const makeResult = (onah: VesetResult['onah']): VesetResult => ({
      id: makeId('onahBeinonit', period.id, dateGregorian, onah),
      type: 'onahBeinonit',
      dateGregorian,
      dateHebrew: day30,
      onah,
      sourcePeriodId: period.id,
      minhagLabel: 'chabad',
      isKavuah: false,
    });
    if (period.onah === 'night') {
      // Night period: keep both the day-onah and the night-onah on day 30.
      return [makeResult('day'), makeResult('night')];
    }
    // Day period: keep only the day-onah on day 30.
    return [makeResult('day')];
  },

  calcHaflaga(periods) {
    // Ashkenaz: use the interval between the last two periods.
    // NOTE: Kavuah tracking (3 equal intervals) is a Phase 2 feature.
    // NOTE: If a rav rules that Ashkenaz haflaga differs, update this function.
    const sorted = [...periods].sort((a, b) =>
      a.dateGregorian.localeCompare(b.dateGregorian),
    );
    if (sorted.length < 2) return [];
    const prev = sorted[sorted.length - 2]!;
    const latest = sorted[sorted.length - 1]!;
    const hPrev = new HDate(
      prev.dateHebrew.day,
      prev.dateHebrew.month,
      prev.dateHebrew.year,
    );
    const hLatest = new HDate(
      latest.dateHebrew.day,
      latest.dateHebrew.month,
      latest.dateHebrew.year,
    );
    const interval = hLatest.abs() - hPrev.abs();
    const nextH = new HDate(hLatest.abs() + interval);
    const dateHebrew = {
      year: nextH.getFullYear(),
      month: nextH.getMonth(),
      day: nextH.getDate(),
    };
    const dateGregorian = formatGregorianLocal(hebrewDateToGregorian(dateHebrew));
    return [
      {
        id: makeId('haflaga', latest.id, dateGregorian, latest.onah),
        type: 'haflaga',
        dateGregorian,
        dateHebrew,
        onah: latest.onah,
        sourcePeriodId: latest.id,
        minhagLabel: 'chabad',
        isKavuah: false,
      },
    ];
  },

  calcYomHaChodesh(period) {
    // Ashkenaz: same Hebrew day-of-month next Hebrew month, same onah.
    // NOTE: If a rav rules that Ashkenaz yom hachodesh differs, update this function.
    const nextMonth = addHebrewMonths(period.dateHebrew, 1);
    const dateGregorian = formatGregorianLocal(hebrewDateToGregorian(nextMonth));
    return [
      {
        id: makeId('yomHaChodesh', period.id, dateGregorian, period.onah),
        type: 'yomHaChodesh',
        dateGregorian,
        dateHebrew: nextMonth,
        onah: period.onah,
        sourcePeriodId: period.id,
        minhagLabel: 'chabad',
        isKavuah: false,
      },
    ];
  },
};
