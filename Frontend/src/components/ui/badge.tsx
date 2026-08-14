import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Badge — shadcn/ui status pill.
 *
 * Variants map to our token palette:
 *   - default     -> primary (green): active, subscribed, verified, paid
 *   - secondary   -> muted grey: draft, neutral
 *   - destructive -> red: failed, bounced, cancelled
 *   - amber       -> warning (custom): trialing, pending, past_due, complained
 *   - outline     -> subtle border only, for low-emphasis tags
 *
 * `amber` isn't in vanilla shadcn — we add it here because it's used all
 * over billing/contact status. Kept tinted (bg-amber-500/10) so it reads
 * on both light and dark backgrounds without needing new CSS vars.
 */

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary/10 text-primary ring-1 ring-primary/30',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground',
        destructive:
          'border-transparent bg-destructive/10 text-destructive ring-1 ring-destructive/30',
        amber:
          'border-transparent bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30',
        outline: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
