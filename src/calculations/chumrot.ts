import type { Chumrot, Kavuah, NightConflictChoice, ShortMonthRule } from './types';

export const DEFAULT_CHUMROT: Chumrot = {
  ohrZarua: false,
  kreisiUpleisi: false,
  nightConflict: 'both',
  chavotDaat: false,
  // Open question 4: the stricter option until decided.
  ohrZaruaOnDay31: true,
  shortMonthRule: 'none',
  kavuah: { type: 'none' },
  kavuahNeedsReview: false,
};

const NIGHT_CONFLICT: NightConflictChoice[] = ['both', 'ohrZarua', 'kreisiUpleisi'];
const SHORT_MONTH: ShortMonthRule[] = ['none', 'firstOfFollowing', 'twentyNinth'];

function isWholeNumber(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

function normalizeKavuah(raw: unknown): Kavuah {
  if (!raw || typeof raw !== 'object') {
    return { type: 'none' };
  }
  const record = raw as Record<string, unknown>;
  if (record.type === 'haflaga' && isWholeNumber(record.days, 2, 400)) {
    return { type: 'haflaga', days: record.days };
  }
  if (record.type === 'chodesh' && isWholeNumber(record.dayOfMonth, 1, 30)) {
    return { type: 'chodesh', dayOfMonth: record.dayOfMonth };
  }
  return { type: 'none' };
}

/**
 * Reads chumrot saved in Firestore, including settings saved before v1:
 * - bothOnotOnBeinonit kept both onot of day 30, which is Kreisi uPleisi → kreisiUpleisi
 * - bothOnotOnYomHaChodesh is dropped (Kreisi uPleisi does not apply to yom hachodesh)
 * - the old kavuah on/off switch → no kavuah, and the user is asked to set it again
 * - veshetEinah and onahBeinonitIfHaflaga are dropped
 * - minhag "yireim" (removed earlier) → Kreisi uPleisi
 */
export function normalizeChumrot(raw: unknown, rawMinhag?: unknown): Chumrot {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const legacyKavuahOn = record.kavuah === true;

  const kreisiUpleisi =
    typeof record.kreisiUpleisi === 'boolean'
      ? record.kreisiUpleisi
      : record.bothOnotOnBeinonit === true || rawMinhag === 'yireim';

  return {
    ohrZarua: record.ohrZarua === true,
    kreisiUpleisi,
    nightConflict: NIGHT_CONFLICT.includes(record.nightConflict as NightConflictChoice)
      ? (record.nightConflict as NightConflictChoice)
      : DEFAULT_CHUMROT.nightConflict,
    chavotDaat: record.chavotDaat === true,
    ohrZaruaOnDay31:
      typeof record.ohrZaruaOnDay31 === 'boolean'
        ? record.ohrZaruaOnDay31
        : DEFAULT_CHUMROT.ohrZaruaOnDay31,
    shortMonthRule: SHORT_MONTH.includes(record.shortMonthRule as ShortMonthRule)
      ? (record.shortMonthRule as ShortMonthRule)
      : DEFAULT_CHUMROT.shortMonthRule,
    kavuah: normalizeKavuah(record.kavuah),
    kavuahNeedsReview: legacyKavuahOn || record.kavuahNeedsReview === true,
  };
}
