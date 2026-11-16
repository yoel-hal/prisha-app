import { buildIcs, googleCalendarUrl } from '../ics';

const event = {
  uid: 'veset-onahBeinonit-a-2026-12-14-night',
  title: 'פרישה',
  description: 'עונה בינונית, ליל ד׳ טבת',
  start: new Date(Date.UTC(2026, 11, 13, 14, 36)),
  end: new Date(Date.UTC(2026, 11, 14, 4, 30)),
};

describe('calendar file and link', () => {
  it('ics has the event in UTC and escapes commas', () => {
    const ics = buildIcs(event, new Date(Date.UTC(2026, 9, 19)));
    expect(ics).toContain('DTSTART:20261213T143600Z');
    expect(ics).toContain('DTEND:20261214T043000Z');
    expect(ics).toContain('SUMMARY:פרישה');
    expect(ics).toContain('DESCRIPTION:עונה בינונית\\, ליל ד׳ טבת');
    expect(ics.split('\r\n')[0]).toBe('BEGIN:VCALENDAR');
  });

  it('Google link carries the same times', () => {
    const url = new URL(googleCalendarUrl(event));
    expect(url.hostname).toBe('calendar.google.com');
    expect(url.searchParams.get('dates')).toBe('20261213T143600Z/20261214T043000Z');
    expect(url.searchParams.get('text')).toBe('פרישה');
  });
});
