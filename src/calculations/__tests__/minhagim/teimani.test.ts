/**
 * Teimani minhag strategy tests.
 * Current base rules match Ashkenaz. This file exists so that when a rav
 * rules on Teimani-specific differences, tests can be updated here independently.
 */
import { teimaniMinhag } from '../../minhagim/teimani';
import { makePeriod } from '../fixtures';

const anchor = makePeriod({
  id: 'p-tei-1',
  dateGregorian: '2008-11-13',
  dateHebrew: { year: 5769, month: 8, day: 15 },
  onah: 'day',
});

describe('teimaniMinhag.calcOnahBeinonit', () => {
  it('returns one result on day 30 with the same onah', () => {
    const results = teimaniMinhag.calcOnahBeinonit(anchor);
    expect(results).toHaveLength(1);
    expect(results[0]!.dateHebrew).toEqual({ year: 5769, month: 9, day: 15 });
    expect(results[0]!.onah).toBe('day');
  });
});

describe('teimaniMinhag.calcHaflaga', () => {
  it('returns empty with fewer than 2 periods', () => {
    expect(teimaniMinhag.calcHaflaga([anchor])).toEqual([]);
  });
});

describe('teimaniMinhag.calcYomHaChodesh', () => {
  it('returns one result on the same Hebrew day next month', () => {
    const results = teimaniMinhag.calcYomHaChodesh(anchor);
    expect(results).toHaveLength(1);
    expect(results[0]!.dateHebrew).toEqual({ year: 5769, month: 9, day: 15 });
  });
});
