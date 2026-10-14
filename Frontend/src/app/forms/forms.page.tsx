import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PenLine,
  Plus,
  Code2,
  Copy,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  Eye,
  Check,
  Sliders,
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
  useForms,
  useCreateForm,
  useUpdateForm,
  useDeleteForm,
} from '@/features/forms/use-forms';
import { useLists } from '@/features/lists/use-lists';
import { normalizeAxiosError } from '@/lib/api';
import type { Form, FormType } from '@/types/forms';

export default function FormsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data: formsRes, isLoading } = useForms(page, 20);
  const forms = Array.isArray(formsRes) ? formsRes : (formsRes?.data ?? []);
  const meta = !Array.isArray(formsRes) ? formsRes?.meta : undefined;

  const { data: rawLists } = useLists();
  const lists = Array.isArray(rawLists) ? rawLists : [];

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [embedForm, setEmbedForm] = useState<Form | null>(null);
  const [deletingForm, setDeletingForm] = useState<Form | null>(null);

  const updateMutation = useUpdateForm();
  const deleteMutation = useDeleteForm();

  const handleToggleActive = async (f: Form) => {
    try {
      await updateMutation.mutateAsync({
        id: f.id,
        payload: { isActive: !f.isActive },
      });
      toast.success(`Form "${f.name}" is now ${!f.isActive ? 'active' : 'inactive'}`);
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  const handleDelete = async () => {
    if (!deletingForm) return;
    try {
      await deleteMutation.mutateAsync(deletingForm.id);
      toast.success('Form deleted');
      setDeletingForm(null);
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  const totalSubmissions = forms.reduce((acc, f) => acc + (f.submissionCount || 0), 0);
  const activeFormsCount = forms.filter((f) => f.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subscription Forms</h1>
          <p className="text-sm text-muted-foreground">
            Create embedded opt-in forms, popups, and hosted landing pages to capture leads and grow your audience.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Form
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Total Forms</span>
          <div className="text-2xl font-bold text-foreground">{forms.length}</div>
          <p className="text-[11px] text-muted-foreground">Lead collection widgets</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Active Forms</span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {activeFormsCount}
          </div>
          <p className="text-[11px] text-muted-foreground">Currently accepting submissions</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Total Submissions</span>
          <div className="text-2xl font-bold text-primary">{totalSubmissions.toLocaleString()}</div>
          <p className="text-[11px] text-muted-foreground">Captured subscriber leads</p>
        </div>
      </div>

      {/* Forms Grid */}
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
      ) : forms.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/60 p-12 text-center">
          <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto text-muted-foreground">
            <PenLine className="h-10 w-10 stroke-1 text-primary/70 mb-1" />
            <h2 className="text-lg font-semibold text-foreground">No subscription forms yet</h2>
            <p className="text-sm">
              Create your first subscription form to embed on your website or share via public hosted landing link.
            </p>
            <div className="pt-3">
              <Button onClick={() => setCreateOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Form
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map((f) => {
            const list = lists.find((l) => l.id === f.listId);
            return (
              <div
                key={f.id}
                className="group flex flex-col justify-between rounded-lg border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <Link
                        to={`/app/forms/${f.id}`}
                        className="font-semibold text-foreground text-base truncate hover:text-primary transition-colors block"
                      >
                        {f.name}
                      </Link>
                      <div className="flex items-center gap-2">
                        <FormTypeBadge type={f.type} />
                        <span
                          className={`text-xs font-medium cursor-pointer ${
                            f.isActive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-muted-foreground'
                          }`}
                          onClick={() => handleToggleActive(f)}
                          title="Click to toggle active state"
                        >
                          {f.isActive ? '● Active' : '○ Inactive'}
                        </span>
                      </div>
                    </div>

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
                          onClick={() => navigate(`/app/forms/${f.id}`)}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Submissions
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate(`/app/forms/${f.id}/edit`)}
                          className="gap-2"
                        >
                          <Pencil className="h-4 w-4" />
                          Visual Builder / Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setEmbedForm(f)}
                          className="gap-2 text-primary focus:text-primary"
                        >
                          <Code2 className="h-4 w-4" />
                          Embed & Share
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleActive(f)}
                          className="gap-2"
                        >
                          <Sliders className="h-4 w-4" />
                          {f.isActive ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeletingForm(f)}
                          className="gap-2 text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Form Details */}
                  <div className="space-y-1.5 text-xs text-muted-foreground pt-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-primary/70" />
                        Target List:
                      </span>
                      <span className="font-medium text-foreground truncate max-w-[150px]">
                        {list ? list.name : 'No list assigned'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Fields:</span>
                      <span className="font-medium text-foreground">
                        {f.fields?.length || 1} fields
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Submissions:</span>
                      <Badge variant="secondary" className="text-[11px] font-mono">
                        {(f.submissionCount || 0).toLocaleString()}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEmbedForm(f)}
                    className="h-7 px-2 text-xs gap-1"
                  >
                    <Code2 className="h-3 w-3" />
                    Embed
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-7 px-2 text-xs text-primary font-medium"
                  >
                    <Link to={`/app/forms/${f.id}`}>Submissions &rarr;</Link>
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

      {/* Create Form Dialog */}
      <CreateFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        lists={lists}
      />

      {/* Embed Code Modal */}
      {embedForm && (
        <EmbedCodeDialog
          form={embedForm}
          open={!!embedForm}
          onOpenChange={(open) => !open && setEmbedForm(null)}
        />
      )}

      {/* Delete Form Dialog */}
      <Dialog open={!!deletingForm} onOpenChange={(open) => !open && setDeletingForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subscription Form</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete form{' '}
              <strong className="text-foreground">{deletingForm?.name}</strong>? Any web
              embeds will stop accepting submissions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeletingForm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Form'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FormTypeBadge({ type }: { type: FormType }) {
  switch (type) {
    case 'popup':
      return (
        <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 text-[10px] capitalize">
          Popup
        </Badge>
      );
    case 'hosted':
      return (
        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] capitalize">
          Hosted Page
        </Badge>
      );
    default:
      return (
        <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px] capitalize">
          Embedded
        </Badge>
      );
  }
}

function CreateFormDialog({
  open,
  onOpenChange,
  lists,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lists: Array<{ id: string; name: string }>;
}) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [type, setType] = useState<FormType>('embedded');
  const [listId, setListId] = useState('');

  const createMutation = useCreateForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Form name is required');
      return;
    }

    try {
      const created = await createMutation.mutateAsync({
        name: name.trim(),
        type,
        listId: listId || undefined,
        fields: [
          {
            id: 'f-email',
            name: 'email',
            label: 'Email Address',
            type: 'email',
            required: true,
            placeholder: 'you@example.com',
          },
          {
            id: 'f-first-name',
            name: 'firstName',
            label: 'First Name',
            type: 'text',
            required: false,
            placeholder: 'Jane',
          },
        ],
        settings: {
          title: name.trim(),
          description: 'Subscribe to our mailing list for news and exclusive updates.',
          buttonText: 'Subscribe Now',
          successMessage: 'Thank you for subscribing! Please check your email.',
        },
      });

      toast.success('Form created! Opening visual builder...');
      onOpenChange(false);
      navigate(`/app/forms/${created.id}/edit`);
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Subscription Form</DialogTitle>
            <DialogDescription>
              Set up a lead generation form to collect subscribers for your marketing campaigns.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="form-name">Form Name *</Label>
              <Input
                id="form-name"
                placeholder="e.g. Website Newsletter Signup"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="form-type">Form Format / Display</Label>
              <select
                id="form-type"
                aria-label="Select form format"
                value={type}
                onChange={(e) => setType(e.target.value as FormType)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="embedded">Embedded (Inline in website page)</option>
                <option value="popup">Popup Modal / Slide-in</option>
                <option value="hosted">Hosted Standalone Landing Page</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="form-list">Target Audience List (Optional)</Label>
              <select
                id="form-list"
                aria-label="Select target audience list"
                value={listId}
                onChange={(e) => setListId(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">None (create contacts without list)</option>
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground">
                Submissions will automatically be added to this list.
              </p>
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

function EmbedCodeDialog({
  form,
  open,
  onOpenChange,
}: {
  form: Form;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [activeTab, setActiveTab] = useState<'hosted' | 'iframe' | 'html'>('hosted');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const origin = window.location.origin;
  const hostedUrl = `${origin}/forms/${form.id}`;
  const iframeSnippet = `<iframe\n  src="${hostedUrl}"\n  width="100%"\n  height="480"\n  frameborder="0"\n  style="border:none; border-radius: 8px; max-width: 500px;"\n></iframe>`;

  const rawHtmlSnippet = `<form action="${origin}/api/public/forms/${form.id}/submissions" method="POST">\n  <label>Email Address</label>\n  <input type="email" name="email" required placeholder="you@example.com" />\n  <label>First Name</label>\n  <input type="text" name="firstName" placeholder="First Name" />\n  <button type="submit">Subscribe</button>\n</form>`;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            Embed & Share: {form.name}
          </DialogTitle>
          <DialogDescription>
            Share a direct public link or embed this form on any external website.
          </DialogDescription>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex rounded-md border border-border bg-muted/40 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('hosted')}
            className={`flex-1 py-1.5 rounded-sm font-medium transition-all ${
              activeTab === 'hosted'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Hosted Page Link
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('iframe')}
            className={`flex-1 py-1.5 rounded-sm font-medium transition-all ${
              activeTab === 'iframe'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Iframe Widget
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('html')}
            className={`flex-1 py-1.5 rounded-sm font-medium transition-all ${
              activeTab === 'html'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Raw HTML Form
          </button>
        </div>

        <div className="py-2">
          {activeTab === 'hosted' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                A clean standalone page hosted on your domain, ready to share on social media or email.
              </p>
              <div className="flex items-center gap-2">
                <Input value={hostedUrl} readOnly className="font-mono text-xs select-all" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(hostedUrl, 'hosted')}
                  className="shrink-0"
                >
                  {copiedKey === 'hosted' ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  asChild
                  className="shrink-0"
                  title="Open in new tab"
                >
                  <a href={hostedUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'iframe' && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Paste this iframe anywhere in your website HTML (WordPress, Webflow, Squarespace, Wix).
              </p>
              <div className="relative">
                <textarea
                  readOnly
                  rows={6}
                  value={iframeSnippet}
                  className="w-full resize-none font-mono text-xs rounded-md border border-border bg-muted/30 p-3 select-all focus:outline-none"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => copyToClipboard(iframeSnippet, 'iframe')}
                  className="absolute right-2.5 bottom-3.5 gap-1.5 text-xs shadow-xs"
                >
                  {copiedKey === 'iframe' ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  Copy Snippet
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'html' && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Fully custom raw HTML form targeting the public API endpoint.
              </p>
              <div className="relative">
                <textarea
                  readOnly
                  rows={6}
                  value={rawHtmlSnippet}
                  className="w-full resize-none font-mono text-xs rounded-md border border-border bg-muted/30 p-3 select-all focus:outline-none"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => copyToClipboard(rawHtmlSnippet, 'html')}
                  className="absolute right-2.5 bottom-3.5 gap-1.5 text-xs shadow-xs"
                >
                  {copiedKey === 'html' ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  Copy HTML
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
