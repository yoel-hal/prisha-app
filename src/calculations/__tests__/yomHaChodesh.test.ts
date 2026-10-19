/**
 * Yom hachodesh tests ח1–ח19 from docs/חישובי-עונות-v1.docx §9.
 * In 5787 Cheshvan and Kislev have 30 days and Tevet 29; 5790 is a leap year
 * (Adar I 30 days, Adar II 29); 5788 is a common year.
 */
import { calcAllVesetim } from '..';
import { A, A_DAY, chumrot, hp, labels, months } from './fixtures';
import type { Chumrot, Period } from '../types';

const chodesh = (periods: Period[] = [A], c: Chumrot = chumrot()) =>
  calcAllVesetim(periods, 'ashkenaz', c).filter((r) => r.type === 'yomHaChodesh');
const chodeshLabels = (periods?: Period[], c?: Chumrot) => labels(chodesh(periods, c));

describe('yom hachodesh', () => {
  it('ח1: same day next month, same onah', () => {
    expect(chodeshLabels()).toEqual(['ליל ה׳ טבת']);
  });

  it('ח2: day period', () => {
    expect(chodeshLabels([A_DAY])).toEqual(['יום ה׳ טבת']);
  });

  it('ח3: Elul → Tishrei of the next year', () => {
    const results = chodesh([hp('e', 'night', 15, months.ELUL, 5786)]);
    expect(labels(results)).toEqual(['ליל ט״ו תשרי']);
    expect(results[0]!.dateHebrew.year).toBe(5787);
  });

  it('ח4: כ״ט אלול → כ״ט תשרי', () => {
    const results = chodesh([hp('e', 'night', 29, months.ELUL, 5786)]);
    expect(labels(results)).toEqual(['ליל כ״ט תשרי']);
    expect(results[0]!.dateHebrew.year).toBe(5787);
  });

  it('ח5: ל׳ חשון → ל׳ כסלו (Kislev has 30 days)', () => {
    expect(chodeshLabels([hp('c', 'night', 30, months.CHESHVAN, 5787)])).toEqual(['ליל ל׳ כסלו']);
  });

  const k30 = hp('k30', 'night', 30, months.KISLEV, 5787);

  it('ח6: ל׳ כסלו, Tevet has 29 days, default → no yom hachodesh; onah beinonit still on כ״ט טבת', () => {
    expect(chodeshLabels([k30])).toEqual([]);
    expect(labels(calcAllVesetim([k30], 'ashkenaz', chumrot()), 'onahBeinonit')).toEqual([
      'ליל כ״ט טבת',
    ]);
  });

  it('ח7: same, rule "1st of the following month" → א׳ שבט', () => {
    expect(chodeshLabels([k30], chumrot({ shortMonthRule: 'firstOfFollowing' }))).toEqual([
      'ליל א׳ שבט',
    ]);
  });

  it('ח8: same, rule "29th of the next month" → כ״ט טבת', () => {
    expect(chodeshLabels([k30], chumrot({ shortMonthRule: 'twentyNinth' }))).toEqual([
      'ליל כ״ט טבת',
    ]);
  });

  it('ח9: leap year, Shevat → Adar I', () => {
    expect(chodeshLabels([hp('s', 'night', 15, months.SHVAT, 5790)])).toEqual(['ליל ט״ו אדר א׳']);
  });

  it('ח10: Adar I → Adar II', () => {
    expect(chodeshLabels([hp('a1', 'night', 10, months.ADAR_I, 5790)])).toEqual([
      'ליל י׳ אדר ב׳',
    ]);
  });

  it('ח11: Adar II → Nisan', () => {
    expect(chodeshLabels([hp('a2', 'night', 10, months.ADAR_II, 5790)])).toEqual(['ליל י׳ ניסן']);
  });

  it('ח12: common year, Adar → Nisan', () => {
    expect(chodeshLabels([hp('a', 'night', 10, months.ADAR_I, 5788)])).toEqual(['ליל י׳ ניסן']);
  });

  it('ח13: ל׳ אדר א׳ (Adar II has 29 days), default → none', () => {
    expect(chodeshLabels([hp('a1', 'night', 30, months.ADAR_I, 5790)])).toEqual([]);
  });

  it('ח14: Ohr Zarua, night → also the day before', () => {
    expect(chodeshLabels([A], chumrot({ ohrZarua: true }))).toEqual(['יום ד׳ טבת', 'ליל ה׳ טבת']);
  });

  it('ח15: Ohr Zarua, day → also the night before', () => {
    expect(chodeshLabels([A_DAY], chumrot({ ohrZarua: true }))).toEqual([
      'ליל ה׳ טבת',
      'יום ה׳ טבת',
    ]);
  });

  it('ח16: Kreisi uPleisi and Chavot Daat do not touch yom hachodesh', () => {
    expect(chodeshLabels([A], chumrot({ kreisiUpleisi: true, chavotDaat: true }))).toEqual([
      'ליל ה׳ טבת',
    ]);
  });

  const C = hp('c', 'night', 6, months.CHESHVAN, 5787);

  it('ח17: kavuah chodesh on day 5 → only ה׳ טבת; no onah beinonit or haflaga', () => {
    const all = calcAllVesetim([C, A], 'ashkenaz', chumrot({ kavuah: { type: 'chodesh', dayOfMonth: 5 } }));
    expect(labels(all)).toEqual(['ליל ה׳ טבת']);
    expect(all[0]!.type).toBe('yomHaChodesh');
    expect(all[0]!.isKavuah).toBe(true);
  });

  it('ח18: kavuah haflaga → no yom hachodesh', () => {
    expect(chodeshLabels([C, A], chumrot({ kavuah: { type: 'haflaga', days: 26 } }))).toEqual([]);
  });

  it('ח19: only the Hebrew date counts; the civil date is ignored', () => {
    const blank = { ...A, dateGregorian: '' };
    const wrong = { ...A, dateGregorian: '1999-01-01' };
    for (const period of [blank, wrong]) {
      expect(chodeshLabels([period])).toEqual(['ליל ה׳ טבת']);
      expect(labels(calcAllVesetim([period], 'ashkenaz', chumrot()), 'onahBeinonit')).toEqual([
        'ליל ד׳ טבת',
      ]);
    }
  });
});
