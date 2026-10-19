/**
 * Each forbidden onah carries why it is forbidden, so one card can show
 * "עונה בינונית" with its main onah and each chumra's onah labeled.
 */
import { calcAllVesetim } from '..';
import { A, A_DAY, chumrot, label } from './fixtures';
import type { Chumrot, Period, VesetType } from '../types';

const withReasons = (periods: Period[], c: Chumrot, type: VesetType) =>
  calcAllVesetim(periods, 'ashkenaz', c)
    .filter((r) => r.type === type)
    .map((r) => `${label(r)}: ${r.reasons.join('+')}`);

describe('reasons', () => {
  it('no chumrot → main only', () => {
    expect(withReasons([A], chumrot(), 'onahBeinonit')).toEqual(['ליל ד׳ טבת: main']);
  });

  it('ב11 at night with both: Ohr Zarua before, Kreisi uPleisi after', () => {
    expect(
      withReasons([A], chumrot({ ohrZarua: true, kreisiUpleisi: true }), 'onahBeinonit'),
    ).toEqual(['יום ג׳ טבת: ohrZarua', 'ליל ד׳ טבת: main', 'יום ד׳ טבת: kreisiUpleisi']);
  });

  it('ב14 by day: the night before has both reasons, listed once', () => {
    expect(
      withReasons([A_DAY], chumrot({ ohrZarua: true, kreisiUpleisi: true }), 'onahBeinonit'),
    ).toEqual(['ליל ד׳ טבת: kreisiUpleisi+ohrZarua', 'יום ד׳ טבת: main']);
  });

  it('ב16 Chavot Daat + Ohr Zarua on day 31', () => {
    expect(
      withReasons(
        [A],
        chumrot({ chavotDaat: true, ohrZarua: true, ohrZaruaOnDay31: true }),
        'onahBeinonit',
      ),
    ).toEqual([
      'יום ג׳ טבת: ohrZarua',
      'ליל ד׳ טבת: main',
      'יום ד׳ טבת: ohrZarua',
      'ליל ה׳ טבת: chavotDaat',
    ]);
  });

  it('ח14 yom hachodesh with Ohr Zarua', () => {
    expect(withReasons([A], chumrot({ ohrZarua: true }), 'yomHaChodesh')).toEqual([
      'יום ד׳ טבת: ohrZarua',
      'ליל ה׳ טבת: main',
    ]);
  });
});
