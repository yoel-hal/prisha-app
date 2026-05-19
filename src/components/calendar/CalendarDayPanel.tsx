import * as Notifications from 'expo-notifications';
import * as Calendar from 'expo-calendar';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import type { VesetResult, VesetType } from '../../calculations/types';
import { useCalendarSync } from '../../hooks/useCalendarSync';
import { useNotifications } from '../../hooks/useNotifications';
import type { SupportedLanguage } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import type { CalendarDayEvent } from '../../utils/calendarMarkers';
import { formatHebrewDate } from '../../utils/hebrewDateFormat';
import { textStartStyle } from '../../utils/rtl';

export interface CalendarDayPanelProps {
  events: CalendarDayEvent[];
  vesetim: VesetResult[];
}

function vesetTranslationKey(type: VesetType): string {
  return `veset.${type}`;
}

export function CalendarDayPanel({ events, vesetim }: CalendarDayPanelProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.language as SupportedLanguage;

  if (events.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {events.map((event, index) => (
        <View
          key={`${event.kind}-${event.vesetId ?? event.periodId ?? index}`}
          style={styles.eventCard}
        >
          <View style={styles.eventBlock}>
            <Text style={[styles.title, textStartStyle()]}>
              {event.vesetType
                ? t(vesetTranslationKey(event.vesetType))
                : t('period.saved')}
            </Text>
            <Text style={[styles.row, textStartStyle()]}>
              {formatHebrewDate(event.dateHebrew, language)}
            </Text>
            <Text style={[styles.row, textStartStyle()]}>
              {t(event.onah === 'day' ? 'period.day' : 'period.night')}
            </Text>
          </View>

          {event.vesetId ? (
            <VesetActions vesetId={event.vesetId} vesetim={vesetim} />
          ) : null}
        </View>
      ))}
    </View>
  );
}

function VesetActions({
  vesetId,
  vesetim,
}: {
  vesetId: string;
  vesetim: VesetResult[];
}) {
  const { t } = useTranslation();
  const veset = vesetim.find((item) => item.id === vesetId);
  const calendarTitle = useSettingsStore((state) => state.calendar.eventTitle);
  const leadHours = useSettingsStore((state) => state.notifications.leadHours);
  const { addVesetToCalendar } = useCalendarSync();
  const { scheduleVesetNotification, requestPermission } = useNotifications();
  const [calendarGranted, setCalendarGranted] = useState<boolean | null>(null);
  const [notificationsGranted, setNotificationsGranted] = useState<
    boolean | null
  >(null);
  const [calendarFeedback, setCalendarFeedback] = useState<string | null>(null);
  const [reminderFeedback, setReminderFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState<'calendar' | 'reminder' | null>(null);

  const refreshPermissions = useCallback(async () => {
    if (Platform.OS === 'web') {
      setCalendarGranted(false);
      setNotificationsGranted(false);
      return;
    }

    const calendarStatus = await Calendar.getCalendarPermissionsAsync();
    setCalendarGranted(calendarStatus.status === 'granted');

    const notificationStatus = await Notifications.getPermissionsAsync();
    setNotificationsGranted(notificationStatus.status === 'granted');
  }, []);

  useEffect(() => {
    if (veset) {
      void refreshPermissions();
    }
  }, [veset, refreshPermissions]);

  if (!veset) {
    return null;
  }

  const vesetResult = veset;

  async function handleAddToCalendar() {
    setCalendarFeedback(null);
    setBusy('calendar');

    let granted = calendarGranted;
    if (!granted) {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      granted = status === 'granted';
      setCalendarGranted(granted);
    }

    if (!granted) {
      setCalendarFeedback(t('calendar.permissionDenied'));
      setBusy(null);
      return;
    }

    try {
      await addVesetToCalendar(vesetResult, calendarTitle);
      setCalendarFeedback(t('calendar.addSuccess'));
    } catch {
      setCalendarFeedback(t('calendar.addError'));
    }

    setBusy(null);
  }

  async function handleSetReminder() {
    setReminderFeedback(null);
    setBusy('reminder');

    let granted = notificationsGranted;
    if (!granted) {
      granted = await requestPermission();
      setNotificationsGranted(granted);
    }

    if (!granted) {
      setReminderFeedback(t('notifications.permissionDenied'));
      setBusy(null);
      return;
    }

    try {
      await scheduleVesetNotification(vesetResult, leadHours);
      setReminderFeedback(t('reminder.success'));
    } catch {
      setReminderFeedback(t('reminder.error'));
    }

    setBusy(null);
  }

  return (
    <View style={styles.actions}>
      <Pressable
        style={[
          styles.actionButton,
          (calendarGranted !== true || busy === 'calendar') && styles.actionDisabled,
        ]}
        onPress={() => void handleAddToCalendar()}
        disabled={calendarGranted !== true || busy === 'calendar'}
      >
        <Text style={styles.actionText}>{t('calendar.addToCalendar')}</Text>
      </Pressable>
      {calendarGranted === false ? (
        <Text style={[styles.permissionHint, textStartStyle()]}>
          {t('calendar.permissionDenied')}
        </Text>
      ) : null}
      {calendarFeedback ? (
        <Text style={[styles.feedback, textStartStyle()]}>{calendarFeedback}</Text>
      ) : null}

      <Pressable
        style={[
          styles.actionButton,
          (notificationsGranted !== true || busy === 'reminder') &&
            styles.actionDisabled,
        ]}
        onPress={() => void handleSetReminder()}
        disabled={notificationsGranted !== true || busy === 'reminder'}
      >
        <Text style={styles.actionText}>{t('reminder.set')}</Text>
      </Pressable>
      {notificationsGranted === false ? (
        <Text style={[styles.permissionHint, textStartStyle()]}>
          {t('notifications.permissionDenied')}
        </Text>
      ) : null}
      {reminderFeedback ? (
        <Text style={[styles.feedback, textStartStyle()]}>{reminderFeedback}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5e5',
    gap: 12,
  },
  eventBlock: {
    gap: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  row: {
    fontSize: 16,
    color: '#444',
  },
  actions: {
    gap: 10,
  },
  actionButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionDisabled: {
    opacity: 0.45,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '500',
  },
  permissionHint: {
    fontSize: 13,
    color: '#c62828',
  },
  feedback: {
    fontSize: 13,
    color: '#2e7d32',
  },
});
