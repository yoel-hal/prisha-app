import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import type { City } from '../constants/cities';
import { log } from '../utils/log';
import { defaultCityForTimeZone, findCity, type ZmanimPlace } from '../utils/zmanim';

/**
 * Where sunset/sunrise are calculated. Saved on this device only (never sent to the
 * server): a city from the list, or the device location rounded to about 1 km.
 */
export type ZmanimLocationChoice =
  | { kind: 'city'; cityId: string }
  | { kind: 'device'; latitude: number; longitude: number; tzid: string };

const STORAGE_KEY = 'zmanim_location';

function deviceTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

/** Rounds to 2 decimals (about 1 km): enough for sunset to the minute, less precise to keep. */
export function roundCoordinate(value: number): number {
  return Math.round(value * 100) / 100;
}

type State = {
  /** null until the user chooses; then the default city for the time zone is used. */
  choice: ZmanimLocationChoice | null;
  loaded: boolean;
  load: () => Promise<void>;
  setChoice: (choice: ZmanimLocationChoice) => Promise<void>;
};

export const useZmanimLocationStore = create<State>((set) => ({
  choice: null,
  loaded: false,
  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      set({ choice: raw ? (JSON.parse(raw) as ZmanimLocationChoice) : null, loaded: true });
    } catch (error) {
      log('zmanim location load failed', error);
      set({ loaded: true });
    }
  },
  setChoice: async (choice) => {
    set({ choice });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(choice));
    } catch (error) {
      log('zmanim location save failed', error);
    }
  },
}));

export type ResolvedZmanimLocation = {
  place: ZmanimPlace;
  /** The city shown in settings, when the choice is (or defaults to) a city. */
  city: City | null;
  isDefault: boolean;
};

export function resolveZmanimLocation(choice: ZmanimLocationChoice | null): ResolvedZmanimLocation {
  if (choice?.kind === 'device') {
    return {
      place: { latitude: choice.latitude, longitude: choice.longitude, tzid: choice.tzid },
      city: null,
      isDefault: false,
    };
  }
  const chosen = choice?.kind === 'city' ? findCity(choice.cityId) : undefined;
  const city = chosen ?? defaultCityForTimeZone(deviceTimeZone());
  return { place: city, city, isDefault: !chosen };
}

/** The place for sunset/sunrise, outside React (notifications, calendar sync). */
export function currentZmanimPlace(): ZmanimPlace {
  return resolveZmanimLocation(useZmanimLocationStore.getState().choice).place;
}
