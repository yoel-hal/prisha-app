/**
 * Calendar-sync bounds: a night onah starts at sunset of the previous civil day, so its
 * event must start that evening (not on the daytime's date, a day late).
 */
import { vesetCalendarEventBounds } from '../vesetSchedule';

describe('vesetCalendarEventBounds', () => {
  it('day onah: all-day on its civil date', () => {
    const { startDate, endDate, allDay } = vesetCalendarEventBounds({
      dateGregorian: '2026-12-14',
      onah: 'day',
    });
    expect(allDay).toBe(true);
    expect(startDate).toEqual(new Date(2026, 11, 14, 0, 0));
    expect(endDate).toEqual(new Date(2026, 11, 15, 0, 0));
  });

  it('night onah (ליל ד׳ טבת): 18:00 on the evening before until 07:00', () => {
    const { startDate, endDate, allDay } = vesetCalendarEventBounds({
      dateGregorian: '2026-12-14',
      onah: 'night',
    });
    expect(allDay).toBe(false);
    expect(startDate).toEqual(new Date(2026, 11, 13, 18, 0));
    expect(endDate).toEqual(new Date(2026, 11, 14, 7, 0));
  });

  it('night onah on the 1st of a month starts on the last day of the previous month', () => {
    const { startDate, endDate } = vesetCalendarEventBounds({
      dateGregorian: '2027-01-01',
      onah: 'night',
    });
    expect(startDate).toEqual(new Date(2026, 11, 31, 18, 0));
    expect(endDate).toEqual(new Date(2027, 0, 1, 7, 0));
  });
});
