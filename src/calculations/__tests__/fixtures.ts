import type { Period } from '../types';

/**
 * Builds a `Period` for tests. Gregorian and Hebrew fields should agree
 * (as in app data) so vest math stays consistent.
 */
export function makePeriod(
  partial: Pick<Period, 'id' | 'dateGregorian' | 'dateHebrew' | 'onah'> &
    Partial<Pick<Period, 'notes' | 'createdAt' | 'createdBy'>>,
): Period {
  return {
    notes: undefined,
    createdAt: '2020-01-01T00:00:00.000Z',
    createdBy: 'test-user',
    ...partial,
  };
}
