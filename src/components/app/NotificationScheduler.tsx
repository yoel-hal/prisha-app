import { useEffect } from 'react';

import { useNotifications } from '../../hooks/useNotifications';
import { useVesetCalculations } from '../../hooks/useVesetCalculations';
import { useSettingsStore } from '../../store/settingsStore';

/** Keeps scheduled local notifications aligned with current vestos and prefs. */
export function NotificationScheduler() {
  const { vesetim } = useVesetCalculations();
  const notifications = useSettingsStore((state) => state.notifications);
  const { scheduleAllVesetNotifications, cancelAllVesetNotifications } =
    useNotifications();

  useEffect(() => {
    if (!notifications.enabled) {
      void cancelAllVesetNotifications();
      return;
    }

    void scheduleAllVesetNotifications(vesetim, notifications.leadHours);
  }, [
    vesetim,
    notifications.enabled,
    notifications.leadHours,
    notifications.onahBeinonit,
    notifications.haflaga,
    notifications.yomHaChodesh,
    scheduleAllVesetNotifications,
    cancelAllVesetNotifications,
  ]);

  return null;
}
