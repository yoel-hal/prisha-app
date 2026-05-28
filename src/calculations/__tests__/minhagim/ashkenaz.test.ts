/**
 * Ashkenaz minhag strategy tests.
 * Base rule for all three vestos: same onah as the period,
 * no additional onot unless chumrot are applied.
 */
import { ashkenazMinhag } from '../../minhagim/ashkenaz';
import { makePeriod } from '../fixtures';

const anchor = makePeriod({
  id: 'p-ash-1',
  dateGregorian: '2008-11-13',
  dateHebrew: { year: 5769, month: 8, day: 15 },
  onah: 'day',
});

const prev = makePeriod({
  id: 'p-ash-prev',
  dateGregorian: '2008-10-14',
  dateHebrew: { year: 5769, month: 7, day: 15 },
  onah: 'day',
});

describe('ashkenazMinhag.calcOnahBeinonit', () => {
  it('returns one result on day 30 (Hebrew day + 29)', () => {
    const results = ashkenazMinhag.calcOnahBeinonit(anchor);
    expect(results).toHaveLength(1);
    expect(results[0]!.type).toBe('onahBeinonit');
    expect(results[0]!.dateHebrew).toEqual({ year: 5769, month: 9, day: 15 });
  });

  it('keeps the same onah as the period (day)', () => {
    const results = ashkenazMinhag.calcOnahBeinonit(anchor);
    expect(results[0]!.onah).toBe('day');
  });

  it('keeps the same onah as the period (night)', () => {
    const night = { ...anchor, id: 'p-ash-night', onah: 'night' as const };
    const results = ashkenazMinhag.calcOnahBeinonit(night);
    expect(results).toHaveLength(1);
    expect(results[0]!.onah).toBe('night');
  });
});

describe('ashkenazMinhag.calcHaflaga', () => {
  it('returns empty when fewer than 2 periods', () => {
    expect(ashkenazMinhag.calcHaflaga([])).toEqual([]);
    expect(ashkenazMinhag.calcHaflaga([anchor])).toEqual([]);
  });

  it('projects the interval between the two most recent periods', () => {
    const results = ashkenazMinhag.calcHaflaga([prev, anchor]);
    expect(results).toHaveLength(1);
    expect(results[0]!.type).toBe('haflaga');
    expect(results[0]!.dateHebrew).toEqual({ year: 5769, month: 9, day: 16 });
    expect(results[0]!.onah).toBe(anchor.onah);
  });

  it('sorts unsorted input before computing', () => {
    const results = ashkenazMinhag.calcHaflaga([anchor, prev]);
    expect(results[0]!.dateHebrew).toEqual({ year: 5769, month: 9, day: 16 });
  });
});

describe('ashkenazMinhag.calcYomHaChodesh', () => {
  it('returns one result on the same day next Hebrew month', () => {
    const results = ashkenazMinhag.calcYomHaChodesh(anchor);
    expect(results).toHaveLength(1);
    expect(results[0]!.type).toBe('yomHaChodesh');
    expect(results[0]!.dateHebrew).toEqual({ year: 5769, month: 9, day: 15 });
  });

  it('keeps the same onah as the period', () => {
    const results = ashkenazMinhag.calcYomHaChodesh(anchor);
    expect(results[0]!.onah).toBe('day');
  });
});
