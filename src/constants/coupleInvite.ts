/** Production web origin for shareable couple invite links. */
export const INVITE_WEB_BASE_URL = 'https://prishatracker.app';

export const INVITE_CODE_LENGTH = 6;

/** Invite codes expire 48 hours after generation. */
export const INVITE_TTL_MS = 48 * 60 * 60 * 1000;

export function buildInviteLink(code: string): string {
  return `${INVITE_WEB_BASE_URL}/invite/${code}`;
}
