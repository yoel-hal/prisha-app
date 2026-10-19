import type { Minhag, Onah } from '../types';

/**
 * The base rules that differ between minhagim. Everything else (counting days,
 * chumrot, kavuah) is shared and lives in the calculators.
 * To change a minhag's rule, edit its entry here.
 */
export type MinhagRules = {
  /** The onot forbidden on day 30 (and day 31 with Chavot Daat), before chumrot. */
  beinonitOnot(periodOnah: Onah): Onah[];
};

/** Ashkenaz, Sfarad, Teimani: only the onah of the period. */
const sameOnah: MinhagRules = {
  beinonitOnot: (periodOnah) => [periodOnah],
};

/**
 * Chabad: a night period forbids both the night and the day of day 30; a day
 * period only the day. Open question 1 in docs/חישובי-עונות-v1.docx; this is the
 * interim rule until it is decided.
 */
const chabad: MinhagRules = {
  beinonitOnot: (periodOnah) => (periodOnah === 'night' ? ['night', 'day'] : ['day']),
};

export const minhagRegistry: Record<Minhag, MinhagRules> = {
  ashkenaz: sameOnah,
  sfarad: sameOnah,
  chabad,
  teimani: sameOnah,
};
