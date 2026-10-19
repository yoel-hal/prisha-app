import { ABROAD_CITIES, ISRAEL_CITIES, type City } from '../constants/cities';
import type { Onah } from '../calculations/types';

/** Where sunset and sunrise are calculated. */
export type ZmanimPlace = {
  latitude: number;
  longitude: number;
  tzid: string;
};

export type OnahBounds = { start: Date; end: Date };

/** All selectable cities, Israel first. */
export function allCities(): City[] {
  return [...ISRAEL_CITIES, ...ABROAD_CITIES];
}

export function findCity(id: string): City | undefined {
  return allCities().find((city) => city.id === id);
}

const JERUSALEM = ISRAEL_CITIES[0]!;

/** A sensible city for the device's time zone, used until the user picks one. */
export function defaultCityForTimeZone(tzid: string | undefined): City {
  if (!tzid || tzid === 'Asia/Jerusalem') {
    return JERUSALEM;
  }
  const alias = tzid === 'Europe/Kiev' ? 'Europe/Kyiv' : tzid;
  return ABROAD_CITIES.find((city) => city.tzid === alias) ?? JERUSALEM;
}

const rad = (deg: number) => (deg * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/**
 * Sunrise or sunset on a civil date (sea level, 0.833° below the horizon), by the
 * NOAA solar calculation. Returns null when the sun doesn't rise or set that day.
 * (Hebcal's zmanim need top-level await, which the native app can't load.)
 */
export function sunEvent(
  year: number,
  month: number,
  day: number,
  place: Pick<ZmanimPlace, 'latitude' | 'longitude'>,
  kind: 'sunrise' | 'sunset',
): Date | null {
  const midnightUtc = Date.UTC(year, month - 1, day);
  // Start from local solar noon, then refine at the event time.
  let minutes = 720 - 4 * place.longitude;
  for (let i = 0; i < 3; i++) {
    const jd = midnightUtc / 86400000 + 2440587.5 + minutes / 1440;
    const t = (jd - 2451545) / 36525;
    const l0 = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360;
    const m = 357.52911 + t * (35999.05029 - 0.0001537 * t);
    const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
    const c =
      Math.sin(rad(m)) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
      Math.sin(rad(2 * m)) * (0.019993 - 0.000101 * t) +
      Math.sin(rad(3 * m)) * 0.000289;
    const omega = 125.04 - 1934.136 * t;
    const lambda = l0 + c - 0.00569 - 0.00478 * Math.sin(rad(omega));
    const e0 = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
    const obliquity = e0 + 0.00256 * Math.cos(rad(omega));
    const declination = Math.asin(Math.sin(rad(obliquity)) * Math.sin(rad(lambda)));
    const y = Math.tan(rad(obliquity / 2)) ** 2;
    const eqTime =
      4 *
      deg(
        y * Math.sin(2 * rad(l0)) -
          2 * e * Math.sin(rad(m)) +
          4 * e * y * Math.sin(rad(m)) * Math.cos(2 * rad(l0)) -
          0.5 * y * y * Math.sin(4 * rad(l0)) -
          1.25 * e * e * Math.sin(2 * rad(m)),
      );
    const cosHourAngle =
      Math.cos(rad(90.833)) / (Math.cos(rad(place.latitude)) * Math.cos(declination)) -
      Math.tan(rad(place.latitude)) * Math.tan(declination);
    if (cosHourAngle < -1 || cosHourAngle > 1) {
      return null;
    }
    const hourAngle = deg(Math.acos(cosHourAngle));
    const noon = 720 - 4 * place.longitude - eqTime;
    minutes = kind === 'sunrise' ? noon - 4 * hourAngle : noon + 4 * hourAngle;
  }
  return new Date(midnightUtc + minutes * 60000);
}

/**
 * When an onah begins and ends at `place`. `dateGregorian` is the civil date of the
 * daytime of the Hebrew date: a day onah runs from sunrise (netz) to sunset (shkiah)
 * that day; a night onah from the sunset of the evening before to that sunrise.
 * Falls back to 18:00 / 07:00 local time when the sun doesn't rise or set.
 */
export function onahBounds(
  veset: { dateGregorian: string; onah: Onah },
  place: Pick<ZmanimPlace, 'latitude' | 'longitude'>,
): OnahBounds {
  const [year, month, day] = veset.dateGregorian.split('-').map(Number);
  const evening = new Date(year, month - 1, day - 1);
  const sunrise =
    sunEvent(year, month, day, place, 'sunrise') ?? new Date(year, month - 1, day, 7);
  if (veset.onah === 'day') {
    return {
      start: sunrise,
      end: sunEvent(year, month, day, place, 'sunset') ?? new Date(year, month - 1, day, 18),
    };
  }
  return {
    start:
      sunEvent(evening.getFullYear(), evening.getMonth() + 1, evening.getDate(), place, 'sunset') ??
      new Date(year, month - 1, day - 1, 18),
    end: sunrise,
  };
}

/** "16:37" in the device's local time. */
export function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
