import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Play,
  PauseCircle,
  Plus,
  Trash2,
  ArrowDown,
  Mail,
  Clock,
  Tag,
  ListFilter,
  XCircle,
  GitBranch,
  UserPlus,
  RefreshCw,
  Sparkles,
  ArrowUp,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import {
  useAutomation,
  useSetAutomationSteps,
  useActivateAutomation,
  usePauseAutomation,
  useEnrollContact,
  useAutomationRuns,
  useUpdateAutomation,
} from '@/features/automations/use-automations';
import { useTemplates } from '@/features/templates/use-templates';
import { useTags } from '@/features/tags/use-tags';
import { useLists } from '@/features/lists/use-lists';
import { useContacts } from '@/features/contacts/use-contacts';
import { normalizeAxiosError } from '@/lib/api';
import type { AutomationStep, StepType } from '@/types/automations';

const STEP_DEFINITIONS: Record<
  StepType,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; desc: string }
> = {
  send_email: {
    label: 'Send Email',
    icon: Mail,
    color: 'border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400',
    desc: 'Dispatches an email template to the contact',
  },
  wait: {
    label: 'Wait / Delay',
    icon: Clock,
    color: 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    desc: 'Pauses sequence before running next step',
  },
  add_tag: {
    label: 'Add Tag',
    icon: Tag,
    color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    desc: 'Applies a categorization tag to contact',
  },
  remove_tag: {
    label: 'Remove Tag',
    icon: Tag,
    color: 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400',
    desc: 'Removes a tag from the contact',
  },
  add_to_list: {
    label: 'Add to List',
    icon: ListFilter,
    color: 'border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400',
    desc: 'Subscribes contact to an audience list',
  },
  condition: {
    label: 'Check Condition',
    icon: GitBranch,
    color: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    desc: 'Branches sequence based on tag presence',
  },
  exit: {
    label: 'End Sequence',
    icon: XCircle,
    color: 'border-zinc-500/40 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
    desc: 'Terminates this automation run',
  },
};

