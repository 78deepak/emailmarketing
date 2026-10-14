import { useState } from 'react';
import { User, Mail, Building, KeyRound, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  useProfile,
  useUpdateProfile,
  useChangePassword,
} from '@/features/settings/use-settings';
import { normalizeAxiosError } from '@/lib/api';
import { getUserInitials, getDisplayName } from '@/lib/user-display';

export default function ProfilePage() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();

  // Profile form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [synced, setSynced] = useState(false);

  if (profile && !synced) {
    setFirstName(profile.firstName || '');
    setLastName(profile.lastName || '');
    setSynced(true);
  }

  // Password form state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfileMutation.mutateAsync({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });
      toast.success('Profile updated successfully');
    } catch (err) {
      const parsed = normalizeAxiosError(err);
      toast.error(parsed.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) {
      toast.error('Current password is required');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }

    try {
      const res = await changePasswordMutation.mutateAsync({
        oldPassword,
        newPassword,
      });
      toast.success(res.message || 'Password changed successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const parsed = normalizeAxiosError(err);
      toast.error(parsed.message || 'Failed to change password');
    }
  };

  const displayName = profile ? getDisplayName(profile) : 'User';
  const initials = profile ? getUserInitials(profile) : 'U';

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your personal credentials, display name, and password.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-lg font-bold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold text-foreground">{displayName}</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              <span>{profile?.email}</span>
            </div>
            {profile?.tenant && (
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <Building className="h-3.5 w-3.5" />
                <span>{profile.tenant.name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {profile?.emailVerifiedAt ? (
            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Verified Email
            </Badge>
          ) : (
            <Badge variant="outline">Unverified</Badge>
          )}

          {profile?.roles && profile.roles.length > 0 && (
            <Badge variant="secondary">{profile.roles[0].name}</Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Details Form */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold">Personal Information</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Update your public display identity for team collaborators.
          </p>

          <form onSubmit={handleUpdateProfile} className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="first-name">First Name</Label>
              <Input
                id="first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                disabled={profileLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last-name">Last Name</Label>
              <Input
                id="last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                disabled={profileLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-readonly">Email Address</Label>
              <Input
                id="email-readonly"
                value={profile?.email || ''}
                disabled
                className="bg-muted text-muted-foreground cursor-not-allowed"
              />
              <p className="text-[11px] text-muted-foreground">
                Email address is linked to your tenant login identity.
              </p>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending || profileLoading}
              >
                {updateProfileMutation.isPending ? 'Saving...' : 'Update Details'}
              </Button>
            </div>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold">Security & Password</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Ensure your account is using a long, random password to stay secure.
          </p>

          <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="old-pass">Current Password</Label>
              <Input
                id="old-pass"
                type="password"
                placeholder="••••••••"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-pass">New Password</Label>
              <Input
                id="new-pass"
                type="password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-pass">Confirm New Password</Label>
              <Input
                id="confirm-pass"
                type="password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="outline"
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? 'Updating...' : 'Change Password'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
