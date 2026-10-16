import type { Timestamp } from 'firebase/firestore';

export interface AppMessage {
  id: string;
  titleHe: string;
  titleEn: string;
  bodyHe: string;
  bodyEn: string;
  ctaTextHe: string | null;
  ctaTextEn: string | null;
  ctaUrl: string | null;
  activeFrom: Timestamp;
  activeUntil: Timestamp;
  isActive: boolean;
  createdAt: Timestamp;
}

export function getBannerId(createdAt: Timestamp): string {
  return String(createdAt.toMillis());
}
