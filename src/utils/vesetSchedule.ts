import type { Onah, VesetResult } from '../calculations/types';

/** Approximate local time for the start of a day or night onah on the veset date. */
export function vesetOnahDate(veset: VesetResult): Date {
  const [year, month, day] = veset.dateGregorian.split('-').map(Number);
  const hour = veset.onah === 'day' ? 7 : 18;
  return new Date(year, month - 1, day, hour, 0, 0, 0);
}

/** When to fire a lead-time reminder; null if that moment is already past. */
export function notificationTriggerDate(
  veset: VesetResult,
  leadHours: number,
): Date | null {
  const vesetTime = vesetOnahDate(veset);
  const trigger = new Date(vesetTime.getTime() - leadHours * 60 * 60 * 1000);
  if (trigger.getTime() <= Date.now()) {
    return null;
  }
  return trigger;
}

export function isVesetNotificationId(identifier: string): boolean {
  return identifier.startsWith('veset-');
}

export function onahLabelKey(onah: Onah): string {
  return onah === 'day' ? 'onah.day' : 'onah.night';
}
