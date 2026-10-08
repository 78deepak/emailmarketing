import { useState } from 'react';
import { toast } from 'sonner';
import { Tag as TagIcon, X, Plus } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useAddTagToContact,
  useRemoveTagFromContact,
} from '@/features/contacts/use-contacts';
import { useTags } from '@/features/tags/use-tags';
import { normalizeAxiosError } from '@/lib/api';
import type { Contact } from '@/types/contacts';

interface ContactTagsDialogProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactTagsDialog({
  contact,
  open,
  onOpenChange,
}: ContactTagsDialogProps) {
  const [selectedTagId, setSelectedTagId] = useState<string>('');
  const { data: allTags } = useTags();
  const addTag = useAddTagToContact();
  const removeTag = useRemoveTagFromContact();

  if (!contact) return null;

  const currentTags = contact.tags ?? [];
  const assignedTagIds = new Set(currentTags.map((t) => t.id));
  const availableTags = (allTags ?? []).filter((t) => !assignedTagIds.has(t.id));

  const handleAddTag = async () => {
    if (!selectedTagId) return;
    try {
      await addTag.mutateAsync({ contactId: contact.id, tagId: selectedTagId });
      toast.success('Tag assigned');
      setSelectedTagId('');
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      await removeTag.mutateAsync({ contactId: contact.id, tagId });
      toast.success('Tag removed');
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TagIcon className="h-5 w-5 text-primary" />
            <span>Manage Tags</span>
          </DialogTitle>
          <DialogDescription>
            Assign or remove categorization tags for <span className="font-semibold">{contact.email}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Active Tags */}
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Current Tags ({currentTags.length})
            </div>
            {currentTags.length === 0 ? (
              <div className="text-xs text-muted-foreground italic py-2">
                No tags assigned yet.
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {currentTags.map((t) => (
                  <Badge key={t.id} variant="secondary" className="gap-1 pr-1">
                    <span>{t.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t.id)}
                      disabled={removeTag.isPending}
                      className="rounded-full hover:bg-muted p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Add Tag row */}
          {availableTags.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="text-xs font-medium text-muted-foreground">Add Tag</div>
              <div className="flex gap-2">
                <Select value={selectedTagId} onValueChange={setSelectedTagId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Choose tag..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTags.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddTag}
                  disabled={!selectedTagId || addTag.isPending}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>Assign</span>
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
