import { AlertCircle, Clock, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useSubscription } from '@/features/billing/use-subscription';
import { getBannerState, type BannerState } from '@/features/billing/banner-state';

/**
 * Trial / billing status banner — thin strip at the top of the app shell.
 *
 * Reads the current subscription and renders one of 4 messages based on
 * state (see banner-state.ts). Renders nothing when everything is healthy
 * OR while loading — a flashing banner is worse than none.
 *
 * The "Upgrade" CTA points at /app/billing (Phase 4). Until that page
 * exists it 404s to /app via the catch-all; the click just feels no-op.
 * That's fine for Chunk 5 — real billing UI comes later.
 */

export function TrialBanner() {
  const { data: subscription, isLoading } = useSubscription();

  // Don't flash a banner on hard refresh. Wait for the query to resolve.
  if (isLoading) return null;

  const state = getBannerState(subscription);
  if (!state) return null;

  const view = pickView(state);

  return (
    <div className={cn('flex items-center justify-between gap-4 px-4 py-2 text-sm', view.classes)}>
      <div className="flex items-center gap-2">
        <view.Icon className="h-4 w-4 shrink-0" />
        <span>{view.message}</span>
      </div>
      <Link
        to="/app/billing"
        className="whitespace-nowrap font-semibold underline-offset-2 hover:underline"
      >
        {view.cta}
      </Link>
    </div>
  );
}

/** Turn a BannerState into concrete text + styling + icon choices. */
function pickView(state: NonNullable<BannerState>) {
  switch (state.kind) {
    case 'trial': {
      const days = state.daysLeft;
      const dayWord = days === 1 ? 'day' : 'days';
      // Urgent variant when ≤3 days left — amber tint.
      if (state.urgent) {
        return {
          Icon: Clock,
          classes: 'bg-amber-500/10 text-amber-400 border-b border-amber-500/30',
          message:
            days === 0
              ? 'Your trial ends today.'
              : `Your trial ends in ${days} ${dayWord}.`,
          cta: 'Upgrade now',
        };
      }
      return {
        Icon: Clock,
        classes: 'bg-primary/10 text-primary border-b border-primary/30',
        message: `${days} ${dayWord} left in your free trial.`,
        cta: 'Upgrade',
      };
    }
    case 'past_due':
      return {
        Icon: CreditCard,
        classes: 'bg-amber-500/10 text-amber-400 border-b border-amber-500/30',
        message: "We couldn't process your last payment. Update your billing to keep sending.",
        cta: 'Update billing',
      };
    case 'expired':
      return {
        Icon: AlertCircle,
        classes: 'bg-destructive/10 text-destructive border-b border-destructive/30',
        message: 'Your trial has ended. Pick a plan to continue.',
        cta: 'Choose a plan',
      };
    case 'frozen':
      return {
        Icon: AlertCircle,
        classes: 'bg-destructive/10 text-destructive border-b border-destructive/30',
        message: 'Your account is inactive. Subscribe to restore access.',
        cta: 'Subscribe',
      };
  }
}
