/**
 * Display tests ת1–ת5 from docs/חישובי-עונות-v1.docx §9: a night onah names the
 * evening it starts, so it can't be read as the following evening.
 */
import { months } from '@hebcal/hdate';

import en from '../../i18n/locales/en.json';
import he from '../../i18n/locales/he.json';
import { formatOnahDate } from '../onahDisplay';

type Dict = Record<string, unknown>;

/** Minimal i18next-style t: dotted keys and {{name}} interpolation. */
function makeT(dict: Dict) {
  return (key: string, options: Record<string, unknown> = {}) => {
    const template = key.split('.').reduce<unknown>((node, part) => (node as Dict)[part], dict);
    return String(template).replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(options[name]));
  };
}

const tHe = makeT(he as Dict);
const tEn = makeT(en as Dict);
const TEVET_4 = { year: 5787, month: months.TEVET, day: 4 };

describe('onah date display', () => {
  it('ת1: a night result names the evening before', () => {
    expect(formatOnahDate(TEVET_4, 'night', 'he', tHe).line).toBe(
      'ליל ד׳ טבת – בערב יום א׳, 13.12.2026',
    );
  });

  it('ת2: a day result', () => {
    expect(formatOnahDate(TEVET_4, 'day', 'he', tHe).line).toBe('יום ד׳ טבת – יום ב׳, 14.12.2026');
  });

  it('ת3: form, ה׳ כסלו night → motzei Shabbat', () => {
    expect(
      formatOnahDate({ year: 5787, month: months.KISLEV, day: 5 }, 'night', 'he', tHe).formLine,
    ).toBe('ליל ה׳ כסלו: מוצאי שבת, 14.11.2026 בערב');
  });

  it('ת4: form, ד׳ כסלו (Shabbat) night → Friday night', () => {
    expect(
      formatOnahDate({ year: 5787, month: months.KISLEV, day: 4 }, 'night', 'he', tHe).formLine,
    ).toBe('ליל ד׳ כסלו: ליל שבת, 13.11.2026 בערב');
  });

  it('ת5: English has the same structure, Hebrew date in Hebrew letters', () => {
    expect(formatOnahDate(TEVET_4, 'night', 'en', tEn).line).toBe(
      'Night of ד׳ טבת – Sunday evening, Dec 13, 2026',
    );
    expect(formatOnahDate(TEVET_4, 'day', 'en', tEn).line).toBe(
      'Day of ד׳ טבת – Monday, Dec 14, 2026',
    );
    expect(
      formatOnahDate({ year: 5787, month: months.KISLEV, day: 5 }, 'night', 'en', tEn).formLine,
    ).toBe('Night of ה׳ כסלו: Motzei Shabbat, Nov 14, 2026 evening');
  });
});
