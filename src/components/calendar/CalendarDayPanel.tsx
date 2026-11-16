import * as Calendar from 'expo-calendar';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import type { VesetResult, VesetType } from '../../calculations/types';
import { useCalendarSync } from '../../hooks/useCalendarSync';
import { useNotifications } from '../../hooks/useNotifications';
import { useOnahDateFormat } from '../../hooks/useOnahDateFormat';
import { useSettingsStore } from '../../store/settingsStore';
import { currentZmanimPlace } from '../../store/zmanimLocationStore';
import type { CalendarDayEvent } from '../../utils/calendarMarkers';
import { downloadIcs, googleCalendarUrl } from '../../utils/ics';
import { runCalendarEventBounds, vesetRuns } from '../../utils/vesetSchedule';
import { textStartStyle } from '../../utils/rtl';

export interface CalendarDayPanelProps {
  events: CalendarDayEvent[];
  vesetim: VesetResult[];
}

function vesetTranslationKey(type: VesetType): string {
  return `veset.${type}`;
}

export function CalendarDayPanel({ events, vesetim }: CalendarDayPanelProps) {
  const { t } = useTranslation();
  const formatOnah = useOnahDateFormat();

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
              {formatOnah(event.dateHebrew, event.onah).hebrew}
            </Text>
            <Text style={[styles.row, textStartStyle()]}>
              {formatOnah(event.dateHebrew, event.onah).civil}
            </Text>
            {formatOnah(event.dateHebrew, event.onah).hours ? (
              <Text style={[styles.row, textStartStyle()]}>
                {formatOnah(event.dateHebrew, event.onah).hours}
              </Text>
            ) : null}
            <ReasonLine reasons={vesetim.find((v) => v.id === event.vesetId)?.reasons} />
          </View>

          {event.vesetId ? (
            <VesetActions vesetId={event.vesetId} vesetim={vesetim} />
          ) : null}
        </View>
      ))}
    </View>
  );
}

/** Why this onah is forbidden, when it is a chumra (or more than the main rule). */
function ReasonLine({ reasons }: { reasons?: VesetResult['reasons'] }) {
  const { t } = useTranslation();
  if (!reasons || (reasons.length === 1 && reasons[0] === 'main')) {
    return null;
  }
  return (
    <Text style={[styles.reasonLine, textStartStyle()]}>
      {reasons.map((reason) => t(`veset.reason.${reason}`)).join(' · ')}
    </Text>
  );
}

function VesetActions({
  vesetId,
  vesetim,
}: {
  vesetId: string;
  vesetim: VesetResult[];
}) {
  const veset = vesetim.find((item) => item.id === vesetId);
  if (!veset) {
    return null;
  }
  // A browser can't write to the device calendar or keep reminders, so the web offers a
  // calendar file and a Google Calendar link instead, and no reminder button.
  return Platform.OS === 'web' ? (
    <WebCalendarActions veset={veset} vesetim={vesetim} />
  ) : (
    <NativeVesetActions veset={veset} />
  );
}

function WebCalendarActions({ veset, vesetim }: { veset: VesetResult; vesetim: VesetResult[] }) {
  const { t } = useTranslation();
  const calendarTitle = useSettingsStore((state) => state.calendar.eventTitle);
  const formatOnah = useOnahDateFormat();

  // The whole run of consecutive onot (e.g. with Ohr Zarua) is one event.
  const run = vesetRuns(vesetim).find((r) => r.some((v) => v.id === veset.id)) ?? [veset];
  const { startDate, endDate } = runCalendarEventBounds(run, currentZmanimPlace());
  const event = {
    uid: run[0]!.id,
    title: calendarTitle,
    description: `${t(vesetTranslationKey(veset.type))}: ${run
      .map((v) => formatOnah(v.dateHebrew, v.onah).hebrew)
      .join(', ')}`,
    start: startDate,
    end: endDate,
  };

  return (
    <View style={styles.actions}>
      <Pressable
        style={styles.actionButton}
        onPress={() => downloadIcs(event, `${run[0]!.dateGregorian}.ics`)}
      >
        <Text style={styles.actionText}>{t('calendar.downloadIcs')}</Text>
      </Pressable>
      <Pressable
        style={styles.actionButton}
        onPress={() => void Linking.openURL(googleCalendarUrl(event))}
      >
        <Text style={styles.actionText}>{t('calendar.addToGoogle')}</Text>
      </Pressable>
    </View>
  );
}

