import type { Minhag } from '@/calculations/types';
import type { Timestamp } from 'firebase/firestore';

export type BroadcastStatus = 'draft' | 'scheduled' | 'sent' | 'failed';

export type BroadcastTargetType = 'all' | 'byMinhag' | 'byCountry';

export interface BroadcastChannels {
  push: boolean;
  inApp: boolean;
  email: boolean;
}

export interface BroadcastTargetFilter {
  type: BroadcastTargetType;
  value?: string;
}

export interface Broadcast {
  id: string;
  titleHe: string;
  titleEn: string;
  bodyHe: string;
  bodyEn: string;
  channels: BroadcastChannels;
  targetFilter: BroadcastTargetFilter;
  scheduledAt: Timestamp | null;
  sentAt: Timestamp | null;
  status: BroadcastStatus;
  recipientCount: number;
  createdAt: Timestamp;
}

export const BROADCAST_MINHAGIM: Minhag[] = [
  'ashkenaz',
  'sfarad',
  'chabad',
  'teimani',
];
