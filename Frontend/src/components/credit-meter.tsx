import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * CreditMeter — the horizontal progress-bar card seen in the Acelle
 * dashboard for LISTS / CAMPAIGNS / SUBSCRIBERS.
 *
 * Shows: an icon square, label + big count, and a progress bar showing
 * used/max. Handles two edge cases:
 *
 *   - cap === null: unlimited plan tier. Renders no bar, just the count
 *     with an "unlimited" caption. Avoids showing a bar that's meaningless.
 *   - used > cap: over quota (shouldn't happen — backend gates block it —
 *     but if it does, we clamp the bar at 100% and tint the fill amber
 *     so it's visually loud).
 *
 * Percentage tint threshold: <75% green, 75-90% amber, >=90% rose.
 */

interface Props {
  label: string;
  used: number;
  cap: number | null;
  icon?: LucideIcon;
  loading?: boolean;
}

export function CreditMeter({ label, used, cap, icon: Icon, loading }: Props) {
  if (loading) return <CreditMeterSkeleton />;

  const unlimited = cap === null;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / cap) * 100));

  const barColor =
    pct >= 90
      ? 'bg-rose-500'
      : pct >= 75
        ? 'bg-amber-500'
        : 'bg-primary';

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
        </div>
      </div>

      <div className="mb-3 text-3xl font-bold tracking-tight">
        {used.toLocaleString()}
      </div>

      {unlimited ? (
        <div className="text-xs text-muted-foreground">Unlimited</div>
      ) : (
        <>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{pct}%</span>
            <span className="text-muted-foreground">
              {cap.toLocaleString()} max
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn('h-full transition-all', barColor)}
              style={{ width: `${pct}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}

function CreditMeterSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
      </div>
      <div className="mb-3 h-8 w-24 animate-pulse rounded bg-muted" />
      <div className="mb-1 flex items-center justify-between">
        <div className="h-3 w-8 animate-pulse rounded bg-muted" />
        <div className="h-3 w-16 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-1.5 w-full animate-pulse rounded-full bg-muted" />
    </div>
  );
}
