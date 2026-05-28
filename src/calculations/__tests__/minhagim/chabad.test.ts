/**
 * Chabad minhag strategy tests.
 * Key difference from Ashkenaz: when the period started at night,
 * calcOnahBeinonit returns BOTH the day-onah and night-onah on day 30
 * (leil sheloshim). Day periods return one onah only.
 * This is a base minhag rule, not a chumra.
 */
import { chabadMinhag } from '../../minhagim/chabad';
import { makePeriod } from '../fixtures';

const dayAnchor = makePeriod({
  id: 'p-chb-day',
  dateGregorian: '2008-11-13',
  dateHebrew: { year: 5769, month: 8, day: 15 },
  onah: 'day',
});

const nightAnchor = makePeriod({
  id: 'p-chb-night',
  dateGregorian: '2008-11-13',
  dateHebrew: { year: 5769, month: 8, day: 15 },
  onah: 'night',
});

describe('chabadMinhag.calcOnahBeinonit', () => {
  it('day period: returns one result with day onah', () => {
    const results = chabadMinhag.calcOnahBeinonit(dayAnchor);
    expect(results).toHaveLength(1);
    expect(results[0]!.onah).toBe('day');
  });

  it('night period: returns two results - day AND night on day 30', () => {
    const results = chabadMinhag.calcOnahBeinonit(nightAnchor);
    expect(results).toHaveLength(2);
    const onot = results.map((r) => r.onah).sort();
    expect(onot).toEqual(['day', 'night']);
  });

  it('both results land on the same Hebrew date (day 30)', () => {
    const results = chabadMinhag.calcOnahBeinonit(nightAnchor);
    expect(results[0]!.dateHebrew).toEqual(results[1]!.dateHebrew);
    expect(results[0]!.dateHebrew).toEqual({ year: 5769, month: 9, day: 15 });
  });
});

describe('chabadMinhag.calcHaflaga', () => {
  it('matches ashkenaz haflaga logic (no Chabad difference currently)', () => {
    const prev = makePeriod({
      id: 'p-chb-prev',
      dateGregorian: '2008-10-14',
      dateHebrew: { year: 5769, month: 7, day: 15 },
      onah: 'day',
    });
    const results = chabadMinhag.calcHaflaga([prev, dayAnchor]);
    expect(results).toHaveLength(1);
    expect(results[0]!.type).toBe('haflaga');
  });
});

describe('chabadMinhag.calcYomHaChodesh', () => {
  it('returns one result on the same day next Hebrew month', () => {
    const results = chabadMinhag.calcYomHaChodesh(dayAnchor);
    expect(results).toHaveLength(1);
    expect(results[0]!.dateHebrew).toEqual({ year: 5769, month: 9, day: 15 });
  });
});
