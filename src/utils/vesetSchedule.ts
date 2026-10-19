import type { Onah, VesetResult } from '../calculations/types';

/**
 * Approximate local time for the start of the onah. `dateGregorian` is the civil date of
 * the daytime; a night onah starts at sunset of the evening before.
 */
export function vesetOnahDate(veset: VesetResult): Date {
  const [year, month, day] = veset.dateGregorian.split('-').map(Number);
  if (veset.onah === 'day') {
    return new Date(year, month - 1, day, 7, 0, 0, 0);
  }
  return new Date(year, month - 1, day - 1, 18, 0, 0, 0);
}

export type CalendarEventBounds = { startDate: Date; endDate: Date; allDay: boolean };

/**
 * Device-calendar event for a veset. A day onah is an all-day event on its civil date; a
 * night onah is a timed event from the evening it starts (18:00 the day before) to 07:00,
 * so it shows on the evening, not a day late.
 */
export function vesetCalendarEventBounds(
  veset: Pick<VesetResult, 'dateGregorian' | 'onah'>,
): CalendarEventBounds {
  const [year, month, day] = veset.dateGregorian.split('-').map(Number);
  if (veset.onah === 'day') {
    return {
      startDate: new Date(year, month - 1, day, 0, 0, 0, 0),
      endDate: new Date(year, month - 1, day + 1, 0, 0, 0, 0),
      allDay: true,
    };
  }
  return {
    startDate: new Date(year, month - 1, day - 1, 18, 0, 0, 0),
    endDate: new Date(year, month - 1, day, 7, 0, 0, 0),
    allDay: false,
  };
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
