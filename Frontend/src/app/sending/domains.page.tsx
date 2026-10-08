import { useState } from 'react';
import {
  Globe,
  Plus,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  ShieldCheck,
  Info,
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
  useSendingDomains,
  useCreateSendingDomain,
  useDeleteSendingDomain,
  useVerifySendingDomain,
} from '@/features/sending/use-sending';
import { normalizeAxiosError } from '@/lib/api';
import type { SendingDomain } from '@/types/sending';

export default function DomainsPage() {
  const { data: rawDomains, isLoading } = useSendingDomains();
  const domains = Array.isArray(rawDomains) ? rawDomains : [];

  const [addOpen, setAddOpen] = useState(false);
  const [instructionDomain, setInstructionDomain] = useState<SendingDomain | null>(null);
  const [deletingDomain, setDeletingDomain] = useState<SendingDomain | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const deleteMutation = useDeleteSendingDomain();
  const verifyMutation = useVerifySendingDomain();

  const handleVerify = async (dom: SendingDomain) => {
    setVerifyingId(dom.id);
    try {
      const updated = await verifyMutation.mutateAsync(dom.id);
      if (updated.status === 'verified') {
        toast.success(`Domain "${dom.domain}" is verified and ready for sending!`);
      } else {
        toast.warning(
          `Domain verification incomplete. SPF: ${updated.spfVerified ? '✓' : '✗'}, DKIM: ${
            updated.dkimVerified ? '✓' : '✗'
          }. Please check DNS records.`,
        );
      }
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingDomain) return;
    try {
      await deleteMutation.mutateAsync(deletingDomain.id);
      toast.success('Domain removed');
      setDeletingDomain(null);
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sending Domains</h1>
          <p className="text-sm text-muted-foreground">
            Authenticate your custom domains with SPF, DKIM, and DMARC to maximize inbox delivery and protect your sender reputation.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Domain
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-card p-6 animate-pulse space-y-4"
            >
              <div className="h-5 w-48 rounded bg-muted" />
              <div className="h-4 w-72 rounded bg-muted/60" />
            </div>
          ))}
        </div>
      ) : domains.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/60 p-12 text-center">
          <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto text-muted-foreground">
            <Globe className="h-10 w-10 stroke-1 text-primary/70 mb-1" />
            <h2 className="text-lg font-semibold text-foreground">No sending domains configured</h2>
            <p className="text-sm">
              Add your domain to establish SPF and DKIM authentication. Verified domains significantly decrease the risk of messages landing in the spam folder.
            </p>
            <div className="pt-3">
              <Button onClick={() => setAddOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Domain
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {domains.map((dom) => {
            const isVerifying = verifyingId === dom.id;
            return (
              <div
                key={dom.id}
                className="rounded-lg border border-border bg-card p-5 transition-all hover:border-border/80"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-semibold text-foreground text-lg">{dom.domain}</span>
                      <StatusBadge status={dom.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Added on {new Date(dom.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInstructionDomain(dom)}
                      className="gap-1.5 text-xs"
                    >
                      <Info className="h-3.5 w-3.5" />
                      DNS Instructions
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleVerify(dom)}
                      disabled={isVerifying}
                      className="gap-1.5 text-xs"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                      {isVerifying ? 'Checking DNS...' : 'Verify DNS'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingDomain(dom)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>

                {/* DNS Record Badges */}
                <div className="mt-4 pt-4 border-t border-border/60 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <RecordStatusItem
                    title="SPF Record"
                    verified={dom.spfVerified}
                    description="Validates sending IP authorization"
                  />
                  <RecordStatusItem
                    title="DKIM Signature"
                    verified={dom.dkimVerified}
                    description="Cryptographic domain key authentication"
                  />
                  <RecordStatusItem
                    title="DMARC Policy"
                    verified={dom.dmarcVerified}
                    description="Protects against email spoofing (advisory)"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Domain Dialog */}
      <AddDomainDialog open={addOpen} onOpenChange={setAddOpen} />

      {/* DNS Instructions Modal */}
      {instructionDomain && (
        <DnsInstructionsDialog
          domain={instructionDomain}
          open={!!instructionDomain}
          onOpenChange={(open) => !open && setInstructionDomain(null)}
          onVerify={() => handleVerify(instructionDomain)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingDomain} onOpenChange={(open) => !open && setDeletingDomain(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Sending Domain</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong className="text-foreground">{deletingDomain?.domain}</strong>?
              Emails sent using this domain will no longer benefit from validated DNS signatures.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeletingDomain(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Removing...' : 'Remove Domain'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: SendingDomain['status'] }) {
  if (status === 'verified') {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 text-[11px]">
        <CheckCircle2 className="h-3 w-3" />
        Verified
      </Badge>
    );
  }
  if (status === 'failed') {
    return (
      <Badge variant="destructive" className="gap-1 text-[11px]">
        <XCircle className="h-3 w-3" />
        Verification Failed
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10 gap-1 text-[11px]">
      <AlertCircle className="h-3 w-3" />
      Pending Verification
    </Badge>
  );
}

function RecordStatusItem({
  title,
  verified,
  description,
}: {
  title: string;
  verified: boolean;
  description: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-md border border-border/70 bg-muted/30 p-2.5">
      {verified ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-foreground">{title}</span>
          <span
            className={`text-[10px] font-medium ${
              verified ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {verified ? 'Active' : 'Missing'}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground truncate">{description}</p>
      </div>
    </div>
  );
}

function AddDomainDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [domain, setDomain] = useState('');
  const createMutation = useCreateSendingDomain();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDomain = domain.trim().toLowerCase();
    if (!cleanDomain) {
      toast.error('Domain name is required');
      return;
    }

    try {
      await createMutation.mutateAsync({ domain: cleanDomain });
      toast.success(`Domain "${cleanDomain}" added. Configure your DNS records to verify.`);
      onOpenChange(false);
      setDomain('');
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Sending Domain</DialogTitle>
            <DialogDescription>
              Enter the hostname or subdomain you intend to send emails from (e.g. <code>mail.company.com</code> or <code>company.com</code>).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="domain-input">Domain or Subdomain</Label>
              <Input
                id="domain-input"
                placeholder="mail.yourbrand.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Do not include <code>http://</code> or <code>https://</code>.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Adding...' : 'Add Domain'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DnsInstructionsDialog({
  domain,
  open,
  onOpenChange,
  onVerify,
}: {
  domain: SendingDomain;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerify: () => void;
}) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const records = [
    {
      key: 'spf',
      type: 'TXT',
      name: domain.domain,
      value: 'v=spf1 include:_spf.example.com ~all',
      status: domain.spfVerified,
      note: 'SPF specifies authorized sending mail servers for this domain.',
    },
    {
      key: 'dkim',
      type: 'TXT',
      name: `mail._domainkey.${domain.domain}`,
      value: 'v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC3...',
      status: domain.dkimVerified,
      note: 'DKIM provides a digital cryptographic signature for outgoing mail.',
    },
    {
      key: 'dmarc',
      type: 'TXT',
      name: `_dmarc.${domain.domain}`,
      value: 'v=DMARC1; p=none; sp=none; pct=100',
      status: domain.dmarcVerified,
      note: 'DMARC tells receiving inboxes what to do if SPF or DKIM checks fail.',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            DNS Records for {domain.domain}
          </DialogTitle>
          <DialogDescription>
            Add the following TXT records to your DNS hosting provider (Cloudflare, GoDaddy, Route53, Namecheap, etc.).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {records.map((rec) => (
            <div
              key={rec.key}
              className="rounded-lg border border-border bg-muted/20 p-3.5 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium">
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {rec.type}
                  </Badge>
                  <span className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                    {rec.key}
                  </span>
                </div>
                {rec.status ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium text-[11px]">
                    <AlertCircle className="h-3 w-3" />
                    Pending DNS
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-sans">Host / Name</span>
                  <div className="flex items-center justify-between bg-card rounded border border-border px-2 py-1.5">
                    <span className="truncate pr-1 select-all">{rec.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 shrink-0"
                      onClick={() => copyToClipboard(rec.name, `${rec.key}-name`)}
                    >
                      {copiedKey === `${rec.key}-name` ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-sans">Value</span>
                  <div className="flex items-center justify-between bg-card rounded border border-border px-2 py-1.5">
                    <span className="truncate pr-1 select-all">{rec.value}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 shrink-0"
                      onClick={() => copyToClipboard(rec.value, `${rec.key}-val`)}
                    >
                      {copiedKey === `${rec.key}-val` ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground">{rec.note}</p>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={() => {
              onVerify();
              onOpenChange(false);
            }}
            className="gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Check DNS Propagation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
