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

export const teimaniMinhag: MinhagStrategy = {
  calcOnahBeinonit(period) {
    // NOTE: Teimani base rule matches Ashkenaz here.
    // Teimani minhag differences, if any, should be confirmed with a rav
    // and updated in this file.
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
        minhagLabel: 'teimani',
        isKavuah: false,
      },
    ];
  },

  calcHaflaga(periods) {
    // NOTE: Teimani base rule matches Ashkenaz here.
    // Teimani minhag differences, if any, should be confirmed with a rav
    // and updated in this file.
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
        minhagLabel: 'teimani',
        isKavuah: false,
      },
    ];
  },

  calcYomHaChodesh(period) {
    // NOTE: Teimani base rule matches Ashkenaz here.
    // Teimani minhag differences, if any, should be confirmed with a rav
    // and updated in this file.
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
        minhagLabel: 'teimani',
        isKavuah: false,
      },
    ];
  },
};
