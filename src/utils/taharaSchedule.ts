import { formatGregorianLocal, hebrewDateToGregorian } from '../calculations/onah';
import { CLEAN_DAYS, checkKey, cleanDayDate } from '../calculations/tahara';
import type { TaharaState } from '../calculations/tahara';
import type { CheckTime, HebrewDate } from '../calculations/types';
import { onahBounds, type ZmanimPlace } from './zmanim';

export const TAHARA_NOTIFICATION_PREFIX = 'tahara-';
const HEFSEK_REMINDER_DAYS = 4;
const MORNING_HOUR = 8;
const BEFORE_SUNSET_MS = 60 * 60 * 1000;

export type TaharaReminder =
  | { id: string; at: Date; kind: 'hefsek'; sunset: Date }
  | { id: string; at: Date; kind: CheckTime; day: number; sunset: Date }
  | { id: string; at: Date; kind: 'mikveh' };

export function isTaharaNotificationId(identifier: string): boolean {
  return identifier.startsWith(TAHARA_NOTIFICATION_PREFIX);
}

function sunsetOn(date: HebrewDate, place: Pick<ZmanimPlace, 'latitude' | 'longitude'>): {
  civil: Date;
  sunset: Date;
} {
  const civil = hebrewDateToGregorian(date);
  const sunset = onahBounds({ dateGregorian: formatGregorianLocal(civil), onah: 'day' }, place).end;
  return { civil, sunset };
}

/**
 * The reminders still ahead for the current state:
 * - before the hefsek: an hour before sunset on the earliest day and the three days after it
 * - the clean days: each unmarked check, at 8:00 and an hour before sunset
 * - day 7: a mikveh-night reminder at noon
 */
export function taharaReminders(
  state: TaharaState,
  place: Pick<ZmanimPlace, 'latitude' | 'longitude'>,
  now: Date,
): TaharaReminder[] {
  const out: TaharaReminder[] = [];

  if (state.kind === 'waitHefsek' || state.kind === 'hefsekToday') {
    for (let i = 0; i < HEFSEK_REMINDER_DAYS; i++) {
      const date = cleanDayDate(state.earliest, i);
      const { civil, sunset } = sunsetOn(date, place);
      out.push({
        id: `${TAHARA_NOTIFICATION_PREFIX}hefsek-${formatGregorianLocal(civil)}`,
        at: new Date(sunset.getTime() - BEFORE_SUNSET_MS),
        kind: 'hefsek',
        sunset,
      });
    }
  }

  if (state.kind === 'counting' || (state.kind === 'mikvehNight' && state.isTonight)) {
    const { cycle } = state;
    for (let day = 1; day <= CLEAN_DAYS; day++) {
      const { civil, sunset } = sunsetOn(cleanDayDate(cycle.hefsekDateHebrew, day), place);
      const stamp = formatGregorianLocal(civil);
      if (!cycle.checks[checkKey(day, 'morning')]) {
        const at = new Date(civil);
        at.setHours(MORNING_HOUR, 0, 0, 0);
        out.push({ id: `${TAHARA_NOTIFICATION_PREFIX}morning-${stamp}`, at, kind: 'morning', day, sunset });
      }
      if (!cycle.checks[checkKey(day, 'evening')]) {
        out.push({
          id: `${TAHARA_NOTIFICATION_PREFIX}evening-${stamp}`,
          at: new Date(sunset.getTime() - BEFORE_SUNSET_MS),
          kind: 'evening',
          day,
          sunset,
        });
      }
      if (day === CLEAN_DAYS) {
        const at = new Date(civil);
        at.setHours(12, 0, 0, 0);
        out.push({ id: `${TAHARA_NOTIFICATION_PREFIX}mikveh-${stamp}`, at, kind: 'mikveh' });
      }
    }
  }

  return out.filter((reminder) => reminder.at.getTime() > now.getTime());
}
