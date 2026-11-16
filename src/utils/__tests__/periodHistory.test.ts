/**
 * Past periods keep showing what was calculated from them, marked passed or replaced.
 * Example: periods on ג׳ תשרי, א׳ חשוון and כ״ח חשוון תשפ״ז (all by day), "today" 19.10.2026
 * (ח׳ חשוון), as in the owner's question.
 */
import { calcAllVesetim } from '../../calculations';
import { chumrot, hp, label, months } from '../../calculations/__tests__/fixtures';
import { vesetimFromPeriod } from '../periodHistory';

const T3 = hp('t3', 'day', 3, months.TISHREI, 5787);
const CH1 = hp('ch1', 'day', 1, months.CHESHVAN, 5787);
const CH28 = hp('ch28', 'day', 28, months.CHESHVAN, 5787);
const periods = [T3, CH1, CH28];
const c = chumrot();
const current = calcAllVesetim(periods, 'ashkenaz', c);
const TODAY = '2026-10-19';

const history = (id: string) =>
  vesetimFromPeriod(periods, id, 'ashkenaz', c, current, TODAY).map(
    (h) => `${h.veset.type} ${label(h.veset)}: ${h.status}${h.replacedBy ? ` by ${h.replacedBy.id}` : ''}`,
  );

describe('period history', () => {
  it('ג׳ תשרי: its onah beinonit and yom hachodesh have passed', () => {
    expect(history('t3')).toEqual([
      'onahBeinonit יום ב׳ חשון: passed',
      'yomHaChodesh יום ג׳ חשון: passed',
    ]);
  });

  it('א׳ חשוון: beinonit and yom hachodesh still ahead; its haflaga was replaced by כ״ח חשוון', () => {
    expect(history('ch1')).toEqual([
      // ג׳ תשרי → א׳ חשוון is 28 days, so the haflaga was כ״ט חשון; כ״ח חשוון came first.
      'haflaga יום כ״ט חשון: replaced by ch28',
      'onahBeinonit יום ל׳ חשון: upcoming',
      'yomHaChodesh יום א׳ כסלו: upcoming',
    ]);
  });

  it('כ״ח חשוון (latest): all upcoming', () => {
    expect(history('ch28')).toEqual([
      'haflaga יום כ״ה כסלו: upcoming',
      'onahBeinonit יום כ״ז כסלו: upcoming',
      'yomHaChodesh יום כ״ח כסלו: upcoming',
    ]);
  });
});
