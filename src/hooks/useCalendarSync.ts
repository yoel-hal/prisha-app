import * as Calendar from 'expo-calendar';
import { useCallback } from 'react';
import { Platform } from 'react-native';

import type { VesetResult } from '../calculations/types';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';

const CALENDAR_NAME = 'Prisha Tracker';

async function resolveWritableCalendarId(): Promise<string> {
  if (Platform.OS === 'ios') {
    const defaultCalendar = await Calendar.getDefaultCalendarAsync();
    return defaultCalendar.id;
  }

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const existing = calendars.find(
    (calendar) => calendar.title === CALENDAR_NAME && calendar.allowsModifications,
  );
  if (existing) {
    return existing.id;
  }

  const defaultSource =
    Platform.OS === 'android'
      ? (await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT)).find(
          (calendar) => calendar.source?.name,
        )?.source
      : undefined;

  return Calendar.createCalendarAsync({
    title: CALENDAR_NAME,
    color: '#1a1a1a',
    entityType: Calendar.EntityTypes.EVENT,
    sourceId: defaultSource?.id,
    source: defaultSource,
    name: CALENDAR_NAME,
    ownerAccount: defaultSource?.name ?? 'personal',
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });
}

function allDayBounds(dateGregorian: string): {
  startDate: Date;
  endDate: Date;
} {
  const [year, month, day] = dateGregorian.split('-').map(Number);
  const startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
  const endDate = new Date(year, month - 1, day + 1, 0, 0, 0, 0);
  return { startDate, endDate };
}

export function useCalendarSync() {
  const coupleId = useAuthStore((state) => state.coupleId);
  const calendarSettings = useSettingsStore((state) => state.calendar);
  const setSyncedEventIds = useSettingsStore((state) => state.setSyncedEventIds);
  const saveSettings = useSettingsStore((state) => state.saveSettings);

  const persistEventIds = useCallback(
    async (syncedEventIds: Record<string, string>) => {
      setSyncedEventIds(syncedEventIds);
      if (coupleId) {
        await saveSettings(coupleId);
      }
    },
    [coupleId, saveSettings, setSyncedEventIds],
  );

  const requestCalendarPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return false;
    }

    const { status: existing } = await Calendar.getCalendarPermissionsAsync();
    if (existing === 'granted') {
      return true;
    }

    const { status } = await Calendar.requestCalendarPermissionsAsync();
    return status === 'granted';
  }, []);

  const addVesetToCalendar = useCallback(
    async (veset: VesetResult, title: string): Promise<string> => {
      const calendarId = await resolveWritableCalendarId();
      const { startDate, endDate } = allDayBounds(veset.dateGregorian);

      const eventId = await Calendar.createEventAsync(calendarId, {
        title,
        startDate,
        endDate,
        allDay: true,
        timeZone: undefined,
      });

      const nextIds = {
        ...calendarSettings.syncedEventIds,
        [veset.id]: eventId,
      };
      await persistEventIds(nextIds);
      return eventId;
    },
    [calendarSettings.syncedEventIds, persistEventIds],
  );

  const removeVesetFromCalendar = useCallback(
    async (eventId: string): Promise<void> => {
      try {
        await Calendar.deleteEventAsync(eventId);
      } catch {
        // Event may already have been removed on device.
      }

      const nextIds = Object.fromEntries(
        Object.entries(calendarSettings.syncedEventIds).filter(
          ([, id]) => id !== eventId,
        ),
      );
      await persistEventIds(nextIds);
    },
    [calendarSettings.syncedEventIds, persistEventIds],
  );

  const syncAllVesetsToCalendar = useCallback(
    async (vesetim: VesetResult[], title: string): Promise<void> => {
      for (const eventId of Object.values(calendarSettings.syncedEventIds)) {
        try {
          await Calendar.deleteEventAsync(eventId);
        } catch {
          // Event may already have been removed on device.
        }
      }

      const calendarId = await resolveWritableCalendarId();
      const nextIds: Record<string, string> = {};

      for (const veset of vesetim) {
        const { startDate, endDate } = allDayBounds(veset.dateGregorian);
        const eventId = await Calendar.createEventAsync(calendarId, {
          title,
          startDate,
          endDate,
          allDay: true,
          timeZone: undefined,
        });
        nextIds[veset.id] = eventId;
      }

      await persistEventIds(nextIds);
    },
    [calendarSettings.syncedEventIds, persistEventIds],
  );

  const removeAllSyncedEvents = useCallback(async (): Promise<void> => {
    const existingIds = Object.values(calendarSettings.syncedEventIds);
    await Promise.all(
      existingIds.map((eventId) => removeVesetFromCalendar(eventId)),
    );
    await persistEventIds({});
  }, [calendarSettings.syncedEventIds, persistEventIds, removeVesetFromCalendar]);

  return {
    requestCalendarPermission,
    addVesetToCalendar,
    removeVesetFromCalendar,
    syncAllVesetsToCalendar,
    removeAllSyncedEvents,
    eventTitle: calendarSettings.eventTitle,
    syncEnabled: calendarSettings.syncEnabled,
  };
}
