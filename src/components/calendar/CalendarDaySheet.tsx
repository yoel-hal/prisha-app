import * as Notifications from 'expo-notifications';
import * as Calendar from 'expo-calendar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { VesetResult, VesetType } from '../../calculations/types';
import { useCalendarSync } from '../../hooks/useCalendarSync';
import { useNotifications } from '../../hooks/useNotifications';
import type { SupportedLanguage } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import type { CalendarDayEvent } from '../../utils/calendarMarkers';
import { formatHebrewDate } from '../../utils/hebrewDateFormat';
import { textStartStyle } from '../../utils/rtl';

const SHEET_HEIGHT = Dimensions.get('window').height * 0.45;

export interface CalendarDaySheetProps {
  visible: boolean;
  onClose: () => void;
  selectedEvent: CalendarDayEvent | null;
  events?: CalendarDayEvent[];
  vesetim: VesetResult[];
}

function vesetTranslationKey(type: VesetType): string {
  return `veset.${type}`;
}

export function CalendarDaySheet({
  visible,
  onClose,
  selectedEvent,
  events,
  vesetim,
}: CalendarDaySheetProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.language as SupportedLanguage;
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);

  const calendarTitle = useSettingsStore((state) => state.calendar.eventTitle);
  const leadHours = useSettingsStore((state) => state.notifications.leadHours);
  const { addVesetToCalendar } = useCalendarSync();
  const { scheduleVesetNotification, requestPermission } = useNotifications();

  const displayEvents = events ?? (selectedEvent ? [selectedEvent] : []);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      slideAnim.setValue(SHEET_HEIGHT);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 20,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (!modalVisible) {
      return;
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SHEET_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setModalVisible(false);
      }
    });
  }, [visible, modalVisible, slideAnim, fadeAnim]);

  function handleClose() {
    onClose();
  }

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdropPressable} onPress={handleClose}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </Pressable>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 16),
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.content}>
            {displayEvents.map((event, index) => (
              <View key={`${event.kind}-${event.vesetId ?? event.periodId ?? index}`}>
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
                  <VesetActions
                    vesetId={event.vesetId}
                    vesetim={vesetim}
                    calendarTitle={calendarTitle}
                    leadHours={leadHours}
                    addVesetToCalendar={addVesetToCalendar}
                    scheduleVesetNotification={scheduleVesetNotification}
                    requestPermission={requestPermission}
                  />
                ) : null}
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function VesetActions({
  vesetId,
  vesetim,
  calendarTitle,
  leadHours,
  addVesetToCalendar,
  scheduleVesetNotification,
  requestPermission,
}: {
  vesetId: string;
  vesetim: VesetResult[];
  calendarTitle: string;
  leadHours: number;
  addVesetToCalendar: (veset: VesetResult, title: string) => Promise<string>;
  scheduleVesetNotification: (
    veset: VesetResult,
    leadHours: number,
  ) => Promise<void>;
  requestPermission: () => Promise<boolean>;
}) {
  const { t } = useTranslation();
  const veset = vesetim.find((item) => item.id === vesetId);
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
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopStartRadius: 16,
    borderTopEndRadius: 16,
    minHeight: SHEET_HEIGHT,
    maxHeight: '70%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ddd',
    marginTop: 10,
    marginBottom: 8,
  },
  content: {
    paddingHorizontal: 20,
    gap: 16,
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
    marginTop: 8,
    marginBottom: 8,
  },
  actionButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionDisabled: {
    opacity: 0.45,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  permissionHint: {
    fontSize: 13,
    color: '#c62828',
    marginTop: -4,
  },
  feedback: {
    fontSize: 13,
    color: '#2e7d32',
    marginTop: -4,
  },
});
