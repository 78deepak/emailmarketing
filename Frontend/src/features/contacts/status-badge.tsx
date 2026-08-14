import { Badge } from '@/components/ui/badge';
import type { ContactStatus } from '@/types/contacts';

/**
 * ContactStatusBadge — maps a ContactStatus to a Badge variant + label.
 *
 * Kept as its own component (not inlined in the DataTable columns) so
 * the contact-detail drawer and any future filter chip render exactly
 * the same visual.
 *
 * Mapping rationale:
 *   subscribed   -> primary (green): healthy, good
 *   unsubscribed -> secondary (grey): opted out, not an error
 *   bounced      -> destructive (red): delivery failure
 *   complained   -> destructive (red): spam-marked, worse than bounce
 *
 * There is no 'pending' status on the backend (see types/contacts.ts) —
 * only these 4 exist in the Prisma ContactStatus enum.
 */

const CONFIG: Record<
  ContactStatus,
  { variant: 'default' | 'secondary' | 'destructive' | 'amber'; label: string }
> = {
  subscribed: { variant: 'default', label: 'Subscribed' },
  unsubscribed: { variant: 'secondary', label: 'Unsubscribed' },
  bounced: { variant: 'destructive', label: 'Bounced' },
  complained: { variant: 'destructive', label: 'Complained' },
};

export function ContactStatusBadge({ status }: { status: ContactStatus }) {
  const { variant, label } = CONFIG[status];
  return <Badge variant={variant}>{label}</Badge>;
}
