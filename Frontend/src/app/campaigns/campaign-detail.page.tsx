import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Send,
  PauseCircle,
  Play,
  RotateCcw,
  XCircle,
  Pencil,
  Users,
  Eye,
  MousePointer,
  AlertTriangle,
  MailCheck,
  CheckCircle2,
  Monitor,
  Smartphone,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import {
  useCampaign,
  useCampaignAnalytics,
  useCampaignRecipients,
  useCampaignPreview,
  useScheduleCampaign,
  useUnscheduleCampaign,
  usePauseCampaign,
  useResumeCampaign,
  useCancelCampaign,
} from '@/features/campaigns/use-campaigns';
import { normalizeAxiosError } from '@/lib/api';
import type { CampaignStatus } from '@/types/campaigns';

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [activeTab, setActiveTab] = useState<'overview' | 'recipients' | 'preview'>('overview');
  const [recipientPage, setRecipientPage] = useState(1);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [scheduleOpen, setScheduleOpen] = useState(false);

  // Queries
  const { data: campaign, isLoading: isCampaignLoading } = useCampaign(id);
  const { data: analytics, refetch: refetchAnalytics } = useCampaignAnalytics(id);
  const { data: recipientsRes, isLoading: isRecipientsLoading } = useCampaignRecipients(id, recipientPage, 20);
  const { data: previewData } = useCampaignPreview(id);

  const recipients = Array.isArray(recipientsRes)
    ? recipientsRes
    : (recipientsRes?.data ?? []);
  const recipientMeta = !Array.isArray(recipientsRes) ? recipientsRes?.meta : undefined;

  // Mutations
  const unscheduleMutation = useUnscheduleCampaign();
  const pauseMutation = usePauseCampaign();
  const resumeMutation = useResumeCampaign();
  const cancelMutation = useCancelCampaign();

  const handlePause = async () => {
    if (!id) return;
    try {
      await pauseMutation.mutateAsync(id);
      toast.success('Campaign paused');
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  const handleResume = async () => {
    if (!id) return;
    try {
      await resumeMutation.mutateAsync(id);
      toast.success('Campaign resumed');
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  const handleUnschedule = async () => {
    if (!id) return;
    try {
      await unscheduleMutation.mutateAsync(id);
      toast.success('Campaign unscheduled back to draft');
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    try {
      await cancelMutation.mutateAsync(id);
      toast.success('Campaign cancelled');
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  if (isCampaignLoading || !campaign) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground animate-pulse text-sm">Loading campaign details...</p>
      </div>
    );
  }

  const totals = analytics?.totals;
  const rates = analytics?.rates;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild className="h-7 w-7 -ml-2">
              <Link to="/app/campaigns">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{campaign.name}</h1>
            <StatusBadge status={campaign.status} />
          </div>
          <p className="text-sm text-muted-foreground pl-7">
            Subject: <strong className="text-foreground">{campaign.subject}</strong>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {campaign.status === 'draft' && (
            <>
              <Button variant="outline" size="sm" asChild className="gap-1.5">
                <Link to={`/app/campaigns/${campaign.id}/edit`}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit Campaign
                </Link>
              </Button>
              <Button size="sm" onClick={() => setScheduleOpen(true)} className="gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Schedule / Send
              </Button>
            </>
          )}

          {campaign.status === 'scheduled' && (
            <>
              <Button variant="outline" size="sm" onClick={handleUnschedule} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                Unschedule
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePause}
                className="gap-1.5 text-amber-600 dark:text-amber-400"
              >
                <PauseCircle className="h-3.5 w-3.5" />
                Pause
              </Button>
              <Button variant="destructive" size="sm" onClick={handleCancel} className="gap-1.5">
                <XCircle className="h-3.5 w-3.5" />
                Cancel
              </Button>
            </>
          )}

          {campaign.status === 'sending' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePause}
              className="gap-1.5 text-amber-600 dark:text-amber-400"
            >
              <PauseCircle className="h-3.5 w-3.5" />
              Pause Sending
            </Button>
          )}

          {campaign.status === 'paused' && (
            <>
              <Button size="sm" onClick={handleResume} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                <Play className="h-3.5 w-3.5" />
                Resume Sending
              </Button>
              <Button variant="destructive" size="sm" onClick={handleCancel} className="gap-1.5">
                <XCircle className="h-3.5 w-3.5" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* KPI Headline Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <MetricCard
          label="Total Recipients"
          value={totals?.totalRecipients ?? campaign.recipientCount}
          subtext="Resolved contacts"
          icon={Users}
        />
        <MetricCard
          label="Delivered"
          value={totals?.delivered ?? 0}
          rate={`${rates?.deliveryRate ?? 0}%`}
          subtext="Delivery rate"
          icon={MailCheck}
        />
        <MetricCard
          label="Unique Opens"
          value={totals?.uniqueOpens ?? 0}
          rate={`${rates?.openRate ?? 0}%`}
          subtext="Unique open rate"
          icon={Eye}
        />
        <MetricCard
          label="Clicks"
          value={totals?.clicks ?? 0}
          rate={`${rates?.clickRate ?? 0}%`}
          subtext="Click-through rate"
          icon={MousePointer}
        />
        <MetricCard
          label="Bounces"
          value={totals?.bounces ?? 0}
          rate={`${rates?.bounceRate ?? 0}%`}
          subtext="Bounce rate"
          icon={AlertTriangle}
          alert={(rates?.bounceRate ?? 0) > 5}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-6 text-sm font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`border-b-2 py-3 transition-colors ${
              activeTab === 'overview'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Overview & Metrics
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('recipients')}
            className={`border-b-2 py-3 transition-colors ${
              activeTab === 'recipients'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Recipients ({campaign.recipientCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`border-b-2 py-3 transition-colors ${
              activeTab === 'preview'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Email Preview
          </button>
        </nav>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Funnel Breakdown */}
            <div className="rounded-lg border border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground text-sm">Delivery & Engagement Funnel</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refetchAnalytics()}
                  className="h-7 text-xs gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  Refresh
                </Button>
              </div>

              <div className="space-y-3">
                <FunnelBar
                  label="Sent Emails"
                  count={totals?.sent ?? 0}
                  total={totals?.totalRecipients ?? campaign.recipientCount}
                  color="bg-blue-500"
                />
                <FunnelBar
                  label="Delivered Inboxes"
                  count={totals?.delivered ?? 0}
                  total={totals?.sent || 1}
                  color="bg-emerald-500"
                />
                <FunnelBar
                  label="Opened Messages"
                  count={totals?.uniqueOpens ?? 0}
                  total={totals?.delivered || 1}
                  color="bg-indigo-500"
                />
                <FunnelBar
                  label="Clicked Links"
                  count={totals?.clicks ?? 0}
                  total={totals?.delivered || 1}
                  color="bg-violet-500"
                />
              </div>

              <div className="pt-4 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-muted-foreground">
                <div>
                  <span className="block text-[11px]">Total Opens:</span>
                  <strong className="text-foreground text-sm">{totals?.opens ?? 0}</strong>
                </div>
                <div>
                  <span className="block text-[11px]">Unsubscribes:</span>
                  <strong className="text-foreground text-sm">{totals?.unsubscribes ?? 0}</strong>
                </div>
                <div>
                  <span className="block text-[11px]">Spam Complaints:</span>
                  <strong className="text-foreground text-sm">{totals?.complaints ?? 0}</strong>
                </div>
                <div>
                  <span className="block text-[11px]">Failed Deliveries:</span>
                  <strong className="text-foreground text-sm">{totals?.bounces ?? 0}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Campaign Parameters */}
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-5 space-y-4 text-xs">
              <h3 className="font-semibold text-foreground text-sm border-b border-border pb-2">
                Campaign Summary
              </h3>

              <div className="space-y-2.5">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Sender Identity</span>
                  <span className="font-medium text-foreground">
                    {campaign.signature?.name || campaign.fromName || 'Default'}
                  </span>
                  <span className="text-muted-foreground block font-mono text-[11px]">
                    &lt;{campaign.signature?.fromEmail || campaign.fromEmail || 'system'}&gt;
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">Target Audience</span>
                  <span className="font-medium text-foreground">
                    {campaign.list?.name
                      ? `List: ${campaign.list.name}`
                      : campaign.segment?.name
                      ? `Segment: ${campaign.segment.name}`
                      : 'All Contacts'}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">Assigned Template</span>
                  <span className="font-medium text-foreground">
                    {campaign.template?.name || 'Custom / None'}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">Timeline</span>
                  <div className="text-foreground space-y-0.5">
                    <div>Created: {new Date(campaign.createdAt).toLocaleString()}</div>
                    {campaign.scheduledAt && (
                      <div>Scheduled: {new Date(campaign.scheduledAt).toLocaleString()}</div>
                    )}
                    {campaign.sentAt && (
                      <div>Dispatched: {new Date(campaign.sentAt).toLocaleString()}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Recipients */}
      {activeTab === 'recipients' && (
        <div className="space-y-4 rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground text-sm">Resolved Recipients</h3>
            <span className="text-xs text-muted-foreground">
              Total {recipientMeta?.total ?? campaign.recipientCount} contacts
            </span>
          </div>

          {isRecipientsLoading ? (
            <div className="space-y-2 py-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 rounded bg-muted animate-pulse" />
              ))}
            </div>
          ) : recipients.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs">
              No recipients resolved for this campaign yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-border text-muted-foreground bg-muted/30">
                  <tr>
                    <th className="py-2.5 px-3">Subscriber Email</th>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Delivery Status</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {recipients.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/10">
                      <td className="py-2 px-3 font-medium text-foreground">{r.email}</td>
                      <td className="py-2 px-3 text-muted-foreground">
                        {r.contact?.firstName || r.contact?.lastName
                          ? `${r.contact?.firstName ?? ''} ${r.contact?.lastName ?? ''}`.trim()
                          : '—'}
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {r.status}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-muted-foreground">
                        {r.sentAt ? new Date(r.sentAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {recipientMeta && recipientMeta.pages > 1 && (
                <div className="flex items-center justify-between pt-4 text-xs text-muted-foreground">
                  <span>Page {recipientMeta.page} of {recipientMeta.pages}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={recipientPage <= 1}
                      onClick={() => setRecipientPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={recipientPage >= recipientMeta.pages}
                      onClick={() => setRecipientPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Email Preview */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-card p-3 rounded-lg border border-border">
            <div className="text-xs text-muted-foreground">
              Previewing template with mock contact variables (e.g. <code>&#123;&#123;firstName&#125;&#125;</code>)
            </div>

            <div className="flex rounded-md border border-border bg-muted/40 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setPreviewViewport('desktop')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-sm font-medium transition-all ${
                  previewViewport === 'desktop'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Monitor className="h-3.5 w-3.5" />
                Desktop
              </button>
              <button
                type="button"
                onClick={() => setPreviewViewport('mobile')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-sm font-medium transition-all ${
                  previewViewport === 'mobile'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                Mobile
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center p-6 bg-muted/20 rounded-lg border border-border overflow-hidden">
            <div
              className={`transition-all duration-200 bg-white rounded-lg shadow-md border border-border overflow-hidden ${
                previewViewport === 'desktop' ? 'w-full max-w-[640px] h-[650px]' : 'w-[375px] h-[650px]'
              }`}
            >
              {previewData?.html ? (
                <iframe
                  srcDoc={previewData.html}
                  title="Campaign Email Preview"
                  className="w-full h-full border-0"
                  sandbox="allow-same-origin allow-scripts"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-xs p-8 text-center">
                  No rendered template HTML available for this campaign.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      <ScheduleCampaignDialog
        campaignId={campaign.id}
        campaignName={campaign.name}
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
      />
    </div>
  );
}

function MetricCard({
  label,
  value,
  rate,
  subtext,
  icon: Icon,
  alert,
}: {
  label: string;
  value: number;
  rate?: string;
  subtext: string;
  icon: React.ComponentType<{ className?: string }>;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 space-y-2 bg-card ${
        alert ? 'border-destructive/50 bg-destructive/5' : 'border-border'
      }`}
    >
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs font-medium">{label}</span>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {value.toLocaleString()}
          </span>
          {rate && (
            <span
              className={`text-xs font-semibold ${
                alert ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {rate}
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">{subtext}</p>
      </div>
    </div>
  );
}

function FunnelBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const percent = total > 0 ? Math.min(100, Math.round((count / total) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="font-mono text-muted-foreground">
          {count.toLocaleString()} ({percent}%)
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: CampaignStatus }) {
  switch (status) {
    case 'scheduled':
      return (
        <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 gap-1 text-[11px]">
          <Calendar className="h-3 w-3" />
          Scheduled
        </Badge>
      );
    case 'sending':
      return (
        <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 text-[11px]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          Sending
        </Badge>
      );
    case 'sent':
      return (
        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 text-[11px]">
          <CheckCircle2 className="h-3 w-3" />
          Sent
        </Badge>
      );
    case 'paused':
      return (
        <Badge className="bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30 gap-1 text-[11px]">
          <PauseCircle className="h-3 w-3" />
          Paused
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge variant="destructive" className="gap-1 text-[11px]">
          <XCircle className="h-3 w-3" />
          Cancelled
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-muted-foreground border-border text-[11px]">
          Draft
        </Badge>
      );
  }
}

function ScheduleCampaignDialog({
  campaignId,
  campaignName,
  open,
  onOpenChange,
}: {
  campaignId: string;
  campaignName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [scheduledAt, setScheduledAt] = useState(() => {
    const d = new Date(Date.now() + 15 * 60 * 1000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });

  const scheduleMutation = useScheduleCampaign();

  const handleSendNow = async () => {
    try {
      await scheduleMutation.mutateAsync({
        id: campaignId,
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
        id: campaignId,
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
              Choose when <strong className="text-foreground">{campaignName}</strong> will be sent.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="detail-schedule-time">Dispatch Date & Time</Label>
              <Input
                id="detail-schedule-time"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
              />
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-border">
              <span className="text-xs text-muted-foreground">Or send immediately:</span>
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
            <Button type="submit" disabled={scheduleMutation.isPending}>
              {scheduleMutation.isPending ? 'Scheduling...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
