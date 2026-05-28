/**
 * Verifies onah beinonit (Shulchan Aruch Yoreh De'ah 189:2): the thirtieth Hebrew-calendar
 * day from the anchor, with minhag-dependent onot (single onah vs yireim vs Chabad night).
 */
import { formatGregorianLocal, hebrewDateToGregorian } from '../onah';
import { calcOnahBeinonit } from '../onahBeinonit';
import type { Chumrot } from '../types';
import { makePeriod } from './fixtures';

const noChumrot: Chumrot = {
  kavuah: false,
  veshetEinah: false,
  onahBeinonitIfHaflaga: false,
  bothOnotOnBeinonit: false,
  bothOnotOnYomHaChodesh: false,
};

describe('calcOnahBeinonit', () => {
  /** Anchor 15 Cheshvan 5769 — ashkenaz keeps one onah on 15 Kislev 5769 (day 30). */
  const anchor = makePeriod({
    id: 'p-ob-1',
    dateGregorian: '2008-11-13',
    dateHebrew: { year: 5769, month: 8, day: 15 },
    onah: 'day',
  });

  it('ashkenaz: single vest on Hebrew day 30 with the same onah', () => {
    const results = calcOnahBeinonit(anchor, 'ashkenaz', noChumrot);
    expect(results).toHaveLength(1);
    expect(results[0]!.type).toBe('onahBeinonit');
    expect(results[0]!.onah).toBe('day');
    expect(results[0]!.dateHebrew).toEqual({ year: 5769, month: 9, day: 15 });
    expect(results[0]!.dateGregorian).toBe(
      formatGregorianLocal(hebrewDateToGregorian(results[0]!.dateHebrew)),
    );
  });

  /** Chumra can force both day and night onot on that Hebrew date (two results). */
  it('bothOnotOnBeinonit: day and night onot on the thirtieth Hebrew day', () => {
    const results = calcOnahBeinonit(anchor, 'ashkenaz', {
      ...noChumrot,
      bothOnotOnBeinonit: true,
    });
    expect(results).toHaveLength(2);
    const onot = results.map((r) => r.onah).sort();
    expect(onot).toEqual(['day', 'night']);
    expect(results.every((r) => r.dateHebrew.year === 5769 && r.dateHebrew.month === 9 && r.dateHebrew.day === 15)).toBe(
      true,
    );
  });

  /**
   * Chabad: night anchor adds the preceding day-onah on the same Hebrew date as lail sheloshim,
   * in addition to the night onah (see YD 189:2 and Chabad practice).
   */
  it('chabad: night start yields day + night on Hebrew day 30; day start yields one onah', () => {
    const nightAnchor = { ...anchor, id: 'p-ob-night', onah: 'night' as const };
    const nightResults = calcOnahBeinonit(nightAnchor, 'chabad', noChumrot);
    expect(nightResults).toHaveLength(2);
    expect(nightResults.map((r) => r.onah).sort()).toEqual(['day', 'night']);

    const dayResults = calcOnahBeinonit(anchor, 'chabad', noChumrot);
    expect(dayResults).toHaveLength(1);
    expect(dayResults[0]!.onah).toBe('day');
  });
});
