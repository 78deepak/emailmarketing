import { useState } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Users,
  Mail,
  ListFilter,
  Server,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  useAdminPlans,
  useCreatePlan,
  useUpdatePlan,
  useDeletePlan,
} from '@/features/admin/use-admin';
import type { Plan } from '@/types/billing';
import type { CreateAdminPlanPayload, UpdateAdminPlanPayload } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export default function PlansPage() {
  const { data: plans, isLoading } = useAdminPlans();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null);

  // Create form state
  const [createForm, setCreateForm] = useState<CreateAdminPlanPayload>({
    name: '',
    code: '',
    priceCents: 0,
    billingPeriod: 'monthly',
    isActive: true,
    maxContacts: 10000,
    maxLists: 20,
    maxEmailsMonth: 100000,
    maxEmailsDay: 10000,
    maxUsers: 5,
    maxCampaigns: 50,
    maxAutomations: 10,
    dedicatedIp: false,
    aiEnabled: true,
  });

  // Edit form state
  const [editForm, setEditForm] = useState<UpdateAdminPlanPayload>({});

  const handleOpenEdit = (p: Plan) => {
    setEditingPlan(p);
    setEditForm({
      name: p.name,
      priceCents: p.priceCents,
      billingPeriod: (p.billingPeriod as 'monthly' | 'yearly') || 'monthly',
      isActive: p.isActive ?? true,
      maxContacts: p.planLimit?.maxContacts ?? 10000,
      maxLists: p.planLimit?.maxLists ?? 20,
      maxEmailsMonth: p.planLimit?.maxEmailsMonth ?? 100000,
      maxEmailsDay: p.planLimit?.maxEmailsDay ?? 10000,
      maxUsers: p.planLimit?.maxUsers ?? 5,
      maxCampaigns: p.planLimit?.maxCampaigns ?? 50,
      maxAutomations: p.planLimit?.maxAutomations ?? 10,
      dedicatedIp: p.planLimit?.dedicatedIp ?? false,
      aiEnabled: p.planLimit?.aiEnabled ?? true,
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.code) {
      toast.error('Plan name and code are required');
      return;
    }

    try {
      await createPlan.mutateAsync(createForm);
      toast.success(`Plan "${createForm.name}" created successfully`);
      setCreateDialogOpen(false);
      setCreateForm({
        name: '',
        code: '',
        priceCents: 0,
        billingPeriod: 'monthly',
        isActive: true,
        maxContacts: 10000,
        maxLists: 20,
        maxEmailsMonth: 100000,
        maxEmailsDay: 10000,
        maxUsers: 5,
        maxCampaigns: 50,
        maxAutomations: 10,
        dedicatedIp: false,
        aiEnabled: true,
      });
    } catch (err) {
      toast.error(normalizeAxiosError(err).message || 'Failed to create plan');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    try {
      await updatePlan.mutateAsync({
        id: editingPlan.id,
        ...editForm,
      });
      toast.success(`Plan "${editingPlan.name}" updated successfully`);
      setEditingPlan(null);
    } catch (err) {
      toast.error(normalizeAxiosError(err).message || 'Failed to update plan');
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deletingPlan) return;
    try {
      await deletePlan.mutateAsync(deletingPlan.id);
      toast.success(`Plan "${deletingPlan.name}" deleted`);
      setDeletingPlan(null);
    } catch (err) {
      toast.error(normalizeAxiosError(err).message || 'Failed to delete plan');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Subscription Plans & Quotas
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure subscription tiers, dispatch rate limits, audience caps, and AI feature flags.
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="self-start sm:self-auto gap-2">
          <Plus className="h-4 w-4" />
          Create New Plan
        </Button>
      </div>

      {/* Plan Cards Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 animate-pulse rounded-xl bg-card border border-border" />
          ))}
        </div>
      ) : plans?.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Layers className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold text-foreground">No Plans Configured</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Get started by creating your first subscription tier for customer workspaces.
          </p>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create First Plan
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans?.map((plan) => (
            <div
              key={plan.id}
              className="relative flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
            >
              <div>
                {/* Title & Status */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                    <div className="text-xs font-mono text-muted-foreground">{plan.code}</div>
                  </div>
                  <Badge variant={plan.isActive ? 'default' : 'secondary'} className="capitalize text-[11px]">
                    {plan.isActive ? 'Active' : 'Archived'}
                  </Badge>
                </div>

                {/* Price Display */}
                <div className="mt-4 mb-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-foreground">
                      ₹{((plan.priceCents || 0) / 100).toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      / {plan.billingPeriod || 'month'}
                    </span>
                  </div>
                </div>

                {/* Quota Limits List */}
                <div className="space-y-2.5 border-t border-border/80 pt-4 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      Contact Capacity
                    </span>
                    <span className="font-semibold text-foreground font-mono">
                      {plan.planLimit?.maxContacts?.toLocaleString() || 'Unlimited'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      Emails / Month
                    </span>
                    <span className="font-semibold text-foreground font-mono">
                      {plan.planLimit?.maxEmailsMonth?.toLocaleString() || 'Unlimited'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <ListFilter className="h-3.5 w-3.5" />
                      Contact Lists
                    </span>
                    <span className="font-semibold text-foreground font-mono">
                      {plan.planLimit?.maxLists?.toLocaleString() || 'Unlimited'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Zap className="h-3.5 w-3.5" />
                      Automations
                    </span>
                    <span className="font-semibold text-foreground font-mono">
                      {plan.planLimit?.maxAutomations?.toLocaleString() || 'Unlimited'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Server className="h-3.5 w-3.5" />
                      Dedicated IP
                    </span>
                    <span className={plan.planLimit?.dedicatedIp ? 'font-semibold text-emerald-600' : 'text-muted-foreground'}>
                      {plan.planLimit?.dedicatedIp ? 'Included' : 'Shared Pool'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Sparkles className="h-3.5 w-3.5" />
                      AI Subject & Copy
                    </span>
                    <span className={plan.planLimit?.aiEnabled ? 'font-semibold text-purple-600' : 'text-muted-foreground'}>
                      {plan.planLimit?.aiEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-6 flex items-center justify-end gap-2 border-t border-border/80 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1"
                  onClick={() => handleOpenEdit(plan)}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit Tier
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-destructive hover:bg-destructive/10"
                  onClick={() => setDeletingPlan(plan)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Plan Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Subscription Plan</DialogTitle>
            <DialogDescription>
              Add a new commercial plan with resource allocations and monthly/annual pricing.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="create-name">Plan Name</Label>
                <Input
                  id="create-name"
                  placeholder="e.g. Growth Pro"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-code">Unique Slug / Code</Label>
                <Input
                  id="create-code"
                  placeholder="e.g. growth-pro-monthly"
                  value={createForm.code}
                  onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="create-price">Price in Rupees (₹)</Label>
                <Input
                  id="create-price"
                  type="number"
                  placeholder="2999"
                  value={createForm.priceCents / 100}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      priceCents: Math.round(parseFloat(e.target.value || '0') * 100),
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-period">Billing Cadence</Label>
                <select
                  id="create-period"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={createForm.billingPeriod}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      billingPeriod: e.target.value as 'monthly' | 'yearly',
                    })
                  }
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            <div className="border-t border-border/80 pt-3">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Resource Quotas</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Max Contacts</Label>
                  <Input
                    type="number"
                    value={createForm.maxContacts ?? ''}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        maxContacts: parseInt(e.target.value || '0', 10),
                      })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Max Monthly Emails</Label>
                  <Input
                    type="number"
                    value={createForm.maxEmailsMonth ?? ''}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        maxEmailsMonth: parseInt(e.target.value || '0', 10),
                      })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Max Lists</Label>
                  <Input
                    type="number"
                    value={createForm.maxLists ?? ''}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        maxLists: parseInt(e.target.value || '0', 10),
                      })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Max Team Members</Label>
                  <Input
                    type="number"
                    value={createForm.maxUsers ?? ''}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        maxUsers: parseInt(e.target.value || '0', 10),
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border/80 pt-3 flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createForm.dedicatedIp}
                  onChange={(e) => setCreateForm({ ...createForm, dedicatedIp: e.target.checked })}
                  className="rounded border-input text-primary focus:ring-primary"
                />
                <span className="text-xs font-medium">Dedicated Sending IP</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createForm.aiEnabled}
                  onChange={(e) => setCreateForm({ ...createForm, aiEnabled: e.target.checked })}
                  className="rounded border-input text-primary focus:ring-primary"
                />
                <span className="text-xs font-medium">AI Writing Assistant</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createForm.isActive}
                  onChange={(e) => setCreateForm({ ...createForm, isActive: e.target.checked })}
                  className="rounded border-input text-primary focus:ring-primary"
                />
                <span className="text-xs font-medium">Active (Visible to users)</span>
              </label>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createPlan.isPending}>
                {createPlan.isPending ? 'Creating Plan...' : 'Create Plan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog */}
      <Dialog open={!!editingPlan} onOpenChange={() => setEditingPlan(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Plan: {editingPlan?.name}</DialogTitle>
            <DialogDescription>
              Update price, limits, and quotas for this subscription tier.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Plan Name</Label>
                <Input
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Price in Rupees (₹)</Label>
                <Input
                  type="number"
                  value={((editForm.priceCents || 0) / 100).toString()}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      priceCents: Math.round(parseFloat(e.target.value || '0') * 100),
                    })
                  }
                  required
                />
              </div>
            </div>

            <div className="border-t border-border/80 pt-3">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Resource Quotas</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Max Contacts</Label>
                  <Input
                    type="number"
                    value={editForm.maxContacts ?? ''}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        maxContacts: parseInt(e.target.value || '0', 10),
                      })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Max Monthly Emails</Label>
                  <Input
                    type="number"
                    value={editForm.maxEmailsMonth ?? ''}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        maxEmailsMonth: parseInt(e.target.value || '0', 10),
                      })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Max Lists</Label>
                  <Input
                    type="number"
                    value={editForm.maxLists ?? ''}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        maxLists: parseInt(e.target.value || '0', 10),
                      })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Max Team Members</Label>
                  <Input
                    type="number"
                    value={editForm.maxUsers ?? ''}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        maxUsers: parseInt(e.target.value || '0', 10),
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border/80 pt-3 flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.dedicatedIp}
                  onChange={(e) => setEditForm({ ...editForm, dedicatedIp: e.target.checked })}
                  className="rounded border-input text-primary focus:ring-primary"
                />
                <span className="text-xs font-medium">Dedicated Sending IP</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.aiEnabled}
                  onChange={(e) => setEditForm({ ...editForm, aiEnabled: e.target.checked })}
                  className="rounded border-input text-primary focus:ring-primary"
                />
                <span className="text-xs font-medium">AI Writing Assistant</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                  className="rounded border-input text-primary focus:ring-primary"
                />
                <span className="text-xs font-medium">Active (Visible to users)</span>
              </label>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setEditingPlan(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updatePlan.isPending}>
                {updatePlan.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingPlan} onOpenChange={() => setDeletingPlan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Plan: {deletingPlan?.name}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this plan? If existing tenants are subscribed to this plan,
              you should de-activate it instead so current subscriptions remain intact.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingPlan(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSubmit} disabled={deletePlan.isPending}>
              {deletePlan.isPending ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
