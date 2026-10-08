import { useState } from 'react';
import { Layers, Trash2, Eye, Users } from 'lucide-react';
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

import {
  useSegments,
  useDeleteSegment,
  useSegmentPreview,
} from '@/features/segments/use-segments';
import { ContactStatusBadge } from '@/features/contacts/status-badge';
import { normalizeAxiosError } from '@/lib/api';
import type { Segment } from '@/types/segments';
import type { Contact } from '@/types/contacts';

import { CreateSegmentDialog } from './create-segment-dialog';

export default function SegmentsPage() {
  const { data: segments, isLoading } = useSegments();
  const deleteSegment = useDeleteSegment();

  const [previewSegment, setPreviewSegment] = useState<Segment | null>(null);
  const [deletingSegment, setDeletingSegment] = useState<Segment | null>(null);

  const { data: previewData, isLoading: previewLoading } = useSegmentPreview(
    previewSegment?.id,
    1,
    10,
  );

  const previewContacts: Contact[] = Array.isArray(previewData)
    ? previewData
    : (previewData?.data ?? []);

  const handleDelete = async () => {
    if (!deletingSegment) return;
    try {
      await deleteSegment.mutateAsync(deletingSegment.id);
      toast.success('Segment deleted');
      setDeletingSegment(null);
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audience Segments</h1>
          <p className="text-sm text-muted-foreground">
            Dynamically filter and group contacts using custom conditional rules.
          </p>
        </div>
        <CreateSegmentDialog />
      </div>

      {/* Segments Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-card p-5 animate-pulse space-y-3"
            >
              <div className="h-5 w-32 rounded bg-muted" />
              <div className="h-4 w-48 rounded bg-muted/60" />
            </div>
          ))}
        </div>
      ) : !segments || segments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/60 p-12 text-center">
          <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto text-muted-foreground">
            <Layers className="h-10 w-10 stroke-1 text-primary/70 mb-1" />
            <h2 className="text-lg font-semibold text-foreground">No segments created</h2>
            <p className="text-sm">
              Create dynamic segments to send targeted campaigns based on status, email domain, or tags.
            </p>
            <div className="pt-3">
              <CreateSegmentDialog />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {segments.map((segment) => {
            const conditions = segment.rules?.conditions ?? [];
            const match = segment.rules?.match ?? 'all';

            return (
              <div
                key={segment.id}
                className="flex flex-col justify-between rounded-lg border border-border bg-card p-5 hover:border-primary/40 transition-colors shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold text-foreground text-base line-clamp-1">
                      {segment.name}
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingSegment(segment)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      title="Delete segment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>Rules:</span>
                    <Badge variant="outline" className="text-[10px] uppercase font-mono">
                      Match {match}
                    </Badge>
                    <span>({conditions.length} condition{conditions.length === 1 ? '' : 's'})</span>
                  </div>

                  <div className="mt-3 space-y-1">
                    {conditions.slice(0, 3).map((c, i) => (
                      <div
                        key={i}
                        className="rounded bg-muted/50 px-2 py-1 text-[11px] font-mono text-muted-foreground flex items-center justify-between"
                      >
                        <span>{c.field} {c.op}</span>
                        <span className="font-semibold text-foreground truncate max-w-[120px]">
                          {c.value}
                        </span>
                      </div>
                    ))}
                    {conditions.length > 3 && (
                      <div className="text-[10px] text-muted-foreground italic pl-1">
                        +{conditions.length - 3} more conditions
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewSegment(segment)}
                    className="w-full gap-1.5 text-xs"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Preview Matching Contacts</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewSegment} onOpenChange={(v) => !v && setPreviewSegment(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span>Segment Preview: {previewSegment?.name}</span>
            </DialogTitle>
            <DialogDescription>
              Live audience evaluation based on current database records.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-3">
            {previewLoading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Evaluating criteria...
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2 text-xs">
                  <span className="text-muted-foreground">Total Matching Subscribers:</span>
                  <span className="font-bold text-primary text-sm">
                    {previewData?.meta?.matchCount ?? 0}
                  </span>
                </div>

                <div className="rounded-md border border-border divide-y divide-border max-h-60 overflow-y-auto">
                  {previewContacts.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      No contacts currently match these criteria.
                    </div>
                  ) : (
                    previewContacts.map((c) => (
                      <div
                        key={c.id}
                        className="p-2.5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-medium text-foreground">{c.email}</div>
                          {(c.firstName || c.lastName) && (
                            <div className="text-[11px] text-muted-foreground">
                              {[c.firstName, c.lastName].filter(Boolean).join(' ')}
                            </div>
                          )}
                        </div>
                        <ContactStatusBadge status={c.status} />
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewSegment(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingSegment} onOpenChange={(v) => !v && setDeletingSegment(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Segment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold">{deletingSegment?.name}</span>?
              Your contacts will not be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingSegment(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteSegment.isPending}
            >
              Delete Segment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