export default function AutomationBuilderPage() {
  const { id } = useParams<{ id: string }>();

  // Queries
  const { data: automation, isLoading } = useAutomation(id);
  const { data: rawTemplates } = useTemplates({ limit: 100 });
  const templates = Array.isArray(rawTemplates)
    ? rawTemplates
    : (rawTemplates?.data ?? []);

  const { data: rawTags } = useTags();
  const tags = Array.isArray(rawTags) ? rawTags : [];

  const { data: rawLists } = useLists();
  const lists = Array.isArray(rawLists) ? rawLists : [];

  const { data: runsRes, refetch: refetchRuns } = useAutomationRuns(id, 1, 20);
  const runs = Array.isArray(runsRes) ? runsRes : (runsRes?.data ?? []);

  // State
  const [activeTab, setActiveTab] = useState<'workflow' | 'runs'>('workflow');
  const [name, setName] = useState('');
  const [steps, setSteps] = useState<AutomationStep[]>([]);
  const [addStepOpen, setAddStepOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);

  // Mutations
  const setStepsMutation = useSetAutomationSteps();
  const activateMutation = useActivateAutomation();
  const pauseMutation = usePauseAutomation();
  const updateMutation = useUpdateAutomation();

  useEffect(() => {
    if (automation) {
      setName(automation.name);
      setSteps(automation.steps ? [...automation.steps] : []);
    }
  }, [automation]);

  const handleAddStep = (stepType: StepType) => {
    const newStep: AutomationStep = {
      stepOrder: steps.length,
      stepType,
      config:
        stepType === 'send_email'
          ? { subject: 'Welcome!', templateId: templates[0]?.id || '' }
          : stepType === 'wait'
          ? { hours: 24 }
          : stepType === 'add_tag' || stepType === 'remove_tag'
          ? { tagId: tags[0]?.id || '' }
          : stepType === 'add_to_list'
          ? { listId: lists[0]?.id || '' }
          : stepType === 'condition'
          ? { kind: 'has_tag', tagId: tags[0]?.id || '', onFalse: 'exit' }
          : {},
    };

    setSteps([...steps, newStep]);
    setAddStepOpen(false);
  };

  const handleRemoveStep = (index: number) => {
    const updated = steps.filter((_, i) => i !== index).map((s, i) => ({
      ...s,
      stepOrder: i,
    }));
    setSteps(updated);
  };

  const handleMoveStep = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= steps.length) return;
    const reordered = [...steps];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    const normalized = reordered.map((s, i) => ({ ...s, stepOrder: i }));
    setSteps(normalized);
  };

  const handleUpdateStepConfig = (index: number, config: Record<string, any>) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], config };
    setSteps(updated);
  };

  const handleSaveSteps = async () => {
    if (!id) return;
    try {
      // Also update name if changed
      if (automation && name.trim() !== automation.name) {
        await updateMutation.mutateAsync({ id, payload: { name: name.trim() } });
      }

      await setStepsMutation.mutateAsync({
        id,
        payload: {
          steps: steps.map((s, i) => ({
            stepOrder: i,
            stepType: s.stepType,
            config: s.config ?? {},
          })),
        },
      });
      toast.success('Automation workflow steps saved!');
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  const handleToggleActive = async () => {
    if (!id || !automation) return;
    try {
      if (automation.status === 'active') {
        await pauseMutation.mutateAsync(id);
        toast.success('Automation paused');
      } else {
        await activateMutation.mutateAsync(id);
        toast.success('Automation activated! Now listening for trigger events.');
      }
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  if (isLoading || !automation) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground animate-pulse text-sm">Loading automation workflow...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link to="/app/automations">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 text-base font-semibold max-w-[280px] sm:max-w-[360px]"
              />
              <Badge
                variant={automation.status === 'active' ? 'default' : 'outline'}
                className={
                  automation.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : ''
                }
              >
                {automation.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Trigger: <strong className="text-foreground">{automation.triggerType}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEnrollOpen(true)}
            className="gap-1.5"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Enroll Contact
          </Button>

          <Button
            variant={automation.status === 'active' ? 'outline' : 'secondary'}
            size="sm"
            onClick={handleToggleActive}
            className="gap-1.5"
          >
            {automation.status === 'active' ? (
              <>
                <PauseCircle className="h-3.5 w-3.5 text-amber-500" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 text-emerald-500" />
                Activate
              </>
            )}
          </Button>

          <Button
            size="sm"
            onClick={handleSaveSteps}
            disabled={setStepsMutation.isPending}
            className="gap-1.5"
          >
            <Save className="h-3.5 w-3.5" />
            {setStepsMutation.isPending ? 'Saving...' : 'Save Steps'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-6 text-sm font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('workflow')}
            className={`border-b-2 py-2.5 transition-colors ${
              activeTab === 'workflow'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Workflow Canvas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('runs')}
            className={`border-b-2 py-2.5 transition-colors ${
              activeTab === 'runs'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Execution Runs ({runs.length})
          </button>
        </nav>
      </div>

      {/* Workflow Canvas */}
      {activeTab === 'workflow' && (
        <div className="flex flex-col items-center py-6">
          {/* 1. Root Trigger Block */}
          <div className="w-full max-w-md rounded-xl border-2 border-primary/40 bg-card p-4 shadow-sm text-center relative">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary block mb-1">
              Trigger Entry Point
            </span>
            <div className="flex items-center justify-center gap-2 text-foreground font-semibold text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>{automation.triggerType.replace(/_/g, ' ').toUpperCase()}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Subscribers enter this workflow whenever this event fires.
            </p>
          </div>

          {/* Connector arrow */}
          <div className="flex flex-col items-center my-2">
            <div className="w-0.5 h-6 bg-border" />
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Steps Sequence */}
          <div className="w-full max-w-md space-y-4">
            {steps.map((step, idx) => {
              const def = STEP_DEFINITIONS[step.stepType] ?? {
                label: step.stepType,
                icon: GitBranch,
                color: 'border-border bg-card text-foreground',
                desc: '',
              };
              const StepIcon = def.icon;

              return (
                <div key={idx} className="flex flex-col items-center">
                  <div className="w-full rounded-xl border border-border bg-card p-4 shadow-xs relative space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                          {idx + 1}
                        </span>
                        <div className={`p-1 rounded-md border ${def.color}`}>
                          <StepIcon className="h-4 w-4" />
                        </div>
                        <span className="font-semibold text-sm text-foreground">{def.label}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={idx === 0}
                          onClick={() => handleMoveStep(idx, idx - 1)}
                          className="h-6 w-6 text-muted-foreground"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={idx === steps.length - 1}
                          onClick={() => handleMoveStep(idx, idx + 1)}
                          className="h-6 w-6 text-muted-foreground"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveStep(idx)}
                          className="h-6 w-6 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Step Configuration In-Place Form */}
                    <div className="rounded-md bg-muted/30 p-2.5 text-xs space-y-2 border border-border/60">
                      {step.stepType === 'send_email' && (
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <span className="text-[11px] text-muted-foreground">Template:</span>
                            <select
                              aria-label="Email Template"
                              value={step.config?.templateId || ''}
                              onChange={(e) =>
                                handleUpdateStepConfig(idx, {
                                  ...step.config,
                                  templateId: e.target.value,
                                })
                              }
                              className="w-full h-8 rounded border border-border bg-background px-2 text-xs"
                            >
                              <option value="">Choose template...</option>
                              {templates.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[11px] text-muted-foreground">Subject Line:</span>
                            <Input
                              value={step.config?.subject || ''}
                              onChange={(e) =>
                                handleUpdateStepConfig(idx, {
                                  ...step.config,
                                  subject: e.target.value,
                                })
                              }
                              className="h-8 text-xs"
                              placeholder="Email subject..."
                            />
                          </div>
                        </div>
                      )}

                      {step.stepType === 'wait' && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-muted-foreground">Delay for:</span>
                          <Input
                            type="number"
                            min="1"
                            value={step.config?.hours || 24}
                            onChange={(e) =>
                              handleUpdateStepConfig(idx, {
                                ...step.config,
                                hours: parseInt(e.target.value, 10) || 1,
                              })
                            }
                            className="h-8 w-20 text-xs"
                          />
                          <span className="text-xs text-muted-foreground">hours</span>
                        </div>
                      )}

                      {(step.stepType === 'add_tag' || step.stepType === 'remove_tag') && (
                        <div className="space-y-1">
                          <span className="text-[11px] text-muted-foreground">Target Tag:</span>
                          <select
                            aria-label="Target Tag"
                            value={step.config?.tagId || ''}
                            onChange={(e) =>
                              handleUpdateStepConfig(idx, {
                                ...step.config,
                                tagId: e.target.value,
                              })
                            }
                            className="w-full h-8 rounded border border-border bg-background px-2 text-xs"
                          >
                            <option value="">Select a tag...</option>
                            {tags.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {step.stepType === 'add_to_list' && (
                        <div className="space-y-1">
                          <span className="text-[11px] text-muted-foreground">Target List:</span>
                          <select
                            aria-label="Target List"
                            value={step.config?.listId || ''}
                            onChange={(e) =>
                              handleUpdateStepConfig(idx, {
                                ...step.config,
                                listId: e.target.value,
                              })
                            }
                            className="w-full h-8 rounded border border-border bg-background px-2 text-xs"
                          >
                            <option value="">Select a list...</option>
                            {lists.map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {step.stepType === 'condition' && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] text-muted-foreground">Check if contact has tag:</span>
                          <select
                            aria-label="Condition Tag"
                            value={step.config?.tagId || ''}
                            onChange={(e) =>
                              handleUpdateStepConfig(idx, {
                                ...step.config,
                                tagId: e.target.value,
                              })
                            }
                            className="w-full h-8 rounded border border-border bg-background px-2 text-xs"
                          >
                            <option value="">Select tag to check...</option>
                            {tags.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {step.stepType === 'exit' && (
                        <p className="text-[11px] text-muted-foreground italic">
                          Workflow terminates successfully here.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Inter-step connector */}
                  {idx < steps.length - 1 && (
                    <div className="flex flex-col items-center my-2">
                      <div className="w-0.5 h-6 bg-border" />
                      <ArrowDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Step Connector */}
          <div className="flex flex-col items-center my-2">
            <div className="w-0.5 h-6 bg-border" />
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Add Step Button */}
          <Button
            onClick={() => setAddStepOpen(true)}
            variant="outline"
            className="w-full max-w-md border-dashed border-2 py-6 gap-2 text-sm text-muted-foreground hover:text-foreground hover:border-primary"
          >
            <Plus className="h-4 w-4" />
            Add Action Step
          </Button>
        </div>
      )}

      {/* Tab: Runs */}
      {activeTab === 'runs' && (
        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground text-sm">Recent Execution Runs</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchRuns()}
              className="gap-1 text-xs"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </Button>
          </div>

          {runs.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No contacts have run through this automation yet. Enroll a contact manually to test.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-border text-muted-foreground bg-muted/30">
                  <tr>
                    <th className="py-2.5 px-3">Contact</th>
                    <th className="py-2.5 px-3">Run Status</th>
                    <th className="py-2.5 px-3">Current Step</th>
                    <th className="py-2.5 px-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {runs.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/10">
                      <td className="py-2 px-3 font-medium text-foreground">
                        {r.contact?.email || r.contactId}
                      </td>
                      <td className="py-2 px-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] capitalize ${
                            r.status === 'completed'
                              ? 'text-emerald-600 border-emerald-500/30 bg-emerald-500/10'
                              : r.status === 'failed'
                              ? 'text-destructive border-destructive/30 bg-destructive/10'
                              : 'text-blue-600 border-blue-500/30 bg-blue-500/10'
                          }`}
                        >
                          {r.status}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-muted-foreground">
                        Step #{r.currentStepOrder + 1}
                      </td>
                      <td className="py-2 px-3 text-muted-foreground">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Step Modal */}
      <Dialog open={addStepOpen} onOpenChange={setAddStepOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Action Step</DialogTitle>
            <DialogDescription>
              Choose an action to execute at this point in the workflow.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-2 py-3">
            {(Object.keys(STEP_DEFINITIONS) as StepType[]).map((key) => {
              const item = STEP_DEFINITIONS[key];
              const ItemIcon = item.icon;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleAddStep(key)}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 text-left transition-all hover:border-primary/50 hover:bg-muted/30"
                >
                  <div className={`p-2 rounded-md border ${item.color}`}>
                    <ItemIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-xs text-foreground block">
                      {item.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {item.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddStepOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Enroll Modal */}
      {enrollOpen && (
        <EnrollContactDialog
          automationId={automation.id}
          automationName={automation.name}
          open={enrollOpen}
          onOpenChange={setEnrollOpen}
        />
      )}
    </div>
  );
}

function EnrollContactDialog({
  automationId,
  automationName,
  open,
  onOpenChange,
}: {
  automationId: string;
  automationName: string;
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
        id: automationId,
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
              Test or trigger <strong className="text-foreground">{automationName}</strong> for a specific subscriber.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="builder-enroll-contact">Choose Contact</Label>
              <select
                id="builder-enroll-contact"
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
