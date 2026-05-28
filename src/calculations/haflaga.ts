import { minhagRegistry } from './minhagim';
import type { Chumrot, Minhag, Period, VesetResult } from './types';

/**
 * Computes haflaga (interval vest) from the last two periods.
 * Delegates to the minhag strategy. No chumrot currently affect haflaga.
 * Source: Shulchan Aruch Yoreh De'ah 189:4
 *
 * @param periods - All recorded periods (will be sorted internally)
 * @param minhag  - Community tradition
 * @param chumrot - Reserved for future chumrot that affect haflaga
 *                  (e.g. onahBeinonitIfHaflaga is handled at the UI level)
 */
export function calcHaflaga(
  periods: Period[],
  minhag: Minhag,
  chumrot: Chumrot,
): VesetResult[] {
  // NOTE: chumrot.onahBeinonitIfHaflaga means "also keep onah beinonit when
  // haflaga falls on a different day". This is a UI/display concern handled
  // in calcAllVesetim, not here. This function returns only the haflaga vest.
  void chumrot;
  return minhagRegistry[minhag].calcHaflaga(periods);
}
