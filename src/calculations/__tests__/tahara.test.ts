/**
 * Hefsek tahara and the seven clean days.
 * Period "א" is the night of ה׳ כסלו תשפ״ז.
 */
import {
  earliestHefsekDate,
  hefsekMinDays,
  mikvehNightDate,
  taharaState,
} from '../tahara';
import type { HebrewDate, TaharaCycle } from '../types';
import { formatHebrewDate } from '../../utils/hebrewDateFormat';
import { A, A_DAY, hp, months } from './fixtures';

const K = (day: number): HebrewDate => ({ year: 5787, month: months.KISLEV, day });
const fmt = (d: HebrewDate) => formatHebrewDate(d);

function cycle(partial: Partial<TaharaCycle> = {}): TaharaCycle {
  return {
    id: 'c1',
    periodId: 'a',
    hefsekDateGregorian: '2026-11-19',
    hefsekDateHebrew: K(9),
    checks: {},
    status: 'active',
    createdAt: '2026-11-18T14:00:00.000Z',
    createdBy: 'test-user',
    ...partial,
  };
}

describe('hefsek minimum days', () => {
  it('Ashkenaz and Chabad wait five days, Sfarad and Teimani four', () => {
    expect(hefsekMinDays('ashkenaz', null)).toBe(5);
    expect(hefsekMinDays('chabad', null)).toBe(5);
    expect(hefsekMinDays('sfarad', null)).toBe(4);
    expect(hefsekMinDays('teimani', null)).toBe(4);
  });

  it('the setting overrides the minhag', () => {
    expect(hefsekMinDays('ashkenaz', 4)).toBe(4);
    expect(hefsekMinDays('sfarad', 5)).toBe(5);
  });

  it('the period day counts as day 1, night or day', () => {
    expect(fmt(earliestHefsekDate(A, 5))).toBe('ט׳ כסלו');
    expect(fmt(earliestHefsekDate(A_DAY, 5))).toBe('ט׳ כסלו');
    expect(fmt(earliestHefsekDate(A, 4))).toBe('ח׳ כסלו');
  });

  it('crosses a month end', () => {
    const late = hp('late', 'day', 28, months.KISLEV, 5787);
    expect(fmt(earliestHefsekDate(late, 5))).toBe('ב׳ טבת');
  });
});

describe('mikveh night', () => {
  it('is the night after the seventh clean day', () => {
    // hefsek ט׳, clean days י׳–ט״ז, mikveh night = ליל י״ז
    expect(fmt(mikvehNightDate(K(9)))).toBe('י״ז כסלו');
  });
});

describe('tahara state', () => {
  it('no period → none', () => {
    expect(taharaState([], [], K(10), 5).kind).toBe('none');
  });

  it('before the earliest day → waiting', () => {
    const s = taharaState([A], [], K(7), 5);
    expect(s.kind).toBe('waitHefsek');
    if (s.kind === 'waitHefsek') expect(fmt(s.earliest)).toBe('ט׳ כסלו');
  });

  it('from the earliest day → hefsek today', () => {
    expect(taharaState([A], [], K(9), 5).kind).toBe('hefsekToday');
    expect(taharaState([A], [], K(11), 5).kind).toBe('hefsekToday');
  });

  it('hefsek day itself counts as day 0, then days 1–6 are counting', () => {
    const c = cycle();
    const s0 = taharaState([A], [c], K(9), 5);
    expect(s0.kind).toBe('counting');
    if (s0.kind === 'counting') expect(s0.day).toBe(0);
    const s3 = taharaState([A], [c], K(12), 5);
    if (s3.kind === 'counting') expect(s3.day).toBe(3);
  });

  it('day 7 → mikveh night tonight; the day after → last night; then nothing', () => {
    const c = cycle();
    const s7 = taharaState([A], [c], K(16), 5);
    expect(s7).toMatchObject({ kind: 'mikvehNight', isTonight: true });
    expect(taharaState([A], [c], K(17), 5)).toMatchObject({ kind: 'mikvehNight', isTonight: false });
    expect(taharaState([A], [c], K(18), 5).kind).toBe('none');
  });

  it('a check that is not clean → a new hefsek from that day', () => {
    const c = cycle({ checks: { '1-morning': 'clean', '3-evening': 'notClean' } });
    const s = taharaState([A], [c], K(12), 5);
    expect(s).toMatchObject({ kind: 'hefsekToday', afterRestart: true });
    if (s.kind === 'hefsekToday') expect(fmt(s.earliest)).toBe('י״ב כסלו');
  });

  it('a new hefsek after a restart starts a new count', () => {
    const old = cycle({ status: 'restarted', checks: { '2-morning': 'notClean' } });
    const next = cycle({ id: 'c2', hefsekDateHebrew: K(12), createdAt: '2026-11-21T14:00:00.000Z' });
    const s = taharaState([A], [old, next], K(14), 5);
    expect(s).toMatchObject({ kind: 'counting', day: 2 });
  });

  it('a new period ignores cycles of the previous period', () => {
    const next = hp('b', 'day', 3, months.TEVET, 5787);
    const s = taharaState([A, next], [cycle()], { year: 5787, month: months.TEVET, day: 4 }, 5);
    expect(s.kind).toBe('waitHefsek');
  });

  it('with nothing recorded, stops asking two weeks after the earliest day', () => {
    // earliest ט׳ כסלו; still asks on כ״ג, not on כ״ד
    expect(taharaState([A], [], K(23), 5).kind).toBe('hefsekToday');
    expect(taharaState([A], [], K(24), 5).kind).toBe('none');
  });

  it('after a restart it keeps asking', () => {
    const c = cycle({ checks: { '1-morning': 'notClean' } });
    expect(taharaState([A], [c], K(28), 5).kind).toBe('hefsekToday');
  });
});
