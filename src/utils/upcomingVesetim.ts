import type { VesetResult } from '../calculations/types';

/** Vestos from today through the next N calendar months, sorted by date. */
export function getUpcomingVesetim(
  vesetim: VesetResult[],
  monthsAhead = 3,
): VesetResult[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const end = new Date(today);
  end.setMonth(end.getMonth() + monthsAhead);

  return vesetim
    .filter((veset) => {
      const date = new Date(`${veset.dateGregorian}T12:00:00`);
      return date >= today && date <= end;
    })
    .sort((a, b) => a.dateGregorian.localeCompare(b.dateGregorian));
}
