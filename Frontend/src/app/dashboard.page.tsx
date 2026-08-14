import { List, Send, Users, Mail, MousePointerClick, AlertCircle } from 'lucide-react';

import { CreditMeter } from '@/components/credit-meter';
import { StatCard } from '@/components/stat-card';
import { useSubscription } from '@/features/billing/use-subscription';
import { useAuthStore } from '@/stores/auth.store';
import { getShortName } from '@/lib/user-display';

/**
 * Dashboard — customer home page.
 *
 * Two zones:
 *
 *   1. Welcome header — greeting + a short "here's what's happening"
 *      subtitle. Reads the user's short name from the auth store, falls
 *      back gracefully when firstName is null.
 *
 *   2. Three credit meters (Lists / Campaigns / Subscribers) driven off
 *      subscription.plan.planLimit. `used` values are 0 for now — Chunks
 *      6-9 populate them with real counts as those endpoints come online.
 *
 *   3. Four stat cards (Last 7 days: sends / opens / clicks / bounces).
 *      Placeholder values until the campaign-stats endpoint is wired in
 *      Phase 3. Rendered as zeros so the layout is verifiable now.
 *
 * Loading states: while useSubscription is fetching, all cards show
 * skeletons so the page doesn't flash empty then populated.
 */
export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: subscription, isLoading } = useSubscription();

  const shortName = getShortName(user);
  const limits = subscription?.plan?.planLimit ?? null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {shortName}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here's what's happening with your email marketing.
        </p>
      </header>

      {/* Credit meters — plan usage. Real used-counts come in later chunks. */}
      <section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CreditMeter
            label="Lists"
            used={0}
            cap={limits?.maxLists ?? null}
            icon={List}
            loading={isLoading}
          />
          <CreditMeter
            label="Campaigns"
            used={0}
            cap={limits?.maxCampaigns ?? null}
            icon={Send}
            loading={isLoading}
          />
          <CreditMeter
            label="Subscribers"
            used={0}
            cap={limits?.maxContacts ?? null}
            icon={Users}
            loading={isLoading}
          />
        </div>
      </section>

      {/* Last-7-days stat row — placeholder values until campaign-stats API lands. */}
      <section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Sent"
            value="0"
            icon={Send}
            caption="Last 7 days"
            iconTint="primary"
          />
          <StatCard
            label="Open Rate"
            value="0%"
            icon={Mail}
            caption="Last 7 days"
            iconTint="primary"
          />
          <StatCard
            label="Click Rate"
            value="0%"
            icon={MousePointerClick}
            caption="Last 7 days"
            iconTint="blue"
          />
          <StatCard
            label="Bounce Rate"
            value="0%"
            icon={AlertCircle}
            caption="Last 7 days"
            iconTint="amber"
          />
        </div>
      </section>

      {/* Empty state hint — helps a brand-new tenant know what to do next.
          Real "recent campaigns" list slots in here once campaigns exist. */}
      <section>
        <div className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center">
          <h2 className="text-lg font-semibold">Get started</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Import your contacts, build a template, and send your first campaign.
            Your recent campaigns and stats will show up here.
          </p>
        </div>
      </section>
    </div>
  );
}
