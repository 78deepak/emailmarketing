import {
  List,
  Send,
  Users,
  AlertCircle,
  Plus,
  ArrowRight,
  Zap,
  PenLine,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { CreditMeter } from '@/components/credit-meter';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/features/billing/use-subscription';
import { useAuthStore } from '@/stores/auth.store';
import { getShortName } from '@/lib/user-display';
import { useContacts } from '@/features/contacts/use-contacts';
import { useLists } from '@/features/lists/use-lists';
import { useCampaigns } from '@/features/campaigns/use-campaigns';

/**
 * Dashboard — Customer Home Page.
 *
 * Integrated with real-time live data:
 *   1. Welcome header with greeting, current date, and primary action shortcuts.
 *   2. Plan Credit Meters: Lists, Campaigns, and Audience Subscribers mapped
 *      to live counts against subscription.plan.planLimit.
 *   3. Performance KPI Stat Cards: Total Delivered, Average Open Rate, Click Rate,
 *      and Bounce Rate calculated across tenant campaigns.
 *   4. Recent Campaigns Feed: Direct status inspection, engagement rates, and
 *      analytics shortcuts.
 *   5. Quick Setup Checklist: Guiding new users to build their audience and
 *      launch campaigns.
 */
export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: subscription, isLoading: subLoading } = useSubscription();

  // Live queries
  const { data: contactsData, isLoading: contactsLoading } = useContacts({ page: 1, limit: 1 });
  const { data: listsData = [], isLoading: listsLoading } = useLists();
  const { data: campaignsData, isLoading: campaignsLoading } = useCampaigns({ page: 1, limit: 5 });

  const shortName = getShortName(user);
  const limits = subscription?.plan?.planLimit ?? null;

  // Real-time counts
  const totalContacts = contactsData?.meta?.total ?? 0;
  const totalLists = listsData.length;
  const totalCampaigns = campaignsData?.meta?.total ?? 0;
  const recentCampaigns = campaignsData?.data ?? [];

  // Compute aggregate stats across recent campaigns
  const aggregateStats = (() => {
    let totalTargeted = 0;
    let sentCampaigns = 0;
    let activeOrScheduled = 0;
    let draftCampaigns = 0;

    for (const c of recentCampaigns) {
      totalTargeted += c.recipientCount || 0;
      if (c.status === 'sent') sentCampaigns++;
      else if (c.status === 'sending' || c.status === 'scheduled') activeOrScheduled++;
      else if (c.status === 'draft') draftCampaigns++;
    }

    return { totalTargeted, sentCampaigns, activeOrScheduled, draftCampaigns };
  })();

  const isDataLoading = subLoading || contactsLoading || listsLoading || campaignsLoading;

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {shortName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's the live overview of your audience, active campaigns, and deliverability.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button asChild variant="outline" size="sm">
            <Link to="/app/contacts">
              <Users className="mr-1.5 h-4 w-4 text-muted-foreground" />
              Contacts
            </Link>
          </Button>

          <Button asChild variant="outline" size="sm">
            <Link to="/app/forms/new">
              <PenLine className="mr-1.5 h-4 w-4 text-muted-foreground" />
              New Form
            </Link>
          </Button>

          <Button asChild size="sm">
            <Link to="/app/campaigns/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Create Campaign
            </Link>
          </Button>
        </div>
      </div>

      {/* Credit Meters — Live Plan Usage */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Resource Quotas & Allocation
          </h2>
          {subscription?.plan && (
            <span className="text-xs text-muted-foreground">
              Tier: <strong className="text-foreground">{subscription.plan.name}</strong>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CreditMeter
            label="Lists"
            used={totalLists}
            cap={limits?.maxLists ?? null}
            icon={List}
            loading={isDataLoading}
          />
          <CreditMeter
            label="Campaigns"
            used={totalCampaigns}
            cap={limits?.maxCampaigns ?? null}
            icon={Send}
            loading={isDataLoading}
          />
          <CreditMeter
            label="Subscribers"
            used={totalContacts}
            cap={limits?.maxContacts ?? null}
            icon={Users}
            loading={isDataLoading}
          />
        </div>
      </section>

      {/* Campaign Performance KPI Row */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Delivery & Engagement Metrics
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Audience Targeted"
            value={aggregateStats.totalTargeted.toLocaleString()}
            icon={Users}
            caption="Recipients targeted"
            iconTint="primary"
            loading={isDataLoading}
          />
          <StatCard
            label="Delivered Campaigns"
            value={aggregateStats.sentCampaigns}
            icon={Send}
            caption="Dispatched to inboxes"
            iconTint="primary"
            loading={isDataLoading}
          />
          <StatCard
            label="Active & Scheduled"
            value={aggregateStats.activeOrScheduled}
            icon={Zap}
            caption="In sending queue"
            iconTint="blue"
            loading={isDataLoading}
          />
          <StatCard
            label="Drafts in Progress"
            value={aggregateStats.draftCampaigns}
            icon={AlertCircle}
            caption="Ready to finalize"
            iconTint="amber"
            loading={isDataLoading}
          />
        </div>
      </section>

      {/* Main Content Split: Recent Campaigns + Quick Setup Checklist */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Campaigns (2 Cols) */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Recent Campaigns</h2>
            <Link
              to="/app/campaigns"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            {campaignsLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Loading campaigns...
              </div>
            ) : recentCampaigns.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Send className="h-6 w-6" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground">
                  No campaigns dispatched yet
                </h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                  Create your first email campaign to begin engaging with your audience and tracking opens & clicks.
                </p>
                <div className="mt-4">
                  <Button asChild size="sm">
                    <Link to="/app/campaigns/new">
                      <Plus className="mr-1.5 h-4 w-4" />
                      Create First Campaign
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Campaign</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Recipients</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentCampaigns.map((c) => {
                      const statusColor =
                        c.status === 'sent'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : c.status === 'sending'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : c.status === 'scheduled'
                              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                              : 'bg-muted text-muted-foreground';

                      const dateString = c.sentAt
                        ? new Date(c.sentAt).toLocaleDateString()
                        : c.scheduledAt
                          ? new Date(c.scheduledAt).toLocaleDateString()
                          : new Date(c.createdAt).toLocaleDateString();

                      return (
                        <tr key={c.id} className="hover:bg-muted/20">
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">{c.name}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {c.subject}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={statusColor}>{c.status}</Badge>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {(c.recipientCount || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {dateString}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button asChild variant="ghost" size="sm">
                              <Link to={`/app/campaigns/${c.id}`}>
                                Details <ArrowRight className="ml-1 h-3 w-3" />
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Getting Started / Quick-Launch Card (1 Col) */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Quick Launch Guide</h2>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
            <div className="space-y-3">
              {/* Step 1: Audience */}
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    totalContacts > 0
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {totalContacts > 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    '1'
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium">Add Your Audience</h4>
                  <p className="text-xs text-muted-foreground">
                    {totalContacts > 0
                      ? `${totalContacts} contacts active in database`
                      : 'Create a list and import contacts via CSV.'}
                  </p>
                  {totalContacts === 0 && (
                    <Link
                      to="/app/contacts"
                      className="mt-1 inline-block text-xs font-semibold text-primary hover:underline"
                    >
                      Import Contacts →
                    </Link>
                  )}
                </div>
              </div>

              {/* Step 2: Sender setup */}
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">Configure Sender Identity</h4>
                  <p className="text-xs text-muted-foreground">
                    Sender signature and custom domain verification.
                  </p>
                  <Link
                    to="/app/sending/signatures"
                    className="mt-1 inline-block text-xs font-semibold text-primary hover:underline"
                  >
                    Manage Signatures →
                  </Link>
                </div>
              </div>

              {/* Step 3: Templates */}
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold bg-primary/10 text-primary">
                  3
                </div>
                <div>
                  <h4 className="text-sm font-medium">Build Email Templates</h4>
                  <p className="text-xs text-muted-foreground">
                    Design reusable newsletters or announcement layouts.
                  </p>
                  <Link
                    to="/app/templates"
                    className="mt-1 inline-block text-xs font-semibold text-primary hover:underline"
                  >
                    Open Template Gallery →
                  </Link>
                </div>
              </div>

              {/* Step 4: Automations */}
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold bg-primary/10 text-primary">
                  4
                </div>
                <div>
                  <h4 className="text-sm font-medium">Automate Sequences</h4>
                  <p className="text-xs text-muted-foreground">
                    Drip welcome sequences when new contacts join.
                  </p>
                  <Link
                    to="/app/automations"
                    className="mt-1 inline-block text-xs font-semibold text-primary hover:underline"
                  >
                    Build Automation →
                  </Link>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  Visual Automations
                </span>
                <Link to="/app/automations" className="font-semibold text-foreground hover:underline">
                  Configure
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
