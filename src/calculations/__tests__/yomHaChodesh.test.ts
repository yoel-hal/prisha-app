/**
 * Verifies yom ha'chodesh (Shulchan Aruch Yoreh De'ah 189:6): same Hebrew day-of-month in the
 * next Hebrew month with the same onah for most minhagim, and both onot for yireim.
 */
import { calcYomHaChodesh } from '../yomHaChodesh';
import type { Chumrot } from '../types';
import { makePeriod } from './fixtures';

const noChumrot: Chumrot = {
  kavuah: false,
  veshetEinah: false,
  onahBeinonitIfHaflaga: false,
  bothOnotOnBeinonit: false,
  bothOnotOnYomHaChodesh: false,
};

describe('calcYomHaChodesh', () => {
  const anchor = makePeriod({
    id: 'p-yhc-1',
    dateGregorian: '2008-11-13',
    dateHebrew: { year: 5769, month: 8, day: 15 },
    onah: 'night',
  });

  it('ashkenaz: one result next Hebrew month, same onah', () => {
    const results = calcYomHaChodesh(anchor, 'ashkenaz', noChumrot);
    expect(results).toHaveLength(1);
    expect(results[0]!.type).toBe('yomHaChodesh');
    expect(results[0]!.onah).toBe('night');
    expect(results[0]!.dateHebrew).toEqual({ year: 5769, month: 9, day: 15 });
  });

  it('bothOnotOnYomHaChodesh: both onot on the same target Hebrew date', () => {
    const results = calcYomHaChodesh(anchor, 'ashkenaz', {
      ...noChumrot,
      bothOnotOnYomHaChodesh: true,
    });
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.onah).sort()).toEqual(['day', 'night']);
    expect(results[0]!.dateHebrew).toEqual(results[1]!.dateHebrew);
  });

  /** teimani matches ashkenaz/sfarad/chabad pattern: single onah on the next Hebrew month. */
  it('teimani: single vest with same onah as the anchor', () => {
    const dayAnchor = { ...anchor, id: 'p-yhc-day', onah: 'day' as const };
    const results = calcYomHaChodesh(dayAnchor, 'teimani', noChumrot);
    expect(results).toHaveLength(1);
    expect(results[0]!.onah).toBe('day');
    expect(results[0]!.dateHebrew).toEqual({ year: 5769, month: 9, day: 15 });
  });
});
