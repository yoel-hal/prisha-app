import { create } from 'zustand';

import type {
  CalendarSettings,
  Chumrot,
  Minhag,
  NotificationSettings,
} from '../calculations/types';
import { getSettings, saveSettings as saveSettingsToFirestore } from '../firebase/firestore';
import { log, logError } from '../utils/log';

const DEFAULT_CHUMROT: Chumrot = {
  kavuah: false,
  veshetEinah: false,
  onahBeinonitIfHaflaga: false,
  bothOnotOnBeinonit: false,
  bothOnotOnYomHaChodesh: false,
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  leadHours: 24,
  onahBeinonit: true,
  haflaga: true,
  yomHaChodesh: true,
};

export const DEFAULT_CALENDAR_SETTINGS: CalendarSettings = {
  syncEnabled: false,
  eventTitle: 'פרישה',
  syncedEventIds: {},
};

interface SettingsState {
  minhag: Minhag;
  chumrot: Chumrot;
  notifications: NotificationSettings;
  calendar: CalendarSettings;
  setMinhag: (minhag: Minhag) => void;
  setChumrot: (chumrot: Chumrot) => void;
  setNotifications: (notifications: NotificationSettings) => void;
  setCalendar: (calendar: CalendarSettings) => void;
  setSyncedEventIds: (syncedEventIds: Record<string, string>) => void;
  loadSettings: (coupleId: string) => Promise<void>;
  saveSettings: (coupleId: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  minhag: 'ashkenaz',
  chumrot: DEFAULT_CHUMROT,
  notifications: DEFAULT_NOTIFICATION_SETTINGS,
  calendar: DEFAULT_CALENDAR_SETTINGS,
  setMinhag: (minhag) => set({ minhag }),
  setChumrot: (chumrot) => set({ chumrot }),
  setNotifications: (notifications) => set({ notifications }),
  setCalendar: (calendar) => set({ calendar }),
  setSyncedEventIds: (syncedEventIds) =>
    set((state) => ({
      calendar: { ...state.calendar, syncedEventIds },
    })),
  loadSettings: async (coupleId) => {
    try {
      const settings = await getSettings(coupleId);
      if (settings) {
        set({
          minhag: settings.minhag,
          chumrot: settings.chumrot,
          notifications: settings.notifications,
          calendar: settings.calendar,
        });
      }
    } catch (error) {
      logError('loadSettings failed', error);
    }
  },
  saveSettings: async (coupleId) => {
    try {
      const { minhag, chumrot, notifications, calendar } = get();
      await saveSettingsToFirestore(coupleId, {
        minhag,
        chumrot,
        notifications,
        calendar,
      });
    } catch (error) {
      throw error;
    }
  },
}));
