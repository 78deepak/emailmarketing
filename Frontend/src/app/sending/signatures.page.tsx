import { useState } from 'react';
import {
  Mail,
  Plus,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  Star,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import {
  useSignatures,
  useCreateSignature,
  useUpdateSignature,
  useDeleteSignature,
  useVerifySignature,
  useSetDefaultSignature,
} from '@/features/sending/use-sending';
import { normalizeAxiosError } from '@/lib/api';
import type { Signature } from '@/types/sending';

export default function SignaturesPage() {
  const { data: rawSignatures, isLoading } = useSignatures();
  const signatures = Array.isArray(rawSignatures) ? rawSignatures : [];

  const [createOpen, setCreateOpen] = useState(false);
  const [editingSignature, setEditingSignature] = useState<Signature | null>(null);
  const [deletingSignature, setDeletingSignature] = useState<Signature | null>(null);

  const deleteMutation = useDeleteSignature();
  const verifyMutation = useVerifySignature();
  const setDefaultMutation = useSetDefaultSignature();

  const handleDelete = async () => {
    if (!deletingSignature) return;
    try {
      await deleteMutation.mutateAsync(deletingSignature.id);
      toast.success('Signature deleted');
      setDeletingSignature(null);
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  const handleVerify = async (sig: Signature) => {
    try {
      await verifyMutation.mutateAsync(sig.id);
      toast.success(`Sender "${sig.fromEmail}" verified successfully`);
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  const handleSetDefault = async (sig: Signature) => {
    try {
      await setDefaultMutation.mutateAsync(sig.id);
      toast.success(`"${sig.name}" set as default sender`);
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sender Signatures</h1>
          <p className="text-sm text-muted-foreground">
            Configure sender identities used as the 'From' and 'Reply-To' addresses in your campaigns.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Signature
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-card p-5 animate-pulse space-y-3"
            >
              <div className="h-5 w-32 rounded bg-muted" />
              <div className="h-4 w-48 rounded bg-muted/60" />
              <div className="h-4 w-28 rounded bg-muted/40" />
            </div>
          ))}
        </div>
      ) : signatures.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/60 p-12 text-center">
          <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto text-muted-foreground">
            <Mail className="h-10 w-10 stroke-1 text-primary/70 mb-1" />
            <h2 className="text-lg font-semibold text-foreground">No sender signatures yet</h2>
            <p className="text-sm">
              Add your first sender identity so your subscribers see a recognizable name and address when receiving your emails.
            </p>
            <div className="pt-3">
              <Button onClick={() => setCreateOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Signature
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {signatures.map((sig) => (
            <div
              key={sig.id}
              className="group relative flex flex-col justify-between rounded-lg border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground text-base">{sig.name}</h3>
                      {sig.isDefault && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-primary/30">
                          Default
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-foreground/90 font-medium">
                      {sig.fromName}{' '}
                      <span className="text-muted-foreground font-normal">
                        &lt;{sig.fromEmail}&gt;
                      </span>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!sig.isDefault && (
                        <DropdownMenuItem onClick={() => handleSetDefault(sig)} className="gap-2">
                          <Star className="h-4 w-4 text-amber-500" />
                          Set as Default
                        </DropdownMenuItem>
                      )}
                      {!sig.isVerified && (
                        <DropdownMenuItem onClick={() => handleVerify(sig)} className="gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-500" />
                          Verify Sender
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => setEditingSignature(sig)} className="gap-2">
                        <Pencil className="h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeletingSignature(sig)}
                        className="gap-2 text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Reply-To:</span>
                    <span className="font-mono text-foreground/80">{sig.replyTo || sig.fromEmail}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                {sig.isVerified ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Verified
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Unverified
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVerify(sig)}
                      className="h-6 px-2 text-[11px]"
                    >
                      Verify Now
                    </Button>
                  </div>
                )}

                {!sig.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSetDefault(sig)}
                    className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    Make default
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <CreateSignatureDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* Edit Dialog */}
      {editingSignature && (
        <EditSignatureDialog
          signature={editingSignature}
          open={!!editingSignature}
          onOpenChange={(open) => !open && setEditingSignature(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingSignature} onOpenChange={(open) => !open && setDeletingSignature(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Sender Signature</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete signature{' '}
              <strong className="text-foreground">{deletingSignature?.name}</strong>? Campaigns
              currently using this sender will need to be updated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeletingSignature(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Signature'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateSignatureDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState('');
  const [fromName, setFromName] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [replyTo, setReplyTo] = useState('');

  const createMutation = useCreateSignature();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !fromName.trim() || !fromEmail.trim()) {
      toast.error('Name, From Name, and From Email are required');
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        fromName: fromName.trim(),
        fromEmail: fromEmail.trim(),
        replyTo: replyTo.trim() || undefined,
      });
      toast.success('Sender signature created');
      onOpenChange(false);
      setName('');
      setFromName('');
      setFromEmail('');
      setReplyTo('');
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Sender Signature</DialogTitle>
            <DialogDescription>
              Configure a sender identity for outgoing marketing emails.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="sig-name">Internal Label / Name *</Label>
              <Input
                id="sig-name"
                placeholder="e.g. Marketing Team, Support"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                For your team's internal reference.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sig-from-name">From Name *</Label>
              <Input
                id="sig-from-name"
                placeholder="e.g. Acme Marketing, Jane Doe"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                The name subscribers see in their inbox.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sig-from-email">From Email Address *</Label>
              <Input
                id="sig-from-email"
                type="email"
                placeholder="e.g. news@yourcompany.com"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sig-reply-to">Reply-To Email (Optional)</Label>
              <Input
                id="sig-reply-to"
                type="email"
                placeholder="e.g. replies@yourcompany.com"
                value={replyTo}
                onChange={(e) => setReplyTo(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Where direct subscriber replies should be sent (defaults to From Email).
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="gap-2">
              <Send className="h-4 w-4" />
              {createMutation.isPending ? 'Creating...' : 'Save Signature'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditSignatureDialog({
  signature,
  open,
  onOpenChange,
}: {
  signature: Signature;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState(signature.name);
  const [fromName, setFromName] = useState(signature.fromName);
  const [fromEmail, setFromEmail] = useState(signature.fromEmail);
  const [replyTo, setReplyTo] = useState(signature.replyTo || '');

  const updateMutation = useUpdateSignature();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync({
        id: signature.id,
        payload: {
          name: name.trim(),
          fromName: fromName.trim(),
          fromEmail: fromEmail.trim(),
          replyTo: replyTo.trim() || undefined,
        },
      });
      toast.success('Sender signature updated');
      onOpenChange(false);
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Sender Signature</DialogTitle>
            <DialogDescription>Update details for {signature.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-sig-name">Internal Label / Name</Label>
              <Input
                id="edit-sig-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-sig-from-name">From Name</Label>
              <Input
                id="edit-sig-from-name"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-sig-from-email">From Email</Label>
              <Input
                id="edit-sig-from-email"
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-sig-reply-to">Reply-To Email</Label>
              <Input
                id="edit-sig-reply-to"
                type="email"
                value={replyTo}
                onChange={(e) => setReplyTo(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
