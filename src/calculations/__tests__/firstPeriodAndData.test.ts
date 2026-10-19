/**
 * First-period and data tests ר1–ר3, נ3 from docs/חישובי-עונות-v1.docx §9,
 * plus the Hebrew-calendar helpers and the settings migration.
 */
import { HDate } from '@hebcal/hdate';

import { calcAllVesetim, normalizeChumrot } from '..';
import { DEFAULT_CHUMROT } from '../chumrot';
import { nextHebrewMonth, normalizePeriods, previousOnah } from '../hebrewCalendar';
import { A, chumrot, hp, label, labels, months } from './fixtures';

const C = hp('c', 'night', 6, months.CHESHVAN, 5787);

describe('first period', () => {
  it('ר1: no periods → nothing', () => {
    expect(calcAllVesetim([], 'ashkenaz', chumrot())).toEqual([]);
  });

  it('ר2: one period → onah beinonit and yom hachodesh, no haflaga', () => {
    const results = calcAllVesetim([A], 'ashkenaz', chumrot());
    expect(results.map((r) => `${r.type} ${label(r)}`)).toEqual([
      'onahBeinonit ליל ד׳ טבת',
      'yomHaChodesh ליל ה׳ טבת',
    ]);
  });

  it('ר3: second period → beinonit only from it; haflaga; first yom hachodesh stays (open question 2)', () => {
    const results = calcAllVesetim([C, A], 'ashkenaz', chumrot());
    expect(labels(results, 'onahBeinonit')).toEqual(['ליל ד׳ טבת']);
    expect(labels(results, 'haflaga')).toEqual(['ליל ד׳ טבת']);
    expect(labels(results, 'yomHaChodesh')).toEqual(['ליל ו׳ כסלו', 'ליל ה׳ טבת']);
  });

  it('an earlier yom hachodesh on or before the latest period has passed', () => {
    // ליל ט״ז תשרי → yom hachodesh ט״ז חשון, which is before ה׳ כסלו.
    const results = calcAllVesetim([hp('t', 'night', 16, months.TISHREI, 5787), A], 'ashkenaz', chumrot());
    expect(labels(results, 'yomHaChodesh')).toEqual(['ליל ה׳ טבת']);
  });
});

describe('duplicates', () => {
  it('נ3: two periods on the same Hebrew date count as one', () => {
    const twice = [A, { ...A, id: 'a2' }];
    const results = calcAllVesetim(twice, 'ashkenaz', chumrot());
    expect(results.map((r) => `${r.type} ${label(r)}`)).toEqual([
      'onahBeinonit ליל ד׳ טבת',
      'yomHaChodesh ליל ה׳ טבת',
    ]);
  });

  it('same date, day and night: the night (earlier onah) is kept', () => {
    const kept = normalizePeriods([{ ...A, id: 'day', onah: 'day' }, A]);
    expect(kept.map((p) => p.id)).toEqual(['a']);
  });
});

describe('Hebrew calendar helpers', () => {
  it('previous onah of a night is the day of the previous date', () => {
    const before = previousOnah({ date: { year: 5787, month: months.TEVET, day: 4 }, onah: 'night' });
    expect(label({ dateHebrew: before.date, onah: before.onah })).toBe('יום ג׳ טבת');
  });

  it('next month around Tishrei and Adar', () => {
    expect(nextHebrewMonth(months.ELUL, 5786)).toEqual({ month: months.TISHREI, year: 5787 });
    expect(nextHebrewMonth(months.TISHREI, 5787)).toEqual({ month: months.CHESHVAN, year: 5787 });
    expect(nextHebrewMonth(months.SHVAT, 5790)).toEqual({ month: months.ADAR_I, year: 5790 });
    expect(nextHebrewMonth(months.ADAR_I, 5790)).toEqual({ month: months.ADAR_II, year: 5790 });
    expect(nextHebrewMonth(months.ADAR_I, 5788)).toEqual({ month: months.NISAN, year: 5788 });
  });

  it('every month of 19 years steps to a real following month', () => {
    for (let year = 5780; year < 5799; year++) {
      const count = HDate.monthsInYear(year);
      for (let month = 1; month <= count; month++) {
        const next = nextHebrewMonth(month, year);
        const first = new HDate(1, next.month, next.year).abs();
        const lastOfThis = new HDate(HDate.daysInMonth(month, year), month, year).abs();
        expect(first).toBe(lastOfThis + 1);
      }
    }
  });
});

describe('settings migration (open question 7)', () => {
  it('old "both onot on day 30" becomes Kreisi uPleisi; old yom hachodesh switch is dropped', () => {
    const migrated = normalizeChumrot({ bothOnotOnBeinonit: true, bothOnotOnYomHaChodesh: true });
    expect(migrated).toEqual({ ...DEFAULT_CHUMROT, kreisiUpleisi: true });
  });

  it('old kavuah switch → no kavuah, and asks to set it again', () => {
    expect(normalizeChumrot({ kavuah: true })).toEqual({
      ...DEFAULT_CHUMROT,
      kavuahNeedsReview: true,
    });
  });

  it('old minhag yireim → Kreisi uPleisi', () => {
    expect(normalizeChumrot({}, 'yireim').kreisiUpleisi).toBe(true);
  });

  it('new settings are read as saved; bad values fall back to defaults', () => {
    const saved = {
      ...DEFAULT_CHUMROT,
      ohrZarua: true,
      nightConflict: 'ohrZarua',
      kavuah: { type: 'haflaga', days: 28 },
    };
    expect(normalizeChumrot(saved)).toEqual(saved);
    expect(normalizeChumrot({ nightConflict: 'x', kavuah: { type: 'chodesh', dayOfMonth: 40 } })).toEqual(
      DEFAULT_CHUMROT,
    );
  });

  it('missing settings → defaults', () => {
    expect(normalizeChumrot(undefined)).toEqual(DEFAULT_CHUMROT);
  });
});
