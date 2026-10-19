import { formatGregorianLocal, hebrewDateToGregorian } from './onah';
import { onahKey, previousOnah, type HebrewOnah } from './hebrewCalendar';
import type { Minhag, Period, VesetReason, VesetResult, VesetType } from './types';

/** An onah to forbid, with the reasons it is forbidden. */
export type Target = HebrewOnah & { reasons: VesetReason[] };

const REASON_ORDER: VesetReason[] = ['main', 'chavotDaat', 'kreisiUpleisi', 'ohrZarua'];

export function tag(targets: HebrewOnah[], reason: VesetReason): Target[] {
  return targets.map((target) => ({ ...target, reasons: [reason] }));
}

/** Builds a result. The civil date is added here only, for display. */
export function makeResult(
  type: VesetType,
  source: Period,
  target: Target,
  minhag: Minhag,
  isKavuah = false,
): VesetResult {
  const dateGregorian = formatGregorianLocal(hebrewDateToGregorian(target.date));
  return {
    // Same id shape as before v1, so synced calendar events keep their ids.
    id: `veset-${type}-${source.id}-${dateGregorian}-${target.onah}`,
    type,
    dateGregorian,
    dateHebrew: target.date,
    onah: target.onah,
    sourcePeriodId: source.id,
    minhagLabel: minhag,
    isKavuah,
    reasons: target.reasons,
  };
}

/** The onah before each target, tagged as Ohr Zarua. */
export function ohrZaruaBefore(targets: HebrewOnah[]): Target[] {
  return tag(targets.map(previousOnah), 'ohrZarua');
}

/** The targets plus, with Ohr Zarua, the onah before each of them. */
export function withOhrZarua(targets: Target[], ohrZarua: boolean): Target[] {
  return ohrZarua ? [...ohrZaruaBefore(targets), ...targets] : targets;
}

/** One entry per onah (reasons merged), in Hebrew order (night before day). */
export function uniqueOnot(targets: Target[]): Target[] {
  const byKey = new Map<number, Target>();
  for (const target of targets) {
    const key = onahKey(target.date, target.onah);
    const existing = byKey.get(key);
    const reasons = new Set([...(existing?.reasons ?? []), ...target.reasons]);
    byKey.set(key, {
      ...target,
      reasons: REASON_ORDER.filter((reason) => reasons.has(reason)),
    });
  }
  return [...byKey.entries()].sort((a, b) => a[0] - b[0]).map(([, target]) => target);
}
