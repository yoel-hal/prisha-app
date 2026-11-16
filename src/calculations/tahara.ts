import { toAbs } from './hebrewCalendar';
import { addHebrewDays } from './onah';
import type {
  CheckKey,
  CheckTime,
  HebrewDate,
  HefsekMinDays,
  Minhag,
  Period,
  TaharaCycle,
} from './types';

export const CLEAN_DAYS = 7;
/** How long after the earliest day the hefsek card keeps asking when nothing was recorded. */
export const HEFSEK_PROMPT_DAYS = 14;
export const CHECK_TIMES: CheckTime[] = ['morning', 'evening'];

/**
 * The earliest day for the hefsek tahara, counting the day the period started as day 1.
 * Ashkenaz and Chabad wait five days (Rema, Yoreh De'ah 196:11, from the concern of
 * poletes shichvat zera). Sfarad and Teimani follow the Shulchan Aruch, who does not
 * bring the five days; common Sefardi practice is four (Taharat HaBayit).
 * The owner's setting can override this.
 */
export function hefsekMinDays(minhag: Minhag, override: HefsekMinDays | null): HefsekMinDays {
  if (override) {
    return override;
  }
  return minhag === 'sfarad' || minhag === 'teimani' ? 4 : 5;
}

/**
 * The Hebrew date of the earliest hefsek: the period day counts as day 1, whether
 * the period started at night or by day (Rema, Yoreh De'ah 196:11).
 */
export function earliestHefsekDate(period: Pick<Period, 'dateHebrew'>, minDays: number): HebrewDate {
  return addHebrewDays(period.dateHebrew, minDays - 1);
}

/** Clean day `n` (1–7) is `n` days after the hefsek (Shulchan Aruch, Yoreh De'ah 196:1). */
export function cleanDayDate(hefsek: HebrewDate, n: number): HebrewDate {
  return addHebrewDays(hefsek, n);
}

/**
 * The mikveh night: the night after the seventh clean day, i.e. the night onah of
 * the eighth day after the hefsek (Shulchan Aruch, Yoreh De'ah 197:3).
 */
export function mikvehNightDate(hefsek: HebrewDate): HebrewDate {
  return addHebrewDays(hefsek, CLEAN_DAYS + 1);
}

export function checkKey(day: number, time: CheckTime): CheckKey {
  return `${day}-${time}`;
}

/**
 * Which clean day `today` is (1–7), 0 before day 1 (the hefsek day itself),
 * or 8 and more once the seven days are over.
 */
export function cleanDayNumber(hefsek: HebrewDate, today: HebrewDate): number {
  return toAbs(today) - toAbs(hefsek);
}

/** Every check of the seven clean days, morning then evening (Shulchan Aruch, Yoreh De'ah 196:4). */
export function allChecks(): { day: number; time: CheckTime; key: CheckKey }[] {
  const out: { day: number; time: CheckTime; key: CheckKey }[] = [];
  for (let day = 1; day <= CLEAN_DAYS; day++) {
    for (const time of CHECK_TIMES) {
      out.push({ day, time, key: checkKey(day, time) });
    }
  }
  return out;
}

export function hasNotCleanCheck(cycle: Pick<TaharaCycle, 'checks'>): boolean {
  return Object.values(cycle.checks).includes('notClean');
}

export type TaharaState =
  /** No period yet, or the feature can't say anything. */
  | { kind: 'none' }
  /** Waiting for the earliest hefsek day. */
  | { kind: 'waitHefsek'; period: Period; earliest: HebrewDate }
  /** The hefsek can be done today (or any day from now). */
  | {
      kind: 'hefsekToday';
      period: Period;
      earliest: HebrewDate;
      afterRestart: boolean;
      /** The cycle that ended with a check that wasn't clean (so it can be undone). */
      restartedCycle: TaharaCycle | null;
    }
  /** Counting the seven clean days. */
  | { kind: 'counting'; cycle: TaharaCycle; day: number; mikvehNight: HebrewDate }
  /** Day 7 is today or over; the mikveh night is tonight (or was last night, still shown that day). */
  | { kind: 'mikvehNight'; cycle: TaharaCycle; mikvehNight: HebrewDate; isTonight: boolean };

/**
 * Where the woman stands after her latest period, from the recorded cycles.
 * A restarted cycle (a check that wasn't clean) allows a new hefsek from the day of
 * that check, since the minimum days have already passed.
 * The state ends the day after the mikveh night, until the next period.
 *
 * @param periods - All periods (any order)
 * @param cycles  - All hefsek cycles (any order)
 * @param today   - Today's Hebrew date (daytime mapping)
 * @param minDays - Earliest hefsek day from `hefsekMinDays`
 */
export function taharaState(
  periods: Period[],
  cycles: TaharaCycle[],
  today: HebrewDate,
  minDays: number,
): TaharaState {
  const latest = [...periods].sort((a, b) => toAbs(a.dateHebrew) - toAbs(b.dateHebrew)).at(-1);
  if (!latest) {
    return { kind: 'none' };
  }

  const forPeriod = cycles
    .filter(
      (cycle) =>
        cycle.periodId === latest.id && toAbs(cycle.hefsekDateHebrew) >= toAbs(latest.dateHebrew),
    )
    .sort((a, b) => toAbs(a.hefsekDateHebrew) - toAbs(b.hefsekDateHebrew) || a.createdAt.localeCompare(b.createdAt));
  const current = forPeriod.at(-1);

  if (!current || current.status === 'restarted' || hasNotCleanCheck(current)) {
    const minEarliest = earliestHefsekDate(latest, minDays);
    const restartFrom = current ? restartDate(current) : null;
    const earliest =
      restartFrom && toAbs(restartFrom) > toAbs(minEarliest) ? restartFrom : minEarliest;
    if (!current && toAbs(today) - toAbs(minEarliest) > HEFSEK_PROMPT_DAYS) {
      // Nothing recorded long after the earliest day: she is most likely past it
      // (e.g. used the app before this feature), so don't ask.
      return { kind: 'none' };
    }
    if (toAbs(today) >= toAbs(earliest)) {
      return {
        kind: 'hefsekToday',
        period: latest,
        earliest,
        afterRestart: Boolean(current),
        restartedCycle: current ?? null,
      };
    }
    return { kind: 'waitHefsek', period: latest, earliest };
  }

  const day = cleanDayNumber(current.hefsekDateHebrew, today);
  const mikvehNight = mikvehNightDate(current.hefsekDateHebrew);
  if (day <= CLEAN_DAYS - 1) {
    return { kind: 'counting', cycle: current, day: Math.max(day, 0), mikvehNight };
  }
  if (day === CLEAN_DAYS) {
    return { kind: 'mikvehNight', cycle: current, mikvehNight, isTonight: true };
  }
  if (day === CLEAN_DAYS + 1) {
    return { kind: 'mikvehNight', cycle: current, mikvehNight, isTonight: false };
  }
  return { kind: 'none' };
}

/** The Hebrew date of the first check that wasn't clean, or the hefsek day itself. */
function restartDate(cycle: TaharaCycle): HebrewDate {
  const failed = allChecks().find(({ key }) => cycle.checks[key] === 'notClean');
  return failed ? cleanDayDate(cycle.hefsekDateHebrew, failed.day) : cycle.hefsekDateHebrew;
}
