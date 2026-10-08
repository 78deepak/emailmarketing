import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap,
  Plus,
  Play,
  PauseCircle,
  Pencil,
  Trash2,
  UserPlus,
  CheckCircle2,
  MoreHorizontal,
  GitBranch,
  ArrowRight,
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
  useAutomations,
  useCreateAutomation,
  useActivateAutomation,
  usePauseAutomation,
  useDeleteAutomation,
  useEnrollContact,
} from '@/features/automations/use-automations';
import { useContacts } from '@/features/contacts/use-contacts';
import { normalizeAxiosError } from '@/lib/api';
import type { Automation, AutomationStatus, AutomationStep, TriggerType } from '@/types/automations';

const TRIGGER_LABELS: Record<TriggerType, { label: string; icon: string; desc: string }> = {
  contact_created: {
    label: 'Contact Created',
    icon: '👤',
    desc: 'Runs immediately when a new contact is added',
  },
  contact_added_to_list: {
    label: 'Added to List',
    icon: '📋',
    desc: 'Runs when subscriber joins a specific list',
  },
  email_opened: {
    label: 'Email Opened',
    icon: '👀',
    desc: 'Triggers when recipient opens a marketing message',
  },
  email_clicked: {
    label: 'Link Clicked',
    icon: '🔗',
    desc: 'Triggers when recipient clicks a link in email',
  },
  form_submitted: {
    label: 'Form Submitted',
    icon: '📝',
    desc: 'Runs when a web opt-in form is submitted',
  },
  manual: {
    label: 'Manual Trigger',
    icon: '⚡',
    desc: 'Runs only when enrolled manually or via API',
  },
};

