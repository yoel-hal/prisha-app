/**
 * Colors for the whole app. Warm linen neutrals, one dusty-rose accent, and a
 * meaning-only pair for the onot: soft gold for a day onah, indigo for a night.
 * The world is the evening and the moon (the Hebrew month is lunar; tevilah is at night).
 */
export const colors = {
  /** Page background. */
  page: '#FBF8F5',
  /** Cards and sheets. */
  surface: '#FFFFFF',
  /** Inputs, selected rows, quiet chips. */
  raised: '#F4EFEA',
  /** Hairline borders. */
  hairline: 'rgba(42, 34, 38, 0.10)',
  hairlineStrong: 'rgba(42, 34, 38, 0.16)',

  text: '#2A2226',
  textSecondary: '#5F5459',
  textMuted: '#857A7F',
  onAccent: '#FFFFFF',

  /** Primary actions, today, the one number that matters. */
  accent: '#A8485F',
  accentPressed: '#8F3B50',
  accentSoft: '#F6E9EC',

  dayBg: '#FBF1DC',
  dayText: '#7A5A14',
  nightBg: '#E9EAF5',
  nightText: '#3A3F78',
  /** Night sky for the mikveh-night moment. */
  nightSky: '#1F2246',

  shabbatBg: '#F5EEE6',
  shabbatText: '#8A5A2B',

  positive: '#2F7D55',
  positiveSoft: '#E6F2EB',
  negative: '#B3261E',
  negativeSoft: '#FBEAE8',
} as const;

export const radius = { control: 10, card: 16, sheet: 20 } as const;
