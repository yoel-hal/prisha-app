export type Onah = "day" | "night";

export type HebrewDate = {
  year: number;
  month: number;
  day: number;
};

export type Period = {
  id: string;
  dateGregorian: string;
  dateHebrew: HebrewDate;
  onah: Onah;
  notes?: string;
  createdAt: string;
  createdBy: string;
};

export type VesetType = "onahBeinonit" | "haflaga" | "yomHaChodesh";

export type Minhag = "ashkenaz" | "sfarad" | "chabad" | "teimani";

/**
 * Which chumra wins when Ohr Zarua and Kreisi uPleisi are both on and the
 * forbidden onah of day 30 is a night (they then point at different days).
 */
export type NightConflictChoice = "both" | "ohrZarua" | "kreisiUpleisi";

/**
 * Yom hachodesh for a period on the 30th when the next Hebrew month has 29 days.
 * - none: no yom hachodesh (default; onah beinonit falls on the 29th anyway)
 * - firstOfFollowing: the 1st of the month after the next one
 * - twentyNinth: the 29th of the next month
 */
export type ShortMonthRule = "none" | "firstOfFollowing" | "twentyNinth";

/**
 * A fixed veset the user declared in settings. With a kavuah there is no
 * onah beinonit; only the fixed veset is kept.
 * - haflaga: `days` counts both the period day and the veset day (haflaga of 30 = 29 days later)
 * - chodesh: `dayOfMonth` in the Hebrew month (1–30)
 */
export type Kavuah =
  | { type: "none" }
  | { type: "haflaga"; days: number }
  | { type: "chodesh"; dayOfMonth: number };

export type Chumrot = {
  /** Also the onah before each forbidden onah (all vesatot). */
  ohrZarua: boolean;
  /** The whole halachic day of day 30 (onah beinonit only, never day 31). */
  kreisiUpleisi: boolean;
  /** Used only when ohrZarua and kreisiUpleisi are both on and the onah is a night. */
  nightConflict: NightConflictChoice;
  /** Also day 31, same onah (always in addition to day 30). */
  chavotDaat: boolean;
  /** With chavotDaat + ohrZarua: does Ohr Zarua also apply to day 31? */
  ohrZaruaOnDay31: boolean;
  shortMonthRule: ShortMonthRule;
  kavuah: Kavuah;
  /** The user had the old on/off kavuah switch on and must set the kavuah again. */
  kavuahNeedsReview: boolean;
};

export type NotificationLeadHours = 12 | 24 | 48;

export type NotificationSettings = {
  enabled: boolean;
  leadHours: NotificationLeadHours;
  onahBeinonit: boolean;
  haflaga: boolean;
  yomHaChodesh: boolean;
};

export type CalendarSettings = {
  syncEnabled: boolean;
  eventTitle: string;
  syncedEventIds: Record<string, string>;
};

export type UserSettings = {
  minhag: Minhag;
  chumrot: Chumrot;
  notifications: NotificationSettings;
  calendar: CalendarSettings;
};

/**
 * Why an onah is forbidden: the main rule of that veset, or the chumra that added it.
 * One onah can have more than one reason (e.g. Ohr Zarua and Kreisi uPleisi both
 * forbid the night before a day onah).
 */
export type VesetReason = "main" | "ohrZarua" | "kreisiUpleisi" | "chavotDaat";

export type VesetResult = {
  id: string;
  type: VesetType;
  /** Civil date of the daytime of `dateHebrew`; a night onah starts the evening before. */
  dateGregorian: string;
  dateHebrew: HebrewDate;
  onah: Onah;
  sourcePeriodId: string;
  minhagLabel: string;
  isKavuah: boolean;
  reasons: VesetReason[];
};
