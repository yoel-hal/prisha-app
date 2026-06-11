import type { VesetType } from '../calculations/types';

const VESET_BADGE_COLORS: Record<VesetType, { background: string; text: string }> =
  {
    onahBeinonit: { background: '#dbeafe', text: '#1d4ed8' },
    haflaga: { background: '#ede9fe', text: '#6d28d9' },
    yomHaChodesh: { background: '#dcfce7', text: '#15803d' },
  };

export function vesetBadgeColors(type: VesetType): {
  background: string;
  text: string;
} {
  return VESET_BADGE_COLORS[type];
}
