import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Building2,
  AlertTriangle,
  Filter,
  Eye,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  useAdminTenants,
  useAdminTenant,
  useUpdateTenantStatus,
  useUpdateTenantPlan,
  useAdminPlans,
} from '@/features/admin/use-admin';
import type { AdminTenantItem } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { normalizeAxiosError } from '@/lib/api';

export default function CustomersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 15;

  const [searchTerm, setSearchTerm] = useState(search);
  const [selectedTenantForDetails, setSelectedTenantForDetails] = useState<string | null>(null);
  const [statusDialogTenant, setStatusDialogTenant] = useState<AdminTenantItem | null>(null);
  const [planDialogTenant, setPlanDialogTenant] = useState<AdminTenantItem | null>(null);
  const [newPlanId, setNewPlanId] = useState<string>('');

  const { data, isLoading, isFetching, refetch } = useAdminTenants(page, limit, search, statusFilter);
  const { data: plans } = useAdminPlans();
  const updateStatus = useUpdateTenantStatus();
  const updatePlan = useUpdateTenantPlan();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (searchTerm.trim()) {
      next.set('search', searchTerm.trim());
    } else {
      next.delete('search');
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const handleStatusChange = (val: string) => {
    const next = new URLSearchParams(searchParams);
    if (val) {
      next.set('status', val);
    } else {
      next.delete('status');
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const handlePageChange = (newPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', newPage.toString());
    setSearchParams(next);
  };

  const confirmStatusChange = async () => {
    if (!statusDialogTenant) return;
    const targetStatus = statusDialogTenant.status === 'active' ? 'suspended' : 'active';
    try {
      await updateStatus.mutateAsync({
        id: statusDialogTenant.id,
        status: targetStatus,
      });
      toast.success(
        `Workspace "${statusDialogTenant.name}" has been ${targetStatus === 'active' ? 'reactivated' : 'suspended'}.`,
      );
      setStatusDialogTenant(null);
    } catch (err) {
      toast.error(normalizeAxiosError(err).message || 'Failed to update tenant status');
    }
  };

  const confirmPlanChange = async () => {
    if (!planDialogTenant || !newPlanId) return;
    try {
      await updatePlan.mutateAsync({
        id: planDialogTenant.id,
        planId: newPlanId,
      });
      toast.success(`Assigned plan to workspace "${planDialogTenant.name}".`);
      setPlanDialogTenant(null);
      setNewPlanId('');
    } catch (err) {
      toast.error(normalizeAxiosError(err).message || 'Failed to update workspace plan');
    }
  };

  const tenants = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Customer Organizations
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Audit, inspect, suspend, and govern all {total.toLocaleString()} customer workspaces on the platform.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="self-start sm:self-auto gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between shadow-sm">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by workspace name or slug..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1 text-xs">
            <button
              type="button"
              onClick={() => handleStatusChange('')}
              className={`rounded px-2.5 py-1 font-medium transition ${
                !statusFilter ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange('active')}
              className={`rounded px-2.5 py-1 font-medium transition ${
                statusFilter === 'active'
                  ? 'bg-background shadow-xs text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange('suspended')}
              className={`rounded px-2.5 py-1 font-medium transition ${
                statusFilter === 'suspended'
                  ? 'bg-background shadow-xs text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Suspended
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
              <tr>
                <th className="py-3 px-4">Organization & Slug</th>
                <th className="py-3 px-4">Assigned Plan</th>
                <th className="py-3 px-4">Subscribers</th>
                <th className="py-3 px-4">Members</th>
                <th className="py-3 px-4">Bounce Rate</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                      Loading workspaces...
                    </div>
                  </td>
                </tr>
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                    No matching customer workspaces found.
                  </td>
                </tr>
              ) : (
                tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs uppercase">
                          {t.name.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{t.name}</div>
                          <div className="text-xs font-mono text-muted-foreground">{t.slug}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {t.plan ? (
                        <Badge variant="secondary" className="font-medium text-xs">
                          {t.plan.name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Free Tier</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs font-mono">
                      {(t._count?.contacts ?? 0).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      {t._count?.users ?? 1} {t._count?.users === 1 ? 'member' : 'members'}
                    </td>

                    <td className="py-3.5 px-4">
                      {typeof t.bounceRate === 'number' && t.bounceRate > 0 ? (
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold ${
                            t.bounceRate > 0.05
                              ? 'text-destructive'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {t.bounceRate > 0.05 && <AlertTriangle className="h-3.5 w-3.5" />}
                          {(t.bounceRate * 100).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">0.0%</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge
                        variant={t.status === 'active' ? 'default' : 'destructive'}
                        className="capitalize text-[11px]"
                      >
                        {t.status}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => setSelectedTenantForDetails(t.id)}
                          title="View detail audit"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Audit
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => {
                            setPlanDialogTenant(t);
                            setNewPlanId(t.plan?.id || '');
                          }}
                          title="Change assigned plan"
                        >
                          <CreditCard className="h-3.5 w-3.5 mr-1" />
                          Plan
                        </Button>

                        <Button
                          variant={t.status === 'active' ? 'destructive' : 'outline'}
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => setStatusDialogTenant(t)}
                        >
                          {t.status === 'active' ? 'Suspend' : 'Reactivate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col gap-2 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
          <div>
            Showing <span className="font-medium text-foreground">{tenants.length}</span> of{' '}
            <span className="font-medium text-foreground">{total}</span> organizations (Page {page} of {totalPages})
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
              className="h-8 gap-1 text-xs"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
              className="h-8 gap-1 text-xs"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Suspend / Reactivate Confirmation Dialog */}
      <Dialog open={!!statusDialogTenant} onOpenChange={() => setStatusDialogTenant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {statusDialogTenant?.status === 'active' ? 'Suspend Workspace' : 'Reactivate Workspace'}
            </DialogTitle>
            <DialogDescription>
              {statusDialogTenant?.status === 'active'
                ? `Suspending "${statusDialogTenant?.name}" will instantly block team member logins and pause all outbound email campaigns and automations.`
                : `Reactivating "${statusDialogTenant?.name}" will restore customer login access and re-enable outbound campaigns.`}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-border/80 bg-muted/30 p-3 text-xs space-y-1">
            <p className="font-semibold text-foreground">Workspace ID:</p>
            <p className="font-mono text-muted-foreground">{statusDialogTenant?.id}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogTenant(null)}>
              Cancel
            </Button>
            <Button
              variant={statusDialogTenant?.status === 'active' ? 'destructive' : 'default'}
              onClick={confirmStatusChange}
              disabled={updateStatus.isPending}
            >
              {updateStatus.isPending ? 'Updating...' : statusDialogTenant?.status === 'active' ? 'Confirm Suspension' : 'Confirm Reactivation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plan Override Dialog */}
      <Dialog open={!!planDialogTenant} onOpenChange={() => setPlanDialogTenant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override Customer Plan</DialogTitle>
            <DialogDescription>
              Manually assign a platform tier to <strong>{planDialogTenant?.name}</strong>. This updates their
              resource limits (contacts, emails, lists, users).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Select Platform Plan</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={newPlanId}
                onChange={(e) => setNewPlanId(e.target.value)}
              >
                <option value="">-- Choose Plan --</option>
                {plans?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.billingPeriod}) - ₹{(p.priceCents / 100).toFixed(0)} - {p.planLimit?.maxContacts?.toLocaleString() || '∞'} contacts
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialogTenant(null)}>
              Cancel
            </Button>
            <Button onClick={confirmPlanChange} disabled={!newPlanId || updatePlan.isPending}>
              {updatePlan.isPending ? 'Assigning...' : 'Save Plan Assignment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tenant Detail Modal (Audit View) */}
      {selectedTenantForDetails && (
        <TenantDetailDialog
          tenantId={selectedTenantForDetails}
          onClose={() => setSelectedTenantForDetails(null)}
        />
      )}
    </div>
  );
}

function TenantDetailDialog({ tenantId, onClose }: { tenantId: string; onClose: () => void }) {
  const { data: tenant, isLoading, error } = useAdminTenant(tenantId);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Workspace Detail Audit
          </DialogTitle>
          <DialogDescription>
            Deep inspection of organization members, subscriptions, and usage stats.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            <RefreshCw className="mx-auto h-5 w-5 animate-spin text-primary mb-2" />
            Loading tenant details...
          </div>
        ) : error || !tenant ? (
          <div className="p-4 text-center text-sm text-destructive">
            Failed to load workspace detail.
          </div>
        ) : (
          <div className="space-y-5 py-2 text-sm">
            {/* Overview Banner */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-lg border border-border bg-muted/20 p-3">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="font-semibold text-foreground">{tenant.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant={tenant.status === 'active' ? 'default' : 'destructive'} className="mt-0.5 text-[10px]">
                  {tenant.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Subscribers</p>
                <p className="font-semibold font-mono text-foreground">
                  {(tenant._count?.contacts ?? 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Campaigns</p>
                <p className="font-semibold font-mono text-foreground">
                  {(tenant._count?.campaigns ?? 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Team Members */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Team Members ({tenant.users?.length || 0})
              </h4>
              <div className="rounded-lg border border-border divide-y divide-border/60 overflow-hidden">
                {tenant.users?.length === 0 ? (
                  <p className="p-3 text-xs text-muted-foreground">No users registered.</p>
                ) : (
                  tenant.users?.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-2.5 text-xs">
                      <div>
                        <div className="font-medium text-foreground">
                          {u.firstName || u.lastName ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : u.email}
                        </div>
                        <div className="text-muted-foreground font-mono text-[11px]">{u.email}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">
                          {u.userRoles?.[0]?.role?.name || 'Member'}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {u.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Subscriptions */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Active & Past Subscriptions ({tenant.subscriptions?.length || 0})
              </h4>
              <div className="rounded-lg border border-border divide-y divide-border/60 overflow-hidden">
                {tenant.subscriptions?.length === 0 ? (
                  <p className="p-3 text-xs text-muted-foreground">No formal billing subscription recorded.</p>
                ) : (
                  tenant.subscriptions?.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between p-2.5 text-xs">
                      <div>
                        <div className="font-medium text-foreground">
                          {sub.plan?.name || tenant.plan?.name || 'Standard Tier'}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Period: {sub.currentPeriodStart ? new Date(sub.currentPeriodStart).toLocaleDateString() : '—'} to{' '}
                          {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : '—'}
                        </div>
                      </div>
                      <Badge variant={sub.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                        {sub.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close Audit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
