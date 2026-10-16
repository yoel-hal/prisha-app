import type { Timestamp } from 'firebase/firestore';

export type SupportThreadStatus = 'new' | 'open' | 'resolved';

export type SupportMessageSender = 'user' | 'admin';

export interface SupportThread {
  id: string;
  userId: string | null;
  userEmail: string;
  subject: string;
  status: SupportThreadStatus;
  createdAt: Timestamp;
  lastMessageAt: Timestamp;
  unreadByAdmin: boolean;
}

export interface SupportMessage {
  id: string;
  body: string;
  sentBy: SupportMessageSender;
  sentAt: Timestamp;
  readAt: Timestamp | null;
}
