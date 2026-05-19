import * as Notifications from 'expo-notifications';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import type { NotificationSettings, VesetResult, VesetType } from '../calculations/types';
import type { SupportedLanguage } from '../i18n';
import { useSettingsStore } from '../store/settingsStore';
import { formatHebrewDate } from '../utils/hebrewDateFormat';
import {
  isVesetNotificationId,
  notificationTriggerDate,
  onahLabelKey,
} from '../utils/vesetSchedule';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function isTypeEnabled(
  type: VesetType,
  prefs: NotificationSettings,
): boolean {
  if (type === 'onahBeinonit') {
    return prefs.onahBeinonit;
  }
  if (type === 'haflaga') {
    return prefs.haflaga;
  }
  return prefs.yomHaChodesh;
}

function filterVesetim(
  vesetim: VesetResult[],
  prefs: NotificationSettings,
): VesetResult[] {
  return vesetim.filter((veset) => isTypeEnabled(veset.type, prefs));
}

export function useNotifications() {
  const { t, i18n } = useTranslation();
  const language = i18n.language as SupportedLanguage;
  const notifications = useSettingsStore((state) => state.notifications);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return false;
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') {
      return true;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }, []);

  const scheduleVesetNotification = useCallback(
    async (veset: VesetResult, leadHours: number): Promise<void> => {
      if (Platform.OS === 'web') {
        return;
      }

      const triggerDate = notificationTriggerDate(veset, leadHours);
      if (!triggerDate) {
        return;
      }

      const title = t(`veset.${veset.type}`);
      const hebrewDate = formatHebrewDate(veset.dateHebrew, language);
      const onah = t(onahLabelKey(veset.onah));
      const body = `${hebrewDate} · ${onah}`;

      await Notifications.scheduleNotificationAsync({
        identifier: veset.id,
        content: { title, body },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });
    },
    [language, t],
  );

  const cancelVesetNotification = useCallback(
    async (vesetId: string): Promise<void> => {
      if (Platform.OS === 'web') {
        return;
      }
      await Notifications.cancelScheduledNotificationAsync(vesetId);
    },
    [],
  );

  const cancelAllVesetNotifications = useCallback(async (): Promise<void> => {
    if (Platform.OS === 'web') {
      return;
    }

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((item) => isVesetNotificationId(item.identifier))
        .map((item) =>
          Notifications.cancelScheduledNotificationAsync(item.identifier),
        ),
    );
  }, []);

  const scheduleAllVesetNotifications = useCallback(
    async (
      vesetim: VesetResult[],
      leadHours: number,
      prefs: NotificationSettings = notifications,
    ): Promise<void> => {
      await cancelAllVesetNotifications();
      const eligible = filterVesetim(vesetim, prefs);
      await Promise.all(
        eligible.map((veset) => scheduleVesetNotification(veset, leadHours)),
      );
    },
    [
      cancelAllVesetNotifications,
      notifications,
      scheduleVesetNotification,
    ],
  );

  return {
    requestPermission,
    scheduleVesetNotification,
    cancelVesetNotification,
    scheduleAllVesetNotifications,
    cancelAllVesetNotifications,
    notificationsEnabled: notifications.enabled,
    leadHours: notifications.leadHours,
  };
}
