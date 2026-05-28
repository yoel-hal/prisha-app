import type { MarkedDates } from 'react-native-calendars/src/types';

import type { Period, VesetResult, VesetType } from '../calculations/types';

export type CalendarMarkerKind =
  | 'period'
  | 'onahBeinonit'
  | 'haflaga'
  | 'yomHaChodesh';

export const MARKER_COLORS: Record<CalendarMarkerKind, string> = {
  period: '#E53935',
  onahBeinonit: '#1E88E5',
  haflaga: '#8E24AA',
  yomHaChodesh: '#43A047',
};

export type CalendarDayEvent = {
  kind: CalendarMarkerKind;
  dateGregorian: string;
  dateHebrew: Period['dateHebrew'];
  onah: Period['onah'];
  vesetType?: VesetType;
  vesetId?: string;
  periodId?: string;
};

function vesetTypeToKind(type: VesetType): CalendarMarkerKind {
  return type;
}

export function buildMarkedDates(
  periods: Period[],
  vesetim: VesetResult[],
): MarkedDates {
  const byDate = new Map<string, Set<CalendarMarkerKind>>();

  const addMarker = (date: string, kind: CalendarMarkerKind) => {
    const existing = byDate.get(date) ?? new Set<CalendarMarkerKind>();
    existing.add(kind);
    byDate.set(date, existing);
  };

  for (const period of periods) {
    addMarker(period.dateGregorian, 'period');
  }

  for (const veset of vesetim) {
    addMarker(veset.dateGregorian, vesetTypeToKind(veset.type));
  }

  const marked: MarkedDates = {};

  for (const [date, kinds] of byDate) {
    marked[date] = {
      dots: [...kinds].map((kind) => ({
        key: kind,
        color: MARKER_COLORS[kind],
      })),
    };
  }

  return marked;
}

export function getEventsForDate(
  date: string,
  periods: Period[],
  vesetim: VesetResult[],
): CalendarDayEvent[] {
  const events: CalendarDayEvent[] = [];

  for (const period of periods) {
    if (period.dateGregorian === date) {
      events.push({
        kind: 'period',
        dateGregorian: period.dateGregorian,
        dateHebrew: period.dateHebrew,
        onah: period.onah,
        periodId: period.id,
      });
    }
  }

  for (const veset of vesetim) {
    if (veset.dateGregorian === date) {
      events.push({
        kind: vesetTypeToKind(veset.type),
        dateGregorian: veset.dateGregorian,
        dateHebrew: veset.dateHebrew,
        onah: veset.onah,
        vesetType: veset.type,
        vesetId: veset.id,
      });
    }
  }

  return events;
}