/**
 * Phone: add to the device calendar or set a reminder. Tapping asks for permission
 * when needed; a refusal is shown only right after the tap, not every visit.
 */
function NativeVesetActions({ veset }: { veset: VesetResult }) {
  const { t } = useTranslation();
  const calendarTitle = useSettingsStore((state) => state.calendar.eventTitle);
  const leadHours = useSettingsStore((state) => state.notifications.leadHours);
  const { addVesetToCalendar } = useCalendarSync();
  const { scheduleVesetNotification, requestPermission } = useNotifications();
  const [calendarFeedback, setCalendarFeedback] = useState<Feedback | null>(null);
  const [reminderFeedback, setReminderFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState<'calendar' | 'reminder' | null>(null);

  async function handleAddToCalendar() {
    setCalendarFeedback(null);
    setBusy('calendar');
    try {
      const current = await Calendar.getCalendarPermissionsAsync();
      const granted =
        current.status === 'granted' ||
        (await Calendar.requestCalendarPermissionsAsync()).status === 'granted';
      if (!granted) {
        setCalendarFeedback({ text: t('calendar.permissionDenied'), error: true });
        return;
      }
      await addVesetToCalendar(veset, calendarTitle);
      setCalendarFeedback({ text: t('calendar.addSuccess'), error: false });
    } catch {
      setCalendarFeedback({ text: t('calendar.addError'), error: true });
    } finally {
      setBusy(null);
    }
  }

  async function handleSetReminder() {
    setReminderFeedback(null);
    setBusy('reminder');
    try {
      if (!(await requestPermission())) {
        setReminderFeedback({ text: t('notifications.permissionDenied'), error: true });
        return;
      }
      await scheduleVesetNotification(veset, leadHours);
      setReminderFeedback({ text: t('reminder.success'), error: false });
    } catch {
      setReminderFeedback({ text: t('reminder.error'), error: true });
    } finally {
      setBusy(null);
    }
  }

  return (
    <View style={styles.actions}>
      <Pressable
        style={[styles.actionButton, busy === 'calendar' && styles.actionDisabled]}
        onPress={() => void handleAddToCalendar()}
        disabled={busy !== null}
      >
        <Text style={styles.actionText}>{t('calendar.addToCalendar')}</Text>
      </Pressable>
      {calendarFeedback ? <FeedbackText feedback={calendarFeedback} /> : null}

      <Pressable
        style={[styles.actionButton, busy === 'reminder' && styles.actionDisabled]}
        onPress={() => void handleSetReminder()}
        disabled={busy !== null}
      >
        <Text style={styles.actionText}>{t('reminder.set')}</Text>
      </Pressable>
      {reminderFeedback ? <FeedbackText feedback={reminderFeedback} /> : null}
    </View>
  );
}

type Feedback = { text: string; error: boolean };

function FeedbackText({ feedback }: { feedback: Feedback }) {
  return (
    <Text
      style={[feedback.error ? styles.permissionHint : styles.feedback, textStartStyle()]}
    >
      {feedback.text}
    </Text>
  );
}

const styles = StyleSheet.create({
  reasonLine: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A8485F',
  },
  container: {
    gap: 12,
  },
  eventCard: {
    backgroundColor: '#FBF8F5',
    borderRadius: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#EAE3DD',
    gap: 12,
  },
  eventBlock: {
    gap: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  row: {
    fontSize: 16,
    color: '#5F5459',
  },
  actions: {
    gap: 10,
  },
  actionButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#DDD3CC',
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
    color: '#B3261E',
  },
  feedback: {
    fontSize: 13,
    color: '#2F7D55',
  },
});
