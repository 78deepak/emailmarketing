import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Send,
  Plus,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  PauseCircle,
  XCircle,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  Users,
  BarChart2,
  Play,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { Label } from '@/components/ui/label';

import {
  useCampaigns,
  useDuplicateCampaign,
  useDeleteCampaign,
  useScheduleCampaign,
  useUnscheduleCampaign,
  usePauseCampaign,
  useResumeCampaign,
  useCancelCampaign,
} from '@/features/campaigns/use-campaigns';
import { normalizeAxiosError } from '@/lib/api';
import type { Campaign, CampaignStatus } from '@/types/campaigns';

const STATUS_TABS: Array<{ label: string; value: 'all' | CampaignStatus }> = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Sending', value: 'sending' },
  { label: 'Sent', value: 'sent' },
  { label: 'Paused', value: 'paused' },
];

export default function CampaignsPage() {
  const navigate = useNavigate();

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CampaignStatus>('all');
  const [page, setPage] = useState(1);

  // Modals
  const [schedulingCampaign, setSchedulingCampaign] = useState<Campaign | null>(null);
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null);

  // Queries & Mutations
  const queryParams = {
    page,
    limit: 12,
    search: search.trim() || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  };

  const { data: campaignsRes, isLoading } = useCampaigns(queryParams);
  const campaigns = Array.isArray(campaignsRes)
    ? campaignsRes
    : (campaignsRes?.data ?? []);
  const meta = !Array.isArray(campaignsRes) ? campaignsRes?.meta : undefined;

  const duplicateMutation = useDuplicateCampaign();
  const deleteMutation = useDeleteCampaign();
  const unscheduleMutation = useUnscheduleCampaign();
  const pauseMutation = usePauseCampaign();
  const resumeMutation = useResumeCampaign();
  const cancelMutation = useCancelCampaign();

  const handleDuplicate = async (c: Campaign) => {
    try {
      const dup = await duplicateMutation.mutateAsync(c.id);
      toast.success(`Duplicated as "${dup.name}"`);
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  const handleDelete = async () => {
    if (!deletingCampaign) return;
    try {
      await deleteMutation.mutateAsync(deletingCampaign.id);
      toast.success('Campaign deleted');
      setDeletingCampaign(null);
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  const handlePause = async (c: Campaign) => {
    try {
      await pauseMutation.mutateAsync(c.id);
      toast.success('Campaign paused');
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  const handleResume = async (c: Campaign) => {
    try {
      await resumeMutation.mutateAsync(c.id);
      toast.success('Campaign resumed');
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  const handleUnschedule = async (c: Campaign) => {
    try {
      await unscheduleMutation.mutateAsync(c.id);
      toast.success('Campaign unscheduled back to draft');
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  const handleCancel = async (c: Campaign) => {
    try {
      await cancelMutation.mutateAsync(c.id);
      toast.success('Campaign cancelled');
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email Campaigns</h1>
          <p className="text-sm text-muted-foreground">
            Create, schedule, and track broadcast email campaigns to your audience.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/app/campaigns/new">
            <Plus className="h-4 w-4" />
            Create Campaign
          </Link>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 rounded-lg border border-border bg-card p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search campaigns by name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-muted/30 p-1 text-xs">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-sm font-medium transition-all ${
                statusFilter === tab.value
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Campaigns Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-card p-5 animate-pulse space-y-3"
            >
              <div className="h-5 w-40 rounded bg-muted" />
              <div className="h-4 w-56 rounded bg-muted/60" />
              <div className="pt-4 flex justify-between">
                <div className="h-5 w-20 rounded bg-muted" />
                <div className="h-5 w-16 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/60 p-12 text-center">
          <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto text-muted-foreground">
            <Send className="h-10 w-10 stroke-1 text-primary/70 mb-1" />
            <h2 className="text-lg font-semibold text-foreground">No campaigns found</h2>
            <p className="text-sm">
              {search || statusFilter !== 'all'
                ? 'Try modifying your filters or search keywords.'
                : 'Create and schedule your first broadcast email campaign to engage with your subscribers.'}
            </p>
            <div className="pt-3">
              <Button asChild className="gap-2">
                <Link to="/app/campaigns/new">
                  <Plus className="h-4 w-4" />
                  Create Campaign
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="group flex flex-col justify-between rounded-lg border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/app/campaigns/${c.id}`}
                        className="font-semibold text-foreground text-base truncate hover:text-primary transition-colors"
                      >
                        {c.name}
                      </Link>
                    </div>
                    <p className="text-xs text-muted-foreground truncate" title={c.subject}>
                      Subject: {c.subject}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <CampaignStatusBadge status={c.status} />

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
                          onClick={() => navigate(`/app/campaigns/${c.id}`)}
                          className="gap-2"
                        >
                          <BarChart2 className="h-4 w-4" />
                          Analytics & Details
                        </DropdownMenuItem>

                        {(c.status === 'draft' || c.status === 'paused') && (
                          <DropdownMenuItem
                            onClick={() => navigate(`/app/campaigns/${c.id}/edit`)}
                            className="gap-2"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit Campaign
                          </DropdownMenuItem>
                        )}

                        {c.status === 'draft' && (
                          <DropdownMenuItem
                            onClick={() => setSchedulingCampaign(c)}
                            className="gap-2 text-primary focus:text-primary"
                          >
                            <Calendar className="h-4 w-4" />
                            Schedule / Send
                          </DropdownMenuItem>
                        )}

                        {c.status === 'scheduled' && (
                          <DropdownMenuItem
                            onClick={() => handleUnschedule(c)}
                            className="gap-2"
                          >
                            <RotateCcw className="h-4 w-4" />
                            Unschedule (Return to Draft)
                          </DropdownMenuItem>
                        )}

                        {(c.status === 'scheduled' || c.status === 'sending') && (
                          <DropdownMenuItem
                            onClick={() => handlePause(c)}
                            className="gap-2 text-amber-600 focus:text-amber-600"
                          >
                            <PauseCircle className="h-4 w-4" />
                            Pause
                          </DropdownMenuItem>
                        )}

                        {c.status === 'paused' && (
                          <DropdownMenuItem
                            onClick={() => handleResume(c)}
                            className="gap-2 text-emerald-600 focus:text-emerald-600"
                          >
                            <Play className="h-4 w-4" />
                            Resume Sending
                          </DropdownMenuItem>
                        )}

                        {(c.status === 'draft' || c.status === 'scheduled' || c.status === 'paused') && (
                          <DropdownMenuItem
                            onClick={() => handleCancel(c)}
                            className="gap-2 text-destructive focus:text-destructive"
                          >
                            <XCircle className="h-4 w-4" />
                            Cancel Campaign
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem onClick={() => handleDuplicate(c)} className="gap-2">
                          <Copy className="h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeletingCampaign(c)}
                          className="gap-2 text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Audience & Sender Details */}
                <div className="space-y-1.5 text-xs text-muted-foreground pt-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-primary/70" />
                      Audience:
                    </span>
                    <span className="font-medium text-foreground truncate max-w-[150px]">
                      {c.list?.name || c.segment?.name || 'All Subscribers'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Recipients:</span>
                    <span className="font-medium text-foreground">
                      {c.recipientCount.toLocaleString()} contacts
                    </span>
                  </div>
                  {c.template && (
                    <div className="flex items-center justify-between">
                      <span>Template:</span>
                      <span className="font-medium text-foreground truncate max-w-[150px]">
                        {c.template.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {c.sentAt
                    ? `Sent ${new Date(c.sentAt).toLocaleDateString()}`
                    : c.scheduledAt
                    ? `Scheduled ${new Date(c.scheduledAt).toLocaleDateString()}`
                    : `Created ${new Date(c.createdAt).toLocaleDateString()}`}
                </span>

                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-7 px-2 text-xs text-primary hover:text-primary font-medium"
                >
                  <Link to={`/app/campaigns/${c.id}`}>View Details &rarr;</Link>
                </Button>
              </div>
            </div>
          ))}
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

      {/* Schedule Dialog */}
      {schedulingCampaign && (
        <ScheduleCampaignDialog
          campaign={schedulingCampaign}
          open={!!schedulingCampaign}
          onOpenChange={(open) => !open && setSchedulingCampaign(null)}
        />
      )}

      {/* Delete Dialog */}
      <Dialog open={!!deletingCampaign} onOpenChange={(open) => !open && setDeletingCampaign(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Campaign</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete campaign{' '}
              <strong className="text-foreground">{deletingCampaign?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeletingCampaign(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Campaign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  switch (status) {
    case 'scheduled':
      return (
        <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 gap-1 text-[10px] font-medium">
          <Calendar className="h-3 w-3" />
          Scheduled
        </Badge>
      );
    case 'sending':
      return (
        <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 text-[10px] font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          Sending
        </Badge>
      );
    case 'sent':
      return (
        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 text-[10px] font-medium">
          <CheckCircle2 className="h-3 w-3" />
          Sent
        </Badge>
      );
    case 'paused':
      return (
        <Badge className="bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30 gap-1 text-[10px] font-medium">
          <PauseCircle className="h-3 w-3" />
          Paused
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge variant="destructive" className="gap-1 text-[10px] font-medium">
          <XCircle className="h-3 w-3" />
          Cancelled
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-muted-foreground border-border text-[10px] font-medium">
          Draft
        </Badge>
      );
  }
}

function ScheduleCampaignDialog({
  campaign,
  open,
  onOpenChange,
}: {
  campaign: Campaign;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [scheduledAt, setScheduledAt] = useState(() => {
    // Default to 15 minutes in future in local datetime string
    const d = new Date(Date.now() + 15 * 60 * 1000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });

  const scheduleMutation = useScheduleCampaign();

  const handleSendNow = async () => {
    try {
      // Current ISO timestamp triggers immediate pickup by campaign poller
      await scheduleMutation.mutateAsync({
        id: campaign.id,
        payload: { scheduledAt: new Date().toISOString() },
      });
      toast.success('Campaign scheduled for immediate sending!');
      onOpenChange(false);
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const iso = new Date(scheduledAt).toISOString();
      await scheduleMutation.mutateAsync({
        id: campaign.id,
        payload: { scheduledAt: iso },
      });
      toast.success(`Campaign scheduled for ${new Date(iso).toLocaleString()}`);
      onOpenChange(false);
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSchedule}>
          <DialogHeader>
            <DialogTitle>Schedule Campaign</DialogTitle>
            <DialogDescription>
              Choose when <strong className="text-foreground">{campaign.name}</strong> will be dispatched to your recipients.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Target Audience:</span>
                <span className="font-semibold text-foreground">
                  {campaign.list?.name || campaign.segment?.name || 'All Contacts'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subject:</span>
                <span className="font-medium text-foreground truncate max-w-[200px]">{campaign.subject}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="schedule-time">Dispatch Date & Time</Label>
              <Input
                id="schedule-time"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
              />
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-border">
              <span className="text-xs text-muted-foreground">Or dispatch immediately:</span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleSendNow}
                disabled={scheduleMutation.isPending}
                className="gap-1.5 text-xs"
              >
                <Send className="h-3.5 w-3.5" />
                Send Right Now
              </Button>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={scheduleMutation.isPending} className="gap-1.5">
              <Calendar className="h-4 w-4" />
              {scheduleMutation.isPending ? 'Scheduling...' : 'Confirm Schedule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