export default function AutomationsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data: automationsRes, isLoading } = useAutomations(page, 20);
  const automations = Array.isArray(automationsRes)
    ? automationsRes
    : (automationsRes?.data ?? []);
  const meta = !Array.isArray(automationsRes) ? automationsRes?.meta : undefined;

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [enrollingAutomation, setEnrollingAutomation] = useState<Automation | null>(null);
  const [deletingAutomation, setDeletingAutomation] = useState<Automation | null>(null);

  const activateMutation = useActivateAutomation();
  const pauseMutation = usePauseAutomation();
  const deleteMutation = useDeleteAutomation();

  const handleActivate = async (a: Automation) => {
    try {
      await activateMutation.mutateAsync(a.id);
      toast.success(`Automation "${a.name}" is now active!`);
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  const handlePause = async (a: Automation) => {
    try {
      await pauseMutation.mutateAsync(a.id);
      toast.success(`Automation "${a.name}" paused.`);
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  const handleDelete = async () => {
    if (!deletingAutomation) return;
    try {
      await deleteMutation.mutateAsync(deletingAutomation.id);
      toast.success('Automation deleted');
      setDeletingAutomation(null);
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Marketing Automations</h1>
          <p className="text-sm text-muted-foreground">
            Build event-driven drip campaigns, onboarding sequences, and subscriber workflows.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Automation
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-card p-5 animate-pulse space-y-3"
            >
              <div className="h-5 w-36 rounded bg-muted" />
              <div className="h-4 w-48 rounded bg-muted/60" />
            </div>
          ))}
        </div>
      ) : automations.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/60 p-12 text-center">
          <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto text-muted-foreground">
            <Zap className="h-10 w-10 stroke-1 text-primary/70 mb-1" />
            <h2 className="text-lg font-semibold text-foreground">No automated workflows yet</h2>
            <p className="text-sm">
              Create an automated sequence to send targeted welcome emails, delay follow-ups, and update subscriber tags automatically.
            </p>
            <div className="pt-3">
              <Button onClick={() => setCreateOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Automation
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {automations.map((a) => {
            const triggerInfo = (TRIGGER_LABELS as Record<string, { label: string; icon: string; desc: string }>)[a.triggerType] ?? {
              label: a.triggerType,
              icon: '⚡',
              desc: '',
            };
            return (
              <div
                key={a.id}
                className="group flex flex-col justify-between rounded-lg border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <Link
                        to={`/app/automations/${a.id}`}
                        className="font-semibold text-foreground text-base truncate hover:text-primary transition-colors block"
                      >
                        {a.name}
                      </Link>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{triggerInfo.icon}</span>
                        <span>Trigger: <strong>{triggerInfo.label}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <AutomationStatusBadge status={a.status} />

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground -mr-2"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => navigate(`/app/automations/${a.id}`)}
                            className="gap-2"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit Workflow & Steps
                          </DropdownMenuItem>

                          {a.status !== 'active' ? (
                            <DropdownMenuItem
                              onClick={() => handleActivate(a)}
                              className="gap-2 text-emerald-600 focus:text-emerald-600"
                            >
                              <Play className="h-4 w-4" />
                              Activate Workflow
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handlePause(a)}
                              className="gap-2 text-amber-600 focus:text-amber-600"
                            >
                              <PauseCircle className="h-4 w-4" />
                              Pause Workflow
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem
                            onClick={() => setEnrollingAutomation(a)}
                            className="gap-2"
                          >
                            <UserPlus className="h-4 w-4" />
                            Enroll Contact Manually
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeletingAutomation(a)}
                            className="gap-2 text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Steps summary */}
                  <div className="pt-2">
                    <div className="rounded-md border border-border/70 bg-muted/20 p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-medium text-foreground">
                        <span className="flex items-center gap-1.5">
                          <GitBranch className="h-3.5 w-3.5 text-primary" />
                          Workflow Steps:
                        </span>
                        <span>{a.steps?.length ?? 0} steps configured</span>
                      </div>

                      {a.steps && a.steps.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground pt-1">
                          {a.steps.slice(0, 3).map((st: AutomationStep, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5"
                            >
                              {st.stepType.replace('_', ' ')}
                              {idx < Math.min(a.steps.length - 1, 2) && (
                                <ArrowRight className="h-2.5 w-2.5 opacity-60 ml-0.5" />
                              )}
                            </span>
                          ))}
                          {a.steps.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{a.steps.length - 3} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted-foreground italic">
                          No steps added yet &mdash; click edit to configure flow.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Created {new Date(a.createdAt).toLocaleDateString()}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-7 px-2 text-xs text-primary font-medium"
                  >
                    <Link to={`/app/automations/${a.id}`}>Edit Flow &rarr;</Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.pages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
          <span>
            Page {meta.page} of {meta.pages} ({meta.total} total)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create Automation Dialog */}
      <CreateAutomationDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* Manual Enroll Modal */}
      {enrollingAutomation && (
        <EnrollContactDialog
          automation={enrollingAutomation}
          open={!!enrollingAutomation}
          onOpenChange={(open) => !open && setEnrollingAutomation(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingAutomation} onOpenChange={(open) => !open && setDeletingAutomation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Automation</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete workflow{' '}
              <strong className="text-foreground">{deletingAutomation?.name}</strong>? All
              in-flight runs and step configurations will be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeletingAutomation(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Automation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AutomationStatusBadge({ status }: { status: AutomationStatus }) {
  if (status === 'active') {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 text-[10px]">
        <CheckCircle2 className="h-3 w-3" />
        Active
      </Badge>
    );
  }
  if (status === 'paused') {
    return (
      <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 text-[10px]">
        <PauseCircle className="h-3 w-3" />
        Paused
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground border-border text-[10px]">
      Draft
    </Badge>
  );
}

function CreateAutomationDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState<TriggerType>('contact_created');

  const createMutation = useCreateAutomation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Automation name is required');
      return;
    }

    try {
      const created = await createMutation.mutateAsync({
        name: name.trim(),
        triggerType,
      });
      toast.success('Automation created');
      onOpenChange(false);
      navigate(`/app/automations/${created.id}`);
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Marketing Automation</DialogTitle>
            <DialogDescription>
              Set up a triggered sequence for automated emails and subscriber lifecycle updates.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="auto-name">Automation Name *</Label>
              <Input
                id="auto-name"
                placeholder="e.g. New User Welcome Drip"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="auto-trigger">Trigger Event *</Label>
              <select
                id="auto-trigger"
                aria-label="Select trigger event"
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value as TriggerType)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {Object.entries(TRIGGER_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.icon} {v.label} &mdash; {v.desc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Continue to Builder &rarr;'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EnrollContactDialog({
  automation,
  open,
  onOpenChange,
}: {
  automation: Automation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selectedContactId, setSelectedContactId] = useState('');
  const { data: contactsRes } = useContacts({ limit: 100 });
  const contacts = Array.isArray(contactsRes) ? contactsRes : (contactsRes?.data ?? []);

  const enrollMutation = useEnrollContact();

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContactId) {
      toast.error('Please select a contact');
      return;
    }

    try {
      const res = await enrollMutation.mutateAsync({
        id: automation.id,
        payload: { contactId: selectedContactId },
      });
      toast.success(res.message);
      onOpenChange(false);
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleEnroll}>
          <DialogHeader>
            <DialogTitle>Enroll Contact Manually</DialogTitle>
            <DialogDescription>
              Test or trigger the workflow <strong className="text-foreground">{automation.name}</strong> for a specific subscriber.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="enroll-contact">Choose Contact</Label>
              <select
                id="enroll-contact"
                aria-label="Select Contact to Enroll"
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                required
              >
                <option value="">Select a subscriber...</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.email} {c.firstName ? `(${c.firstName})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={enrollMutation.isPending}>
              {enrollMutation.isPending ? 'Enrolling...' : 'Enroll Contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
