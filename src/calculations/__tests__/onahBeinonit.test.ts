/**
 * Onah beinonit tests ב1–ב20 from docs/חישובי-עונות-v1.docx §9.
 * "א" = the night of ה׳ כסלו תשפ״ז; day 29 = ג׳ טבת, day 30 = ד׳ טבת, day 31 = ה׳ טבת.
 */
import { calcAllVesetim } from '..';
import { A, A_DAY, chumrot, hp, labels, months } from './fixtures';

const beinonit = (periods = [A], c = chumrot(), minhag: 'ashkenaz' | 'sfarad' | 'teimani' | 'chabad' = 'ashkenaz') =>
  labels(calcAllVesetim(periods, minhag, c), 'onahBeinonit');

const OZ = { ohrZarua: true };
const KUP = { kreisiUpleisi: true };
const CD = { chavotDaat: true };

describe('onah beinonit', () => {
  it('ב1: night period, no chumrot → only the night of day 30', () => {
    expect(beinonit()).toEqual(['ליל ד׳ טבת']);
  });

  it('ב2: day period → only the day of day 30', () => {
    expect(beinonit([A_DAY])).toEqual(['יום ד׳ טבת']);
  });

  it('ב3: Sfarad and Teimani match Ashkenaz', () => {
    expect(beinonit([A], chumrot(), 'sfarad')).toEqual(['ליל ד׳ טבת']);
    expect(beinonit([A], chumrot(), 'teimani')).toEqual(['ליל ד׳ טבת']);
  });

  it('ב4: only from the latest of three periods', () => {
    const periods = [
      hp('t', 'night', 16, months.TISHREI, 5787),
      hp('c', 'night', 6, months.CHESHVAN, 5787),
      A,
    ];
    expect(beinonit(periods)).toEqual(['ליל ד׳ טבת']);
  });

  it('ב5: Chavot Daat, night → day 30 and day 31, same onah', () => {
    expect(beinonit([A], chumrot(CD))).toEqual(['ליל ד׳ טבת', 'ליל ה׳ טבת']);
  });

  it('ב6: Chavot Daat, day', () => {
    expect(beinonit([A_DAY], chumrot(CD))).toEqual(['יום ד׳ טבת', 'יום ה׳ טבת']);
  });

  it('ב7: Ohr Zarua, night → also the day before (day of the previous date)', () => {
    expect(beinonit([A], chumrot(OZ))).toEqual(['יום ג׳ טבת', 'ליל ד׳ טבת']);
  });

  it('ב8: Ohr Zarua, day → also the night of the same date', () => {
    expect(beinonit([A_DAY], chumrot(OZ))).toEqual(['ליל ד׳ טבת', 'יום ד׳ טבת']);
  });

  it('ב9: Kreisi uPleisi, night → also the day after', () => {
    expect(beinonit([A], chumrot(KUP))).toEqual(['ליל ד׳ טבת', 'יום ד׳ טבת']);
  });

  it('ב10: Kreisi uPleisi, day → also the night before', () => {
    expect(beinonit([A_DAY], chumrot(KUP))).toEqual(['ליל ד׳ טבת', 'יום ד׳ טבת']);
  });

  it('ב11: Ohr Zarua + Kreisi uPleisi at night, "both"', () => {
    expect(beinonit([A], chumrot({ ...OZ, ...KUP, nightConflict: 'both' }))).toEqual([
      'יום ג׳ טבת',
      'ליל ד׳ טבת',
      'יום ד׳ טבת',
    ]);
  });

  it('ב12: Ohr Zarua + Kreisi uPleisi at night, "Ohr Zarua only"', () => {
    expect(beinonit([A], chumrot({ ...OZ, ...KUP, nightConflict: 'ohrZarua' }))).toEqual([
      'יום ג׳ טבת',
      'ליל ד׳ טבת',
    ]);
  });

  it('ב13: Ohr Zarua + Kreisi uPleisi at night, "Kreisi uPleisi only"', () => {
    expect(
      beinonit([A], chumrot({ ...OZ, ...KUP, nightConflict: 'kreisiUpleisi' })),
    ).toEqual(['ליל ד׳ טבת', 'יום ד׳ טבת']);
  });

  it.each(['both', 'ohrZarua', 'kreisiUpleisi'] as const)(
    'ב14: Ohr Zarua + Kreisi uPleisi by day (%s) → exactly two, no duplicates',
    (nightConflict) => {
      expect(beinonit([A_DAY], chumrot({ ...OZ, ...KUP, nightConflict }))).toEqual([
        'ליל ד׳ טבת',
        'יום ד׳ טבת',
      ]);
    },
  );

  it('ב15: Chavot Daat + Ohr Zarua, Ohr Zarua on day 30 only', () => {
    expect(beinonit([A], chumrot({ ...CD, ...OZ, ohrZaruaOnDay31: false }))).toEqual([
      'יום ג׳ טבת',
      'ליל ד׳ טבת',
      'ליל ה׳ טבת',
    ]);
  });

  it('ב16: Chavot Daat + Ohr Zarua, Ohr Zarua on day 31 too', () => {
    expect(beinonit([A], chumrot({ ...CD, ...OZ, ohrZaruaOnDay31: true }))).toEqual([
      'יום ג׳ טבת',
      'ליל ד׳ טבת',
      'יום ד׳ טבת',
      'ליל ה׳ טבת',
    ]);
  });

  it('ב17: Chavot Daat + Kreisi uPleisi, night → Kreisi uPleisi not on day 31', () => {
    expect(beinonit([A], chumrot({ ...CD, ...KUP }))).toEqual([
      'ליל ד׳ טבת',
      'יום ד׳ טבת',
      'ליל ה׳ טבת',
    ]);
  });

  it('ב18: Chavot Daat + Kreisi uPleisi, day', () => {
    expect(beinonit([A_DAY], chumrot({ ...CD, ...KUP }))).toEqual([
      'ליל ד׳ טבת',
      'יום ד׳ טבת',
      'יום ה׳ טבת',
    ]);
  });

  it('ב19: with a kavuah there is no onah beinonit', () => {
    expect(beinonit([A], chumrot({ kavuah: { type: 'haflaga', days: 30 } }))).toEqual([]);
    expect(beinonit([A], chumrot({ kavuah: { type: 'chodesh', dayOfMonth: 5 } }))).toEqual([]);
  });

  it('ב20: from ל׳ כסלו (Tevet has 29 days) → כ״ט טבת', () => {
    expect(beinonit([hp('k30', 'night', 30, months.KISLEV, 5787)])).toEqual(['ליל כ״ט טבת']);
  });

  it('ב21 (interim, open question 1): Chabad night → night and day of day 30; day → day only', () => {
    expect(beinonit([A], chumrot(), 'chabad')).toEqual(['ליל ד׳ טבת', 'יום ד׳ טבת']);
    expect(beinonit([A_DAY], chumrot(), 'chabad')).toEqual(['יום ד׳ טבת']);
  });
});
