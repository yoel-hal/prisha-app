/**
 * Haflaga tests ה1–ה9 from docs/חישובי-עונות-v1.docx §9.
 * ליל ו׳ חשון → ליל ה׳ כסלו is a haflaga of 30 (29 days apart), so the next is ד׳ טבת.
 */
import { calcAllVesetim } from '..';
import { A, A_DAY, chumrot, hp, labels, months } from './fixtures';
import type { Chumrot, Period } from '../types';

const C = hp('c', 'night', 6, months.CHESHVAN, 5787);
const all = (periods: Period[], c: Chumrot = chumrot()) => calcAllVesetim(periods, 'ashkenaz', c);
const haflaga = (periods: Period[], c?: Chumrot) => labels(all(periods, c), 'haflaga');

describe('haflaga', () => {
  it('ה1: one period → no haflaga', () => {
    expect(haflaga([A])).toEqual([]);
  });

  it('ה2: two periods → same interval again', () => {
    expect(haflaga([C, A])).toEqual(['ליל ד׳ טבת']);
  });

  it('ה3: only the last two periods count', () => {
    expect(haflaga([hp('t', 'night', 16, months.TISHREI, 5787), C, A])).toEqual(['ליל ד׳ טבת']);
  });

  it('ה4: the onah of the latest period (day then night)', () => {
    expect(haflaga([{ ...C, onah: 'day' }, A])).toEqual(['ליל ד׳ טבת']);
  });

  it('ה5: the onah of the latest period (night then day)', () => {
    expect(haflaga([C, A_DAY])).toEqual(['יום ד׳ טבת']);
  });

  it('ה6: entry order does not matter', () => {
    expect(haflaga([A, C])).toEqual(['ליל ד׳ טבת']);
  });

  it('ה7: kavuah haflaga of 26 → only ל׳ כסלו; no onah beinonit or yom hachodesh', () => {
    const results = all([C, A], chumrot({ kavuah: { type: 'haflaga', days: 26 } }));
    expect(labels(results)).toEqual(['ליל ל׳ כסלו']);
    expect(results[0]!.type).toBe('haflaga');
    expect(results[0]!.isKavuah).toBe(true);
  });

  it('ה8 (interim, open question 5): Ohr Zarua applies to haflaga', () => {
    expect(haflaga([C, A], chumrot({ ohrZarua: true }))).toEqual(['יום ג׳ טבת', 'ליל ד׳ טבת']);
  });

  it('ה9: haflaga and onah beinonit on the same onah are each listed once', () => {
    const onDay = all([C, A]).filter((r) => r.dateHebrew.day === 4 && r.onah === 'night');
    expect(onDay.map((r) => r.type).sort()).toEqual(['haflaga', 'onahBeinonit']);
  });
});
