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

export type Minhag = "ashkenaz" | "sfarad" | "chabad" | "teimani" | "yireim";

export type Chumrot = {
  kavuah: boolean;
  veshetEinah: boolean;
  onahBeinonitIfHaflaga: boolean;
};

export type UserSettings = {
  minhag: Minhag;
  chumrot: Chumrot;
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
