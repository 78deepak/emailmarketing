import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * StatCard — a reusable KPI card.
 *
 * Two sizes / two visual patterns are covered:
 *   1. Full card with icon + big number + trend line (dashboard "Last 7
 *      days" tiles).
 *   2. Simpler variant if you skip `trend` / `icon` — still works.
 *
 * Skeleton variant renders when `loading` is true so the dashboard
 * doesn't jump from empty to populated in one paint. All cards use
 * the same height/border/padding for visual rhythm.
 */

interface Props {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  // Optional caption line under the value (e.g. "Last 7 days")
  caption?: string;
  loading?: boolean;
  /** Tint for the icon square. Defaults to primary green. */
  iconTint?: 'primary' | 'amber' | 'blue' | 'rose';
}

export function StatCard({
  label,
  value,
  icon: Icon,
  caption,
  loading,
  iconTint = 'primary',
}: Props) {
  if (loading) return <StatCardSkeleton />;

  const tintClasses = {
    primary: 'bg-primary/10 text-primary',
    amber: 'bg-amber-500/10 text-amber-400',
    blue: 'bg-blue-500/10 text-blue-400',
    rose: 'bg-rose-500/10 text-rose-400',
  }[iconTint];

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-start justify-between">
        {Icon && (
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', tintClasses)}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        {caption && (
          <span className="text-xs text-muted-foreground">{caption}</span>
        )}
      </div>
      <div className="space-y-1">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
      </div>
    </div>
  );
}

/** Skeleton — same shape as the real card so layout doesn't shift. */
function StatCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-start justify-between">
        <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        <div className="h-8 w-24 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
