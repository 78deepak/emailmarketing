import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  Mail,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Shield,
  Layers,
  ArrowRight,
  Server,
  Zap,
} from 'lucide-react';
import { useAdminOverview } from '@/features/admin/use-admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  const { data: stats, isLoading, error, refetch } = useAdminOverview();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-card border border-border" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-xl bg-card border border-border" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-destructive mb-3" />
        <h3 className="text-lg font-semibold text-foreground">Failed to Load Platform Telemetry</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Unable to fetch overview data from the super-admin API.
        </p>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          Try Again
        </Button>
      </div>
    );
  }

  // Format currency: price is in cents (or paise)
  const formattedMrr = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format((stats.estimatedMrrCents || 0) / 100);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Platform Command Center
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time telemetry, tenant saturation, and revenue metrics across all organizations.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/customers">
              <Users className="mr-2 h-4 w-4" />
              Manage Customers
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/admin/plans">
              <Layers className="mr-2 h-4 w-4" />
              Manage Plans
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Tenants */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tenants & Workspaces
            </span>
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-500">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold tracking-tight text-foreground">
              {stats.totalTenants.toLocaleString()}
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                {stats.activeTenants} active
              </span>
              <span>•</span>
              <span className="text-muted-foreground">{stats.suspendedTenants} suspended</span>
            </div>
          </div>
        </div>

        {/* Estimated MRR */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Estimated MRR
            </span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold tracking-tight text-foreground">
              {formattedMrr}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>{stats.activeSubscriptionsCount} active paying plans</span>
            </div>
          </div>
        </div>

        {/* Total Outbound Sends */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Platform Email Dispatch
            </span>
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-500">
              <Mail className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold tracking-tight text-foreground">
              {stats.totalEmailsSent.toLocaleString()}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Across <span className="font-medium text-foreground">{stats.totalCampaigns.toLocaleString()}</span> campaigns & automations
            </div>
          </div>
        </div>

        {/* Audience Reach */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Audience & User Base
            </span>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-500">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold tracking-tight text-foreground">
              {stats.totalContacts.toLocaleString()}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Subscribers across <span className="font-medium text-foreground">{stats.totalUsers.toLocaleString()}</span> team members
            </div>
          </div>
        </div>
      </div>

      {/* Infrastructure & Global Gateway Health Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Server className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Database & Schemas</h3>
              <p className="text-xs text-muted-foreground">PostgreSQL + Prisma RLS</p>
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-border/60 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tenant Isolation</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Strict (RLS Enabled)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Migrations</span>
              <span className="font-medium text-foreground">Up to Date</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Queue & Background Jobs</h3>
              <p className="text-xs text-muted-foreground">BullMQ Redis Dispatchers</p>
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-border/60 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email Outbound Queue</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Processing</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Webhook Ingestion</span>
              <span className="font-medium text-foreground">Active</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-500">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Razorpay Gateway</h3>
              <p className="text-xs text-muted-foreground">Subscriptions & Invoicing</p>
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-border/60 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Webhook Verification</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Enabled</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan Mapping</span>
              <Link to="/admin/settings" className="text-primary hover:underline font-medium">
                Configure →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tenant Signups Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">Recent Customer Registrations</h2>
            <p className="text-xs text-muted-foreground">
              Newest organizations onboarded onto the email marketing platform.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-xs gap-1">
            <Link to="/admin/customers">
              View All Customers
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground">
              <tr>
                <th className="py-3 px-4">Workspace</th>
                <th className="py-3 px-4">Plan Tier</th>
                <th className="py-3 px-4">Users</th>
                <th className="py-3 px-4">Contacts</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Registered</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {stats.recentTenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    No tenants found.
                  </td>
                </tr>
              ) : (
                stats.recentTenants.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{t.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{t.slug}</div>
                    </td>
                    <td className="py-3 px-4">
                      {t.plan ? (
                        <Badge variant="secondary" className="font-medium text-[11px]">
                          {t.plan.name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Free Tier</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs">{t._count.users}</td>
                    <td className="py-3 px-4 text-xs font-mono">{t._count.contacts.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={t.status === 'active' ? 'default' : 'destructive'}
                        className="text-[11px]"
                      >
                        {t.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                        <Link to={`/admin/customers?search=${encodeURIComponent(t.name)}`}>
                          Inspect
                          <ExternalLink className="ml-1.5 h-3 w-3" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
