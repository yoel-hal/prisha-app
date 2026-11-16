import type { VesetType } from '../calculations/types';

const VESET_BADGE_COLORS: Record<VesetType, { background: string; text: string }> =
  {
    onahBeinonit: { background: '#F6E9EC', text: '#8F3B50' },
    haflaga: { background: '#EEEAF4', text: '#55457A' },
    yomHaChodesh: { background: '#E7F0E9', text: '#3F6B4B' },
  };

export function vesetBadgeColors(type: VesetType): {
  background: string;
  text: string;
} {
  return VESET_BADGE_COLORS[type];
}
