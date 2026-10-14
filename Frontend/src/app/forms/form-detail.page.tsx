import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Code2,
  Copy,
  Check,
  ExternalLink,
  Pencil,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import {
  useForm,
  useFormSubmissions,
  useUpdateForm,
} from '@/features/forms/use-forms';
import { useLists } from '@/features/lists/use-lists';
import { normalizeAxiosError } from '@/lib/api';

export default function FormDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [page, setPage] = useState(1);
  const [embedOpen, setEmbedOpen] = useState(false);

  // Queries
  const { data: form, isLoading: isFormLoading } = useForm(id);
  const { data: submissionsRes, isLoading: isSubmissionsLoading, refetch } = useFormSubmissions(id, page, 20);
  const { data: rawLists } = useLists();
  const lists = Array.isArray(rawLists) ? rawLists : [];

  const submissions = Array.isArray(submissionsRes)
    ? submissionsRes
    : (submissionsRes?.data ?? []);
  const meta = !Array.isArray(submissionsRes) ? submissionsRes?.meta : undefined;

  const updateMutation = useUpdateForm();

  const handleToggleActive = async () => {
    if (!form) return;
    try {
      await updateMutation.mutateAsync({
        id: form.id,
        payload: { isActive: !form.isActive },
      });
      toast.success(`Form is now ${!form.isActive ? 'active' : 'inactive'}`);
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  if (isFormLoading || !form) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground animate-pulse text-sm">Loading form details...</p>
      </div>
    );
  }

  const list = lists.find((l) => l.id === form.listId);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild className="h-7 w-7 -ml-2">
              <Link to="/app/forms">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{form.name}</h1>
            <Badge variant="outline" className="text-[10px] capitalize">
              {form.type}
            </Badge>
            <span
              className={`text-xs font-medium cursor-pointer ${
                form.isActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-muted-foreground'
              }`}
              onClick={handleToggleActive}
              title="Click to toggle"
            >
              {form.isActive ? '● Active' : '○ Inactive'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground pl-7">
            Created on {new Date(form.createdAt).toLocaleDateString()} &bull;{' '}
            {form.fields?.length || 1} fields configured
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEmbedOpen(true)}
            className="gap-1.5"
          >
            <Code2 className="h-3.5 w-3.5 text-primary" />
            Embed & Share
          </Button>

          <Button size="sm" asChild className="gap-1.5">
            <Link to={`/app/forms/${form.id}/edit`}>
              <Pencil className="h-3.5 w-3.5" />
              Edit Builder
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Headline Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Total Submissions</span>
          <div className="text-2xl font-bold text-primary">
            {(form.submissionCount || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground">All-time lead captures</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Target Audience List</span>
          <div className="text-base font-semibold text-foreground truncate">
            {list ? list.name : 'No List (Direct Contact)'}
          </div>
          <p className="text-[11px] text-muted-foreground">Submissions auto-subscribed</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Form Format</span>
          <div className="text-base font-semibold text-foreground capitalize">
            {form.type} Widget
          </div>
          <p className="text-[11px] text-muted-foreground">Delivery mode</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Status</span>
          <div
            className={`text-base font-semibold ${
              form.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
            }`}
          >
            {form.isActive ? 'Accepting Submissions' : 'Closed / Disabled'}
          </div>
          <p className="text-[11px] text-muted-foreground">Accepting incoming leads</p>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="font-semibold text-foreground text-sm">Form Submissions Log</h3>
            <p className="text-xs text-muted-foreground">
              Real-time records of every subscriber who submitted this form.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()} className="h-7 text-xs gap-1">
            <RefreshCw className="h-3 w-3" />
            Refresh
          </Button>
        </div>

        {isSubmissionsLoading ? (
          <div className="space-y-2 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-muted animate-pulse" />
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            No submissions recorded yet. Share your hosted form or embed it on your website to start capturing subscribers.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-border text-muted-foreground bg-muted/30">
                <tr>
                  <th className="py-2.5 px-3">Subscriber Email</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Captured Data</th>
                  <th className="py-2.5 px-3">IP Address</th>
                  <th className="py-2.5 px-3">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {submissions.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/10">
                    <td className="py-2.5 px-3 font-medium text-foreground">
                      {s.contact?.email || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {s.contact?.firstName || s.contact?.lastName
                        ? `${s.contact?.firstName ?? ''} ${s.contact?.lastName ?? ''}`.trim()
                        : '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      {s.data && Object.keys(s.data).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(s.data).map(([k, v]) => (
                            <span
                              key={k}
                              className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground"
                            >
                              {k}: {String(v)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground font-mono text-[11px]">
                      {s.ipAddress || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {new Date(s.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {meta && meta.pages > 1 && (
              <div className="flex items-center justify-between pt-4 text-xs text-muted-foreground">
                <span>
                  Page {meta.page} of {meta.pages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= meta.pages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Embed Modal */}
      {embedOpen && (
        <EmbedModal form={form} open={embedOpen} onOpenChange={setEmbedOpen} />
      )}
    </div>
  );
}

function EmbedModal({
  form,
  open,
  onOpenChange,
}: {
  form: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);
  const origin = window.location.origin;
  const hostedUrl = `${origin}/forms/${form.id}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(hostedUrl);
    setCopied(true);
    toast.success('Hosted form URL copied');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Embed & Share Form</DialogTitle>
          <DialogDescription>
            Share this link directly or embed it in an iframe.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-foreground">Public Hosted Page URL</span>
            <div className="flex items-center gap-2">
              <Input value={hostedUrl} readOnly className="font-mono text-xs select-all" />
              <Button variant="outline" size="icon" onClick={copyUrl} className="shrink-0">
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button variant="secondary" size="icon" asChild className="shrink-0">
                <a href={hostedUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
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
