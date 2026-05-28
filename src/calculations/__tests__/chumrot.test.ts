/**
 * Chumrot tests - applied on top of base minhag strategies.
 * These tests verify that the calculator layer (not the strategy layer)
 * correctly applies bothOnotOnBeinonit and bothOnotOnYomHaChodesh.
 */
import { calcOnahBeinonit } from '../onahBeinonit';
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

const anchor = makePeriod({
  id: 'p-ch-1',
  dateGregorian: '2008-11-13',
  dateHebrew: { year: 5769, month: 8, day: 15 },
  onah: 'day',
});

describe('bothOnotOnBeinonit chumra', () => {
  it('off: ashkenaz returns one result', () => {
    const results = calcOnahBeinonit(anchor, 'ashkenaz', noChumrot);
    expect(results).toHaveLength(1);
  });

  it('on: returns both day and night on day 30', () => {
    const results = calcOnahBeinonit(anchor, 'ashkenaz', {
      ...noChumrot,
      bothOnotOnBeinonit: true,
    });
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.onah).sort()).toEqual(['day', 'night']);
  });

  it('on with chabad night period: does not duplicate onot', () => {
    const night = { ...anchor, id: 'p-chb-n', onah: 'night' as const };
    const results = calcOnahBeinonit(night, 'chabad', {
      ...noChumrot,
      bothOnotOnBeinonit: true,
    });
    expect(results).toHaveLength(2);
  });
});

describe('bothOnotOnYomHaChodesh chumra', () => {
  it('off: returns one result', () => {
    const results = calcYomHaChodesh(anchor, 'ashkenaz', noChumrot);
    expect(results).toHaveLength(1);
  });

  it('on: returns both day and night', () => {
    const results = calcYomHaChodesh(anchor, 'ashkenaz', {
      ...noChumrot,
      bothOnotOnYomHaChodesh: true,
    });
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.onah).sort()).toEqual(['day', 'night']);
  });
});
