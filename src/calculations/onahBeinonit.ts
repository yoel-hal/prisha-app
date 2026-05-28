import { minhagRegistry } from './minhagim';
import type { Chumrot, Minhag, Period, VesetResult } from './types';

/**
 * Computes onah beinonit (thirtieth-day vest) for a single period.
 * Delegates base logic to the minhag strategy, then applies chumrot on top.
 * Source: Shulchan Aruch Yoreh De'ah 189:2
 *
 * @param period  - The anchor period (day 1 of the count)
 * @param minhag  - Community tradition; determines base one-or-two-onot rule
 * @param chumrot - Additional strictnesses applied on top of the minhag base
 */
export function calcOnahBeinonit(
  period: Period,
  minhag: Minhag,
  chumrot: Chumrot,
): VesetResult[] {
  // Get the base result(s) from the minhag strategy.
  const base = minhagRegistry[minhag].calcOnahBeinonit(period);

  // Apply chumra: bothOnotOnBeinonit means keep BOTH day and night on day 30,
  // regardless of what the base minhag returned.
  // We only add extra results — we never remove what the minhag already returns.
  if (chumrot.bothOnotOnBeinonit) {
    const dateGregorian = base[0]!.dateGregorian;
    const hasDay = base.some((r) => r.onah === 'day');
    const hasNight = base.some((r) => r.onah === 'night');
    const extra: VesetResult[] = [];
    if (!hasDay) {
      extra.push({
        ...base[0]!,
        id: `veset-onahBeinonit-${period.id}-${dateGregorian}-day`,
        onah: 'day',
      });
    }
    if (!hasNight) {
      extra.push({
        ...base[0]!,
        id: `veset-onahBeinonit-${period.id}-${dateGregorian}-night`,
        onah: 'night',
      });
    }
    return [...base, ...extra];
  }

  return base;
}
