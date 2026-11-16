import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import { useTahara } from '../../hooks/useTahara';
import { resolveZmanimLocation, useZmanimLocationStore } from '../../store/zmanimLocationStore';
import { isTaharaNotificationId, taharaReminders, type TaharaReminder } from '../../utils/taharaSchedule';
import { logError } from '../../utils/log';
import { formatTime } from '../../utils/zmanim';

async function cancelTaharaNotifications(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((item) => isTaharaNotificationId(item.identifier))
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
  );
}

/** Optional reminders for the hefsek tahara and the clean-day checks (phone only). */
export function TaharaNotificationScheduler() {
  const { t } = useTranslation();
  const { state, settings, visible } = useTahara();
  const choice = useZmanimLocationStore((s) => s.choice);
  const enabled = Platform.OS !== 'web' && visible && settings.remindersEnabled;

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }
    const content = (reminder: TaharaReminder) => {
      if (reminder.kind === 'hefsek') {
        return {
          title: t('taharaNotifications.hefsekTitle'),
          body: t('taharaNotifications.hefsekBody', { time: formatTime(reminder.sunset) }),
        };
      }
      if (reminder.kind === 'mikveh') {
        return { title: t('taharaNotifications.mikvehTitle'), body: t('taharaNotifications.mikvehBody') };
      }
      return reminder.kind === 'morning'
        ? {
            title: t('taharaNotifications.morningTitle'),
            body: t('taharaNotifications.morningBody', { day: reminder.day }),
          }
        : {
            title: t('taharaNotifications.eveningTitle'),
            body: t('taharaNotifications.eveningBody', {
              day: reminder.day,
              time: formatTime(reminder.sunset),
            }),
          };
    };

    void (async () => {
      try {
        await cancelTaharaNotifications();
        if (!enabled) {
          return;
        }
        const place = resolveZmanimLocation(choice).place;
        await Promise.all(
          taharaReminders(state, place, new Date()).map((reminder) =>
            Notifications.scheduleNotificationAsync({
              identifier: reminder.id,
              content: content(reminder),
              trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminder.at },
            }),
          ),
        );
      } catch (error) {
        logError('tahara reminders failed', error);
      }
    })();
  }, [enabled, state, choice, t]);

  return null;
}
