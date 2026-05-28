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

export const ashkenazMinhag: MinhagStrategy = {
  calcOnahBeinonit(period) {
    // Ashkenaz: keep the same onah as the period on day 30.
    // Day 1 = the period day itself; day 30 = period day + 29 Hebrew days.
    // NOTE: If a rav rules that Ashkenaz should differ here, update this function.
    const day30 = addHebrewDays(period.dateHebrew, 29);
    const dateGregorian = formatGregorianLocal(hebrewDateToGregorian(day30));
    return [
      {
        id: makeId('onahBeinonit', period.id, dateGregorian, period.onah),
        type: 'onahBeinonit',
        dateGregorian,
        dateHebrew: day30,
        onah: period.onah,
        sourcePeriodId: period.id,
        minhagLabel: 'ashkenaz',
        isKavuah: false,
      },
    ];
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
        minhagLabel: 'ashkenaz',
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
        minhagLabel: 'ashkenaz',
        isKavuah: false,
      },
    ];
  },
};
