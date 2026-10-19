/**
 * Calendar events and reminders use sunset and sunrise: a night onah starts at the
 * evening's sunset (the civil day before), and consecutive onot of one veset (e.g. with
 * Ohr Zarua) become one event.
 */
import { calcAllVesetim } from '../../calculations';
import { A, chumrot } from '../../calculations/__tests__/fixtures';
import { ISRAEL_CITIES } from '../../constants/cities';
import { runCalendarEventBounds, vesetCalendarEventBounds, vesetRuns } from '../vesetSchedule';

const JERUSALEM = ISRAEL_CITIES[0]!;
const hhmm = (d: Date) => `${d.getUTCHours()}:${String(d.getUTCMinutes()).padStart(2, '0')}`;

describe('calendar event bounds', () => {
  it('night onah (ליל ד׳ טבת): sunset on 13.12 to sunrise on 14.12', () => {
    const { startDate, endDate, allDay } = vesetCalendarEventBounds(
      { dateGregorian: '2026-12-14', onah: 'night' },
      JERUSALEM,
    );
    expect(allDay).toBe(false);
    expect(startDate.toISOString().slice(0, 10)).toBe('2026-12-13');
    expect(endDate.toISOString().slice(0, 10)).toBe('2026-12-14');
    expect(hhmm(startDate)).toMatch(/^14:(3|4)\d$/); // ~16:36 Israel time
    expect(hhmm(endDate)).toMatch(/^4:(2|3)\d$/); // ~06:30 Israel time
  });

  it('day onah: sunrise to sunset of the same date', () => {
    const { startDate, endDate } = vesetCalendarEventBounds(
      { dateGregorian: '2026-12-14', onah: 'day' },
      JERUSALEM,
    );
    expect(startDate.toISOString().slice(0, 10)).toBe('2026-12-14');
    expect(endDate.getTime()).toBeGreaterThan(startDate.getTime());
  });
});

describe('runs', () => {
  it('Ohr Zarua + Kreisi uPleisi at night → one run from יום ג׳ טבת to יום ד׳ טבת', () => {
    const results = calcAllVesetim([A], 'ashkenaz', chumrot({ ohrZarua: true, kreisiUpleisi: true }));
    const runs = vesetRuns(results.filter((r) => r.type === 'onahBeinonit'));
    expect(runs).toHaveLength(1);
    expect(runs[0]).toHaveLength(3);
    const { startDate, endDate } = runCalendarEventBounds(runs[0]!, JERUSALEM);
    expect(startDate.toISOString().slice(0, 10)).toBe('2026-12-13'); // sunrise, day of ג׳ טבת
    expect(endDate.toISOString().slice(0, 10)).toBe('2026-12-14'); // sunset, day of ד׳ טבת
  });

  it('different vesatot stay separate', () => {
    const results = calcAllVesetim([A], 'ashkenaz', chumrot());
    expect(vesetRuns(results)).toHaveLength(2); // onah beinonit, yom hachodesh
  });
});
