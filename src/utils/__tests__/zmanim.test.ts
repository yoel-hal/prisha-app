/**
 * Onah times from sunset and sunrise. The night of ד׳ טבת תשפ״ז starts at sunset on
 * 13.12.2026 and ends at sunrise on 14.12.2026; in Jerusalem sunset is about 16:37
 * and sunrise about 06:25 local time (UTC+2).
 */
import { ISRAEL_CITIES } from '../../constants/cities';
import { allCities, defaultCityForTimeZone, onahBounds } from '../zmanim';

const JERUSALEM = ISRAEL_CITIES[0]!;
const minutesUtc = (d: Date) => d.getUTCHours() * 60 + d.getUTCMinutes();

describe('onah bounds', () => {
  it('night: from the previous evening sunset to sunrise', () => {
    const { start, end } = onahBounds({ dateGregorian: '2026-12-14', onah: 'night' }, JERUSALEM);
    expect(start.toISOString().slice(0, 10)).toBe('2026-12-13');
    expect(end.toISOString().slice(0, 10)).toBe('2026-12-14');
    expect(minutesUtc(start)).toBeGreaterThan(14 * 60 + 25); // ~14:37 UTC
    expect(minutesUtc(start)).toBeLessThan(14 * 60 + 50);
    expect(minutesUtc(end)).toBeGreaterThan(4 * 60 + 10); // ~04:25 UTC
    expect(minutesUtc(end)).toBeLessThan(4 * 60 + 40);
  });

  it('day: from sunrise to sunset of the same date', () => {
    const { start, end } = onahBounds({ dateGregorian: '2026-12-14', onah: 'day' }, JERUSALEM);
    expect(start.toISOString().slice(0, 10)).toBe('2026-12-14');
    expect(end.toISOString().slice(0, 10)).toBe('2026-12-14');
    expect(end.getTime() - start.getTime()).toBeGreaterThan(9.5 * 3600e3);
    expect(end.getTime() - start.getTime()).toBeLessThan(10.8 * 3600e3);
  });

  it('a night ends where the following day begins', () => {
    const night = onahBounds({ dateGregorian: '2026-12-14', onah: 'night' }, JERUSALEM);
    const day = onahBounds({ dateGregorian: '2026-12-14', onah: 'day' }, JERUSALEM);
    expect(night.end.getTime()).toBe(day.start.getTime());
  });
});

describe('sunrise and sunset', () => {
  // Reference: NOAA / timeanddate for Jerusalem; the formula is good to about a minute.
  it('Jerusalem, 21 June 2026: sunrise ~05:33, sunset ~19:47 (UTC+3)', () => {
    const { start, end } = onahBounds({ dateGregorian: '2026-06-21', onah: 'day' }, JERUSALEM);
    expect(Math.abs(minutesUtc(start) - (2 * 60 + 33))).toBeLessThanOrEqual(3);
    expect(Math.abs(minutesUtc(end) - (16 * 60 + 47))).toBeLessThanOrEqual(3);
  });

  it('far west and far east keep the right civil day', () => {
    const la = onahBounds({ dateGregorian: '2026-12-14', onah: 'day' }, { latitude: 34.05, longitude: -118.24 });
    const sydney = onahBounds({ dateGregorian: '2026-12-14', onah: 'day' }, { latitude: -33.87, longitude: 151.21 });
    // LA sunset ~16:46 local = 00:46 UTC next day; Sydney sunrise ~05:39 local = 18:39 UTC the day before.
    expect(la.end.toISOString().slice(0, 10)).toBe('2026-12-15');
    expect(sydney.start.toISOString().slice(0, 10)).toBe('2026-12-13');
    expect(la.end > la.start && sydney.end > sydney.start).toBe(true);
  });

  it('no sunset in polar summer → fallback times', () => {
    const tromso = onahBounds({ dateGregorian: '2026-06-21', onah: 'day' }, { latitude: 69.65, longitude: 18.96 });
    expect(tromso.start.getHours()).toBe(7);
    expect(tromso.end.getHours()).toBe(18);
  });
});

describe('cities', () => {
  it('cities abroad are listed', () => {
    const ids = allCities().map((c) => c.id);
    expect(ids).toContain('new-york');
    expect(ids).toContain('london');
  });

  it('default city follows the device time zone', () => {
    expect(defaultCityForTimeZone('Asia/Jerusalem').id).toBe('jerusalem');
    expect(defaultCityForTimeZone('Europe/London').id).toBe('london');
    expect(defaultCityForTimeZone('Pacific/Nowhere').id).toBe('jerusalem');
    expect(defaultCityForTimeZone(undefined).id).toBe('jerusalem');
  });
});
