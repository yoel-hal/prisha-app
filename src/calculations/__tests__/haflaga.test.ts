/**
 * Verifies haflaga (Shulchan Aruch Yoreh De'ah 189:4): interval between the two prior starts,
 * projected from the latest start with the latest period’s onah; and the “fewer than two periods” edge.
 */
import { calcHaflaga } from '../haflaga';
import type { Chumrot } from '../types';
import { makePeriod } from './fixtures';

const noChumrot: Chumrot = {
  kavuah: false,
  veshetEinah: false,
  onahBeinonitIfHaflaga: false,
  bothOnotOnBeinonit: false,
  bothOnotOnYomHaChodesh: false,
};

describe('calcHaflaga', () => {
  const p1 = makePeriod({
    id: 'p-hf-1',
    dateGregorian: '2008-11-13',
    dateHebrew: { year: 5769, month: 8, day: 15 },
    onah: 'day',
  });

  const p2 = makePeriod({
    id: 'p-hf-2',
    dateGregorian: '2008-11-23',
    dateHebrew: { year: 5769, month: 8, day: 25 },
    onah: 'night',
  });

  it('returns an empty array when there are fewer than two periods', () => {
    expect(calcHaflaga([], 'ashkenaz', noChumrot)).toEqual([]);
    expect(calcHaflaga([p1], 'ashkenaz', noChumrot)).toEqual([]);
  });

  it('ashkenaz: projects the interval between the two most recent periods from the latest start', () => {
    const results = calcHaflaga([p1, p2], 'ashkenaz', noChumrot);
    expect(results).toHaveLength(1);
    expect(results[0]!.type).toBe('haflaga');
    expect(results[0]!.onah).toBe('night');
    expect(results[0]!.sourcePeriodId).toBe('p-hf-2');
    expect(results[0]!.dateHebrew).toEqual({ year: 5769, month: 9, day: 6 });
  });

  /**
   * Unsorted input: calculator must order by `dateGregorian` so the last two chronological
   * periods are used (not array order).
   */
  it('sorts by Gregorian string before taking the last two periods', () => {
    const results = calcHaflaga([p2, p1], 'sfarad', noChumrot);
    expect(results).toHaveLength(1);
    expect(results[0]!.dateHebrew).toEqual({ year: 5769, month: 9, day: 6 });
    expect(results[0]!.minhagLabel).toBe('sfarad');
  });
});
