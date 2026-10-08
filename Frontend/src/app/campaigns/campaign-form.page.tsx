import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Send,
  Calculator,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import {
  useCampaign,
  useCreateCampaign,
  useUpdateCampaign,
  useResolveRecipients,
} from '@/features/campaigns/use-campaigns';
import { useSignatures } from '@/features/sending/use-sending';
import { useLists } from '@/features/lists/use-lists';
import { useSegments } from '@/features/segments/use-segments';
import { useTemplates } from '@/features/templates/use-templates';
import { normalizeAxiosError } from '@/lib/api';
import type { AudienceSummary } from '@/types/campaigns';

export default function CampaignFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  // Queries
  const { data: existingCampaign, isLoading: isCampaignLoading } = useCampaign(id);
  const { data: rawSignatures } = useSignatures();
  const signatures = Array.isArray(rawSignatures) ? rawSignatures : [];

  const { data: rawLists } = useLists();
  const lists = Array.isArray(rawLists) ? rawLists : [];

  const { data: rawSegments } = useSegments();
  const segments = Array.isArray(rawSegments) ? rawSegments : [];

  const { data: rawTemplates } = useTemplates({ limit: 100 });
  const templates = Array.isArray(rawTemplates)
    ? rawTemplates
    : (rawTemplates?.data ?? []);

  // Form State
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [preheader, setPreheader] = useState('');
  const [signatureId, setSignatureId] = useState('');
  const [customFromName, setCustomFromName] = useState('');
  const [customFromEmail, setCustomFromEmail] = useState('');
  const [useCustomSender, setUseCustomSender] = useState(false);

  const [audienceType, setAudienceType] = useState<'list' | 'segment'>('list');
  const [listId, setListId] = useState('');
  const [segmentId, setSegmentId] = useState('');

  const [templateId, setTemplateId] = useState('');
  const [audienceSummary, setAudienceSummary] = useState<AudienceSummary | null>(null);

  // Mutations
  const createMutation = useCreateCampaign();
  const updateMutation = useUpdateCampaign();
  const resolveMutation = useResolveRecipients();

  // Populate defaults when editing
  useEffect(() => {
    if (existingCampaign) {
      setName(existingCampaign.name);
      setSubject(existingCampaign.subject);
      setPreheader(existingCampaign.preheader || '');
      setTemplateId(existingCampaign.templateId || existingCampaign.template?.id || '');

      if (existingCampaign.signatureId) {
        setSignatureId(existingCampaign.signatureId);
        setUseCustomSender(false);
      } else if (existingCampaign.fromEmail) {
        setUseCustomSender(true);
        setCustomFromName(existingCampaign.fromName || '');
        setCustomFromEmail(existingCampaign.fromEmail || '');
      }

      if (existingCampaign.segmentId) {
        setAudienceType('segment');
        setSegmentId(existingCampaign.segmentId);
      } else if (existingCampaign.listId) {
        setAudienceType('list');
        setListId(existingCampaign.listId);
      }
    } else {
      // Default signature to default if available
      const defSig = signatures.find((s) => s.isDefault);
      if (defSig && !signatureId) {
        setSignatureId(defSig.id);
      }
    }
  }, [existingCampaign, signatures]);

  const handleCalculateRecipients = async () => {
    if (!id) {
      toast.info('Save the campaign draft first to calculate exact recipient exclusions.');
      return;
    }
    try {
      const summary = await resolveMutation.mutateAsync(id);
      setAudienceSummary(summary);
      toast.success(`Calculated: ${summary.total.toLocaleString()} eligible recipients`);
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  const handleSave = async (scheduleAfter = false) => {
    if (!name.trim() || !subject.trim()) {
      toast.error('Campaign name and Subject line are required');
      return;
    }

    const payload = {
      name: name.trim(),
      subject: subject.trim(),
      preheader: preheader.trim() || undefined,
      signatureId: !useCustomSender && signatureId ? signatureId : undefined,
      fromName: useCustomSender ? customFromName.trim() || undefined : undefined,
      fromEmail: useCustomSender ? customFromEmail.trim() || undefined : undefined,
      listId: audienceType === 'list' && listId ? listId : undefined,
      segmentId: audienceType === 'segment' && segmentId ? segmentId : undefined,
      templateId: templateId || undefined,
    };

    try {
      if (isEditing && id) {
        await updateMutation.mutateAsync({ id, payload });
        toast.success('Campaign updated');
        if (scheduleAfter) {
          navigate(`/app/campaigns/${id}`);
        } else {
          navigate('/app/campaigns');
        }
      } else {
        const created = await createMutation.mutateAsync(payload);
        toast.success('Campaign created successfully');
        if (scheduleAfter) {
          navigate(`/app/campaigns/${created.id}`);
        } else {
          navigate('/app/campaigns');
        }
      }
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isEditing && isCampaignLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground animate-pulse text-sm">Loading campaign details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link to="/app/campaigns">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {isEditing ? `Edit Campaign: ${name || 'Draft'}` : 'Create Broadcast Campaign'}
            </h1>
            <p className="text-xs text-muted-foreground">
              Configure campaign settings, select your audience, and assign an email template.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/app/campaigns">Cancel</Link>
          </Button>
          <Button
            size="sm"
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="gap-1.5"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Step 1: Basic Campaign Details */}
        <section className="rounded-lg border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2 font-semibold text-foreground text-sm border-b border-border/60 pb-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
              1
            </span>
            Campaign Details & Subject
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="camp-name">Campaign Name *</Label>
              <Input
                id="camp-name"
                placeholder="e.g. Spring Seasonal Sale Announcement"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Internal reference name for your marketing team.
              </p>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="camp-subject">Email Subject Line *</Label>
              <Input
                id="camp-subject"
                placeholder="e.g. You won't want to miss our spring deals 🌸"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                What recipients will see in their email inbox preview.
              </p>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="camp-preheader">Preheader / Snippet Text (Optional)</Label>
              <Input
                id="camp-preheader"
                placeholder="e.g. Up to 40% off sitewide this weekend only..."
                value={preheader}
                onChange={(e) => setPreheader(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Summary text shown right next to or underneath the subject line in modern email clients.
              </p>
            </div>
          </div>
        </section>

        {/* Step 2: Sender Identity */}
        <section className="rounded-lg border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
                2
              </span>
              Sender Identity
            </div>

            <button
              type="button"
              onClick={() => setUseCustomSender(!useCustomSender)}
              className="text-xs text-primary hover:underline font-medium"
            >
              {useCustomSender ? 'Use Verified Sender Signature' : 'Enter Custom From Address'}
            </button>
          </div>

          {!useCustomSender ? (
            <div className="space-y-2">
              <Label htmlFor="camp-signature">Sender Signature</Label>
              <select
                id="camp-signature"
                aria-label="Select Sender Signature"
                value={signatureId}
                onChange={(e) => setSignatureId(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Choose sender signature...</option>
                {signatures.map((sig) => (
                  <option key={sig.id} value={sig.id}>
                    {sig.name} &mdash; {sig.fromName} &lt;{sig.fromEmail}&gt; {sig.isDefault ? '(Default)' : ''}
                  </option>
                ))}
              </select>

              {signatures.length === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  No sender signatures found.{' '}
                  <Link to="/app/sending/signatures" className="underline font-semibold">
                    Add a signature here
                  </Link>.
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="camp-custom-name">From Name</Label>
                <Input
                  id="camp-custom-name"
                  placeholder="e.g. Acme Marketing"
                  value={customFromName}
                  onChange={(e) => setCustomFromName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="camp-custom-email">From Email</Label>
                <Input
                  id="camp-custom-email"
                  type="email"
                  placeholder="e.g. hello@yourbrand.com"
                  value={customFromEmail}
                  onChange={(e) => setCustomFromEmail(e.target.value)}
                />
              </div>
            </div>
          )}
        </section>

        {/* Step 3: Target Audience */}
        <section className="rounded-lg border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
                3
              </span>
              Target Audience
            </div>

            {/* Audience Type switcher */}
            <div className="flex rounded-md border border-border bg-muted/40 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setAudienceType('list')}
                className={`px-3 py-1 rounded-sm font-medium transition-all ${
                  audienceType === 'list'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Subscriber List
              </button>
              <button
                type="button"
                onClick={() => setAudienceType('segment')}
                className={`px-3 py-1 rounded-sm font-medium transition-all ${
                  audienceType === 'segment'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Dynamic Segment
              </button>
            </div>
          </div>

          {audienceType === 'list' ? (
            <div className="space-y-2">
              <Label htmlFor="camp-list">Select Audience List</Label>
              <select
                id="camp-list"
                aria-label="Select Audience List"
                value={listId}
                onChange={(e) => setListId(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Select a list...</option>
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="camp-segment">Select Dynamic Segment</Label>
              <select
                id="camp-segment"
                aria-label="Select Dynamic Segment"
                value={segmentId}
                onChange={(e) => setSegmentId(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Select a segment...</option>
                {segments.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.rules?.match?.toUpperCase() || 'SEGMENT'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Resolve recipients info */}
          {isEditing && id && (
            <div className="pt-2 border-t border-border/60 flex items-center justify-between">
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Calculator className="h-4 w-4 text-primary" />
                <span>Audience pre-calculation</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCalculateRecipients}
                disabled={resolveMutation.isPending}
                className="text-xs gap-1.5"
              >
                {resolveMutation.isPending ? 'Calculating...' : 'Resolve Eligible Contacts'}
              </Button>
            </div>
          )}

          {audienceSummary && (
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between font-semibold text-foreground">
                <span>Eligible Dispatched Recipients:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                  {audienceSummary.total.toLocaleString()} contacts
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-muted-foreground">
                <div>Unsubscribed: {audienceSummary.excluded.unsubscribed}</div>
                <div>Suppressed: {audienceSummary.excluded.suppressed}</div>
                <div>Blacklisted: {audienceSummary.excluded.blacklisted}</div>
                <div>Duplicate emails: {audienceSummary.excluded.duplicates}</div>
              </div>
            </div>
          )}
        </section>

        {/* Step 4: Email Template */}
        <section className="rounded-lg border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
                4
              </span>
              Email Template
            </div>
            <Link
              to="/app/templates/new"
              target="_blank"
              className="text-xs text-primary hover:underline font-medium"
            >
              + Create New Template
            </Link>
          </div>

          <div className="space-y-2">
            <Label htmlFor="camp-template">Choose Template</Label>
            <select
              id="camp-template"
              aria-label="Select Email Template"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Select a template...</option>
              {templates.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  {tmpl.name} {tmpl.isGallery ? '(Gallery)' : ''} [{tmpl.builderType}]
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" asChild>
            <Link to="/app/campaigns">Cancel</Link>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="gap-1.5"
            >
              <Save className="h-4 w-4" />
              Save Draft
            </Button>
            <Button
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="gap-1.5"
            >
              <Send className="h-4 w-4" />
              Review & Schedule &rarr;
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
