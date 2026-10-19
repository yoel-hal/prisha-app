import { onahKey } from '../calculations/hebrewCalendar';
import type { Onah, VesetResult } from '../calculations/types';
import { onahBounds, type ZmanimPlace } from './zmanim';

type Place = Pick<ZmanimPlace, 'latitude' | 'longitude'>;

/** When the onah starts: sunrise for a day onah, the evening's sunset for a night onah. */
export function vesetOnahDate(veset: Pick<VesetResult, 'dateGregorian' | 'onah'>, place: Place): Date {
  return onahBounds(veset, place).start;
}

/**
 * Splits vesatot into runs of consecutive onot of the same veset (type and source),
 * e.g. Ohr Zarua's day + the night + Kreisi uPleisi's day. A run is one calendar
 * event and one reminder.
 */
export function vesetRuns(vesetim: VesetResult[]): VesetResult[][] {
  const sorted = [...vesetim].sort(
    (a, b) =>
      a.type.localeCompare(b.type) ||
      a.sourcePeriodId.localeCompare(b.sourcePeriodId) ||
      onahKey(a.dateHebrew, a.onah) - onahKey(b.dateHebrew, b.onah),
  );
  const runs: VesetResult[][] = [];
  for (const veset of sorted) {
    const run = runs[runs.length - 1];
    const last = run?.[run.length - 1];
    if (
      run &&
      last &&
      last.type === veset.type &&
      last.sourcePeriodId === veset.sourcePeriodId &&
      onahKey(veset.dateHebrew, veset.onah) - onahKey(last.dateHebrew, last.onah) === 1
    ) {
      run.push(veset);
    } else {
      runs.push([veset]);
    }
  }
  return runs;
}

export type CalendarEventBounds = { startDate: Date; endDate: Date; allDay: boolean };

/** One timed device-calendar event from the start of the first onah to the end of the last. */
export function runCalendarEventBounds(run: VesetResult[], place: Place): CalendarEventBounds {
  return {
    startDate: onahBounds(run[0]!, place).start,
    endDate: onahBounds(run[run.length - 1]!, place).end,
    allDay: false,
  };
}

/** Device-calendar event for a single onah: sunrise–sunset, or the evening's sunset–sunrise. */
export function vesetCalendarEventBounds(
  veset: Pick<VesetResult, 'dateGregorian' | 'onah'>,
  place: Place,
): CalendarEventBounds {
  const { start, end } = onahBounds(veset, place);
  return { startDate: start, endDate: end, allDay: false };
}

/** When to fire a lead-time reminder; null if that moment is already past. */
export function notificationTriggerDate(
  veset: VesetResult,
  leadHours: number,
  place: Place,
): Date | null {
  const vesetTime = vesetOnahDate(veset, place);
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
