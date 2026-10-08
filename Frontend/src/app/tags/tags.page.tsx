import { useState } from 'react';
import { Tag as TagIcon, ShieldAlert, Plus, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

import {
  useTags,
  useCreateTag,
  useDeleteTag,
  useSuppressions,
  useCreateSuppression,
  useDeleteSuppression,
} from '@/features/tags/use-tags';
import { normalizeAxiosError } from '@/lib/api';
import type { SuppressionReason } from '@/types/tags';

export default function TagsPage() {
  const [activeTab, setActiveTab] = useState<'tags' | 'suppressions'>('tags');

  // Tag creation state
  const [newTagName, setNewTagName] = useState('');
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null);

  // Suppression creation state
  const [suppressionModalOpen, setSuppressionModalOpen] = useState(false);
  const [suppEmail, setSuppEmail] = useState('');
  const [suppReason, setSuppReason] = useState<SuppressionReason>('manual');
  const [deletingSuppId, setDeletingSuppId] = useState<string | null>(null);

  // Queries & Mutations
  const { data: tags, isLoading: tagsLoading } = useTags();
  const createTag = useCreateTag();
  const deleteTag = useDeleteTag();

  const { data: suppressions, isLoading: suppLoading } = useSuppressions();
  const createSuppression = useCreateSuppression();
  const deleteSuppression = useDeleteSuppression();

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    try {
      await createTag.mutateAsync({ name: newTagName.trim() });
      toast.success('Tag created');
      setNewTagName('');
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  const handleDeleteTag = async () => {
    if (!deletingTagId) return;
    try {
      await deleteTag.mutateAsync(deletingTagId);
      toast.success('Tag deleted');
      setDeletingTagId(null);
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  const handleCreateSuppression = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suppEmail.trim()) return;
    try {
      await createSuppression.mutateAsync({
        email: suppEmail.trim(),
        reason: suppReason,
      });
      toast.success('Email added to suppression list');
      setSuppEmail('');
      setSuppReason('manual');
      setSuppressionModalOpen(false);
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  const handleDeleteSuppression = async () => {
    if (!deletingSuppId) return;
    try {
      await deleteSuppression.mutateAsync(deletingSuppId);
      toast.success('Email removed from suppressions');
      setDeletingSuppId(null);
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  const getReasonBadge = (reason: SuppressionReason) => {
    switch (reason) {
      case 'complaint':
        return <Badge variant="destructive">Complaint / Spam</Badge>;
      case 'hard_bounce':
        return <Badge variant="destructive">Hard Bounce</Badge>;
      case 'unsubscribe':
        return <Badge variant="secondary">Unsubscribed</Badge>;
      case 'manual':
      default:
        return <Badge variant="outline">Manual Blacklist</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tags & Blacklist</h1>
        <p className="text-sm text-muted-foreground">
          Manage contact categorization tags and deliverability suppression lists.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab('tags')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'tags'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <TagIcon className="h-4 w-4" />
          <span>Tags ({tags?.length ?? 0})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('suppressions')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'suppressions'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          <span>Suppressions / Blacklist ({suppressions?.length ?? 0})</span>
        </button>
      </div>

      {/* Tab 1: Tags */}
      {activeTab === 'tags' && (
        <div className="space-y-6">
          {/* Create tag row */}
          <form
            onSubmit={handleCreateTag}
            className="flex max-w-md items-center gap-2 rounded-lg border border-border bg-card p-3"
          >
            <Input
              placeholder="New tag name (e.g. VIP, Customer, Lead)..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="text-sm"
            />
            <Button type="submit" disabled={!newTagName.trim() || createTag.isPending} className="gap-1 shrink-0">
              <Plus className="h-4 w-4" />
              <span>Add Tag</span>
            </Button>
          </form>

          {/* Tags List */}
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">All Active Tags</h2>
            {tagsLoading ? (
              <div className="flex gap-2">
                <div className="h-7 w-20 rounded bg-muted animate-pulse" />
                <div className="h-7 w-24 rounded bg-muted animate-pulse" />
                <div className="h-7 w-16 rounded bg-muted animate-pulse" />
              </div>
            ) : !tags || tags.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No tags created yet. Add one above to organize contacts.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-2 rounded-md border border-border bg-accent/40 px-3 py-1.5 text-sm"
                  >
                    <TagIcon className="h-3.5 w-3.5 text-primary" />
                    <span className="font-medium text-foreground">{t.name}</span>
                    <button
                      type="button"
                      onClick={() => setDeletingTagId(t.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                      title="Delete tag"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Suppressions */}
      {activeTab === 'suppressions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
              <span>
                Suppressed emails are automatically excluded from all campaign dispatches to safeguard domain sender reputation.
              </span>
            </div>
            <Button
              onClick={() => setSuppressionModalOpen(true)}
              variant="outline"
              className="gap-2 shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Add to Blacklist</span>
            </Button>
          </div>

          {/* Suppressions Table */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Suppressed Email</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Added Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {suppLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-4"><div className="h-4 w-40 rounded bg-muted" /></td>
                      <td className="py-4 px-4"><div className="h-5 w-24 rounded bg-muted" /></td>
                      <td className="py-4 px-4"><div className="h-4 w-24 rounded bg-muted" /></td>
                      <td className="py-4 px-4 text-right"><div className="h-8 w-16 rounded bg-muted ml-auto" /></td>
                    </tr>
                  ))
                ) : !suppressions || suppressions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-muted-foreground">
                      <ShieldAlert className="h-8 w-8 stroke-1 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm font-medium">No suppressed addresses</p>
                      <p className="text-xs">Your suppression / blacklist list is currently clean.</p>
                    </td>
                  </tr>
                ) : (
                  suppressions.map((s) => (
                    <tr key={s.id} className="hover:bg-accent/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">{s.email}</td>
                      <td className="py-3 px-4">{getReasonBadge(s.reason)}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {new Date(s.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingSuppId(s.id)}
                          className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Tag Dialog */}
      <Dialog open={!!deletingTagId} onOpenChange={(v) => !v && setDeletingTagId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Tag</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this tag? Contacts with this tag will simply have the tag unassigned.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingTagId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTag}
              disabled={deleteTag.isPending}
            >
              Delete Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Suppression Modal */}
      <Dialog open={suppressionModalOpen} onOpenChange={setSuppressionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Email to Blacklist</DialogTitle>
            <DialogDescription>
              Emails added here will never receive campaigns or transactional dispatches.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSuppression} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="supp-email">Email Address</Label>
              <Input
                id="supp-email"
                type="email"
                placeholder="suppressed@domain.com"
                value={suppEmail}
                onChange={(e) => setSuppEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="supp-reason">Reason</Label>
              <Select
                value={suppReason}
                onValueChange={(val) => setSuppReason(val as SuppressionReason)}
              >
                <SelectTrigger id="supp-reason">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual Blacklist</SelectItem>
                  <SelectItem value="hard_bounce">Hard Bounce</SelectItem>
                  <SelectItem value="complaint">Complaint / Spam</SelectItem>
                  <SelectItem value="unsubscribe">Unsubscribe Request</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSuppressionModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!suppEmail.trim() || createSuppression.isPending}>
                {createSuppression.isPending ? 'Adding...' : 'Add to Blacklist'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Suppression Dialog */}
      <Dialog open={!!deletingSuppId} onOpenChange={(v) => !v && setDeletingSuppId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove from Blacklist</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this email from suppressions? Campaigns will be permitted to send to this address again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingSuppId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSuppression}
              disabled={deleteSuppression.isPending}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
