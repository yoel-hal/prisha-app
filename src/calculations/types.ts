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

export type Chumrot = {
  kavuah: boolean;
  veshetEinah: boolean;
  onahBeinonitIfHaflaga: boolean;
  // Keep both onot (day AND night) on the 30th day (onah beinonit).
  // Source: Ohr Zarua. Any minhag can adopt this strictness.
  // When false: only the same onah as the period is kept.
  bothOnotOnBeinonit: boolean;
  // Keep both onot (day AND night) on yom hachodesh.
  // Source: Kreisi uPleisi. Any minhag can adopt this strictness.
  // When false: only the same onah as the period is kept.
  bothOnotOnYomHaChodesh: boolean;
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

export type VesetResult = {
  id: string;
  type: VesetType;
  dateGregorian: string;
  dateHebrew: HebrewDate;
  onah: Onah;
  sourcePeriodId: string;
  minhagLabel: string;
  isKavuah: boolean;
};

/**
 * A MinhagStrategy encapsulates the base halachic calculation rules
 * for one minhag (community tradition). Chumrot (additional strictnesses)
 * are applied on top of the strategy result by the main calculators —
 * they are NOT the strategy's responsibility.
 */
export type MinhagStrategy = {
  /**
   * Returns the base onah beinonit result(s) for this minhag.
   * Day 30 from the period start (inclusive count), same onah as the period.
   * Chabad adds the preceding onah when the period started at night —
   * this is a base minhag rule, not a chumra, so it lives here.
   * Source: Shulchan Aruch Yoreh De'ah 189:2
   */
  calcOnahBeinonit(period: Period): VesetResult[];

  /**
   * Returns the haflaga result for this minhag given the full period history.
   * Interval between the last two periods, projected forward from the latest.
   * Requires at least 2 periods; returns [] otherwise.
   * Source: Shulchan Aruch Yoreh De'ah 189:4
   */
  calcHaflaga(periods: Period[]): VesetResult[];

  /**
   * Returns the yom hachodesh result(s) for this minhag.
   * Same Hebrew day-of-month in the next Hebrew month, same onah.
   * Source: Shulchan Aruch Yoreh De'ah 189:6
   */
  calcYomHaChodesh(period: Period): VesetResult[];
};
