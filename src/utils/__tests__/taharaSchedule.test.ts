import { months } from '@hebcal/hdate';

import { taharaState } from '../../calculations/tahara';
import type { Period, TaharaCycle } from '../../calculations/types';
import { taharaReminders } from '../taharaSchedule';

const JERUSALEM = { latitude: 31.778, longitude: 35.235 };
const K = (day: number) => ({ year: 5787, month: months.KISLEV, day });
const period: Period = {
  id: 'a',
  dateGregorian: '2026-11-15',
  dateHebrew: K(5),
  onah: 'night',
  createdAt: '2026-11-14T20:00:00.000Z',
  createdBy: 'u',
};

describe('tahara reminders', () => {
  it('before the hefsek: four evenings from the earliest day, an hour before sunset', () => {
    const state = taharaState([period], [], K(6), 5);
    const reminders = taharaReminders(state, JERUSALEM, new Date(2026, 10, 16, 9));
    expect(reminders.map((r) => r.id)).toEqual([
      'tahara-hefsek-2026-11-19',
      'tahara-hefsek-2026-11-20',
      'tahara-hefsek-2026-11-21',
      'tahara-hefsek-2026-11-22',
    ]);
    const first = reminders[0]!;
    expect(first.at.getHours()).toBe(15);
  });

  it('clean days: unmarked checks only, future only, plus mikveh night on day 7', () => {
    const cycle: TaharaCycle = {
      id: 'c',
      periodId: 'a',
      hefsekDateGregorian: '2026-11-19',
      hefsekDateHebrew: K(9),
      checks: { '1-morning': 'clean', '1-evening': 'clean', '2-morning': 'clean' },
      status: 'active',
      createdAt: '',
      createdBy: 'u',
    };
    const state = taharaState([period], [cycle], K(11), 5);
    const ids = taharaReminders(state, JERUSALEM, new Date(2026, 10, 21, 10)).map((r) => r.id);
    expect(ids[0]).toBe('tahara-evening-2026-11-21');
    expect(ids).toContain('tahara-morning-2026-11-26');
    expect(ids).toContain('tahara-mikveh-2026-11-26');
    expect(ids).not.toContain('tahara-morning-2026-11-21');
    expect(ids).toHaveLength(1 + 5 * 2 + 1);
  });
});
