import { useState } from 'react';
import {
  Building2,
  Users,
  Shield,
  Palette,
  UserPlus,
  Trash2,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useTenant,
  useUpdateTenant,
  useTeamMembers,
  useInviteMember,
  useDeactivateMember,
  useRoles,
} from '@/features/settings/use-settings';
import { normalizeAxiosError } from '@/lib/api';

type Tab = 'workspace' | 'team' | 'branding' | 'roles';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('workspace');

  // Hooks
  const { data: tenant, isLoading: tenantLoading } = useTenant();
  const updateTenantMutation = useUpdateTenant();

  const { data: teamData, isLoading: teamLoading } = useTeamMembers();
  const teamMembers = teamData?.data || [];
  const inviteMemberMutation = useInviteMember();
  const deactivateMemberMutation = useDeactivateMember();

  const { data: roles = [] } = useRoles();

  // Form states
  const [workspaceName, setWorkspaceName] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [removeBranding, setRemoveBranding] = useState(false);
  const [footerText, setFooterText] = useState('');

  // Sync initial tenant data when loaded
  const [tenantSynced, setTenantSynced] = useState(false);
  if (tenant && !tenantSynced) {
    setWorkspaceName(tenant.name || '');
    setCustomDomain(tenant.whiteLabel?.customDomain || '');
    setRemoveBranding(tenant.whiteLabel?.removeBranding || false);
    setFooterText(tenant.whiteLabel?.footerText || '');
    setTenantSynced(true);
  }

  // Invite modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteRoleId, setInviteRoleId] = useState('');

  // Member to deactivate
  const [memberToDeactivate, setMemberToDeactivate] = useState<string | null>(null);

  const handleSaveWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) {
      toast.error('Workspace name cannot be empty');
      return;
    }
    try {
      await updateTenantMutation.mutateAsync({
        name: workspaceName.trim(),
      });
      toast.success('Workspace details updated successfully');
    } catch (err) {
      const parsed = normalizeAxiosError(err);
      toast.error(parsed.message || 'Failed to update workspace');
    }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateTenantMutation.mutateAsync({
        whiteLabel: {
          customDomain: customDomain.trim() || undefined,
          removeBranding,
          footerText: footerText.trim() || undefined,
        },
      });
      toast.success('White-label branding saved successfully');
    } catch (err) {
      const parsed = normalizeAxiosError(err);
      toast.error(parsed.message || 'Failed to save branding');
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error('Email address is required');
      return;
    }
    try {
      await inviteMemberMutation.mutateAsync({
        email: inviteEmail.trim(),
        firstName: inviteFirstName.trim() || undefined,
        lastName: inviteLastName.trim() || undefined,
        roleId: inviteRoleId || undefined,
      });
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteModalOpen(false);
      setInviteEmail('');
      setInviteFirstName('');
      setInviteLastName('');
      setInviteRoleId('');
    } catch (err) {
      const parsed = normalizeAxiosError(err);
      toast.error(parsed.message || 'Failed to send invite');
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!memberToDeactivate) return;
    try {
      await deactivateMemberMutation.mutateAsync(memberToDeactivate);
      toast.success('Team member removed from workspace');
      setMemberToDeactivate(null);
    } catch (err) {
      const parsed = normalizeAxiosError(err);
      toast.error(parsed.message || 'Failed to deactivate member');
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Workspace Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your organization profile, team members, white-label branding, and security roles.
        </p>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('workspace')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'workspace'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Building2 className="h-4 w-4" />
          General & Workspace
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'team'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="h-4 w-4" />
          Team Members
          {teamMembers.length > 0 && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              {teamMembers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'branding'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Palette className="h-4 w-4" />
          White-Label & Branding
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'roles'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Shield className="h-4 w-4" />
          Roles & Permissions
        </button>
      </div>

      {/* TAB 1: WORKSPACE & GENERAL */}
      {activeTab === 'workspace' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-base font-semibold">Organization Profile</h3>
            <p className="text-xs text-muted-foreground">
              Basic information identifying your workspace and tenant instance.
            </p>

            <form onSubmit={handleSaveWorkspace} className="mt-5 space-y-4 max-w-lg">
              <div className="space-y-2">
                <Label htmlFor="tenant-name">Workspace Name</Label>
                <Input
                  id="tenant-name"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  disabled={tenantLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenant-slug">Workspace Slug / Identifier</Label>
                <Input
                  id="tenant-slug"
                  value={tenant?.slug || ''}
                  disabled
                  className="bg-muted font-mono text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  Unique system identifier for tenant scoping.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={updateTenantMutation.isPending || tenantLoading}
                >
                  {updateTenantMutation.isPending ? 'Saving...' : 'Save Workspace Changes'}
                </Button>
              </div>
            </form>
          </div>

          {/* Tenant Status & Plan Card */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-base font-semibold">Instance Health & Status</h3>
            <p className="text-xs text-muted-foreground">
              Current operational telemetry and health metrics.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <span className="text-xs text-muted-foreground">Workspace Status</span>
                <div className="mt-1 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold capitalize text-foreground">
                    {tenant?.status || 'Active'}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <span className="text-xs text-muted-foreground">Account Bounce Rate</span>
                <div className="mt-1 text-base font-semibold">
                  {tenant?.bounceRate !== null && tenant?.bounceRate !== undefined
                    ? `${(tenant.bounceRate * 100).toFixed(1)}%`
                    : '0.0%'}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <span className="text-xs text-muted-foreground">Member Since</span>
                <div className="mt-1 text-base font-semibold">
                  {tenant?.createdAt
                    ? new Date(tenant.createdAt).toLocaleDateString(undefined, {
                        dateStyle: 'medium',
                      })
                    : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEAM MEMBERS */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold">Workspace Collaborators</h3>
              <p className="text-xs text-muted-foreground">
                Invite colleagues and team members to manage campaigns and contacts.
              </p>
            </div>

            <Button
              size="sm"
              className="flex items-center gap-2"
              onClick={() => setInviteModalOpen(true)}
            >
              <UserPlus className="h-4 w-4" />
              Invite Member
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            {teamLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Loading team members...
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No collaborators found. Invite your first team member above!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Member</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Joined / Invited</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {teamMembers.map((member) => {
                      const name =
                        [member.firstName, member.lastName].filter(Boolean).join(' ') ||
                        member.email;
                      const initials = name
                        .split(' ')
                        .map((p: string) => p[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2);

                      return (
                        <tr key={member.id} className="hover:bg-muted/20">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-foreground">{name}</div>
                                <div className="text-xs text-muted-foreground">{member.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 flex-wrap">
                              {member.roles && member.roles.length > 0 ? (
                                member.roles.map((r: { id: string; name: string }) => (
                                  <Badge key={r.id} variant="outline" className="text-xs">
                                    {r.name}
                                  </Badge>
                                ))
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  Member
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              className={
                                member.status === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                              }
                            >
                              {member.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {new Date(member.createdAt).toLocaleDateString(undefined, {
                              dateStyle: 'medium',
                            })}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => setMemberToDeactivate(member.id)}
                            >
                              <Trash2 className="h-4 w-4" />
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
      )}

      {/* TAB 3: WHITE-LABEL & BRANDING */}
      {activeTab === 'branding' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-base font-semibold">Custom Branding & White-Label</h3>
            <p className="text-xs text-muted-foreground">
              Customize unsubscribe links, public subscription pages, and email footer branding.
            </p>

            <form onSubmit={handleSaveBranding} className="mt-5 space-y-5 max-w-lg">
              <div className="space-y-2">
                <Label htmlFor="custom-domain">Custom Tracking Subdomain</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="custom-domain"
                    className="pl-9"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="e.g. mail.yourbrand.com"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Branded link for click tracking and hosted opt-in forms.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="footer-text">Custom Footer Disclaimer</Label>
                <textarea
                  id="footer-text"
                  rows={2}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  placeholder="e.g. © 2026 Acme Corp. All rights reserved. 123 Street, City."
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="remove-branding"
                  checked={removeBranding}
                  onChange={(e) => setRemoveBranding(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <Label htmlFor="remove-branding" className="cursor-pointer text-sm font-normal">
                  Remove "Powered by Email Marketing" badge from emails and forms
                </Label>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={updateTenantMutation.isPending}
                >
                  {updateTenantMutation.isPending ? 'Saving...' : 'Save Branding'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: ROLES & PERMISSIONS */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-semibold">Security Roles & Permissions</h3>
            <p className="text-xs text-muted-foreground">
              Inspect access control levels assigned to users across your workspace.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {roles.map((role) => (
              <div
                key={role.id}
                className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold text-foreground">{role.name}</h4>
                  </div>
                  {role.isSystem && (
                    <Badge variant="outline" className="text-[10px]">
                      System Default
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  {role.description || 'Predefined workspace access profile.'}
                </p>

                <div className="border-t border-border/60 pt-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Permissions ({role.permissions.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {role.permissions.slice(0, 8).map((perm) => (
                      <Badge
                        key={perm}
                        variant="secondary"
                        className="font-mono text-[10px] bg-muted/60"
                      >
                        {perm}
                      </Badge>
                    ))}
                    {role.permissions.length > 8 && (
                      <Badge variant="secondary" className="text-[10px]">
                        +{role.permissions.length - 8} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Member Dialog */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Invite Team Member
            </DialogTitle>
            <DialogDescription>
              Enter the email address and assign an initial access role for your collaborator.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendInvite} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address *</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="invite-first">First Name</Label>
                <Input
                  id="invite-first"
                  placeholder="Jane"
                  value={inviteFirstName}
                  onChange={(e) => setInviteFirstName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-last">Last Name</Label>
                <Input
                  id="invite-last"
                  placeholder="Doe"
                  value={inviteLastName}
                  onChange={(e) => setInviteLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-role">Assign Role</Label>
              <select
                id="invite-role"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={inviteRoleId}
                onChange={(e) => setInviteRoleId(e.target.value)}
              >
                <option value="">Standard Member</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setInviteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={inviteMemberMutation.isPending}
              >
                {inviteMemberMutation.isPending ? 'Sending...' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deactivate Member Dialog */}
      <Dialog
        open={!!memberToDeactivate}
        onOpenChange={(open) => !open && setMemberToDeactivate(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Remove Team Member
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this collaborator from your workspace? They will immediately lose access to contacts, campaigns, and sending features.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              variant="outline"
              disabled={deactivateMemberMutation.isPending}
              onClick={() => setMemberToDeactivate(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deactivateMemberMutation.isPending}
              onClick={handleConfirmDeactivate}
            >
              {deactivateMemberMutation.isPending ? 'Removing...' : 'Confirm Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
