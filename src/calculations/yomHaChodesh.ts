import { minhagRegistry } from './minhagim';
import type { Chumrot, Minhag, Period, VesetResult } from './types';

/**
 * Computes yom hachodesh (same Hebrew date next month) vest.
 * Delegates base logic to the minhag strategy, then applies chumrot on top.
 * Source: Shulchan Aruch Yoreh De'ah 189:6
 *
 * @param period  - Anchor period whose Hebrew day-of-month defines the vest
 * @param minhag  - Community tradition
 * @param chumrot - Additional strictnesses applied on top of the minhag base
 */
export function calcYomHaChodesh(
  period: Period,
  minhag: Minhag,
  chumrot: Chumrot,
): VesetResult[] {
  const base = minhagRegistry[minhag].calcYomHaChodesh(period);

  // Apply chumra: bothOnotOnYomHaChodesh means keep BOTH day and night
  // on that Hebrew date next month, regardless of base minhag result.
  if (chumrot.bothOnotOnYomHaChodesh) {
    const dateGregorian = base[0]!.dateGregorian;
    const hasDay = base.some((r) => r.onah === 'day');
    const hasNight = base.some((r) => r.onah === 'night');
    const extra: VesetResult[] = [];
    if (!hasDay) {
      extra.push({
        ...base[0]!,
        id: `veset-yomHaChodesh-${period.id}-${dateGregorian}-day`,
        onah: 'day',
      });
    }
    if (!hasNight) {
      extra.push({
        ...base[0]!,
        id: `veset-yomHaChodesh-${period.id}-${dateGregorian}-night`,
        onah: 'night',
      });
    }
    return [...base, ...extra];
  }

  return base;
}
