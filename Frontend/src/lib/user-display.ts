export type UserDisplayable = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
};

/**
 * 1-2 character avatar initials. Prefers first-initial + last-initial;
 * falls back to first two chars of the email local-part.
 */
export function getUserInitials(user: UserDisplayable | null | undefined): string {
  if (!user) return '?';
  const first = (user.firstName ?? '').trim();
  const last = (user.lastName ?? '').trim();
  if (first || last) {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || '?';
  }
  const local = user.email.split('@')[0] ?? '';
  return local.slice(0, 2).toUpperCase() || '?';
}

/**
 * Best-available human name for greetings. Falls back through:
 * firstName -> firstName+lastName -> email local-part -> "there".
 */
export function getDisplayName(user: UserDisplayable | null | undefined): string {
  if (!user) return 'there';
  const first = (user.firstName ?? '').trim();
  const last = (user.lastName ?? '').trim();
  if (first) return last ? `${first} ${last}` : first;
  const local = user.email.split('@')[0];
  return local || 'there';
}

/** Just the short first-name (or fallback), for compact spots like "Welcome, X". */
export function getShortName(user: UserDisplayable | null | undefined): string {
  if (!user) return 'there';
  const first = (user.firstName ?? '').trim();
  if (first) return first;
  return user.email.split('@')[0] || 'there';
}
