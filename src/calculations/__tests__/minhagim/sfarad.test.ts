/**
 * Sfarad minhag strategy tests.
 * Current base rules match Ashkenaz. This file exists so that when a rav
 * rules on Sfarad-specific differences, tests can be updated here independently.
 */
import { sfaradMinhag } from '../../minhagim/sfarad';
import { makePeriod } from '../fixtures';

const anchor = makePeriod({
  id: 'p-sf-1',
  dateGregorian: '2008-11-13',
  dateHebrew: { year: 5769, month: 8, day: 15 },
  onah: 'night',
});

describe('sfaradMinhag.calcOnahBeinonit', () => {
  it('returns one result on day 30 with the same onah', () => {
    const results = sfaradMinhag.calcOnahBeinonit(anchor);
    expect(results).toHaveLength(1);
    expect(results[0]!.onah).toBe('night');
    expect(results[0]!.dateHebrew).toEqual({ year: 5769, month: 9, day: 15 });
  });
});

describe('sfaradMinhag.calcHaflaga', () => {
  it('returns empty with fewer than 2 periods', () => {
    expect(sfaradMinhag.calcHaflaga([anchor])).toEqual([]);
  });
});

describe('sfaradMinhag.calcYomHaChodesh', () => {
  it('returns one result on the same Hebrew day next month', () => {
    const results = sfaradMinhag.calcYomHaChodesh(anchor);
    expect(results).toHaveLength(1);
    expect(results[0]!.dateHebrew).toEqual({ year: 5769, month: 9, day: 15 });
    expect(results[0]!.onah).toBe('night');
  });
});
