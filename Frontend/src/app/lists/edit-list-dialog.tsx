import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form.field';
import { Label } from '@/components/ui/label';
import { useUpdateList } from '@/features/lists/use-lists';
import { normalizeAxiosError } from '@/lib/api';
import type { List } from '@/types/lists';

const editListSchema = z.object({
  name: z.string().min(1, 'List name is required').max(80, 'Max 80 characters'),
  description: z.string().max(250, 'Max 250 characters').optional(),
});

type FormValues = z.infer<typeof editListSchema>;

interface EditListDialogProps {
  list: List | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditListDialog({
  list,
  open,
  onOpenChange,
}: EditListDialogProps) {
  const updateList = useUpdateList();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(editListSchema),
    defaultValues: { name: '', description: '' },
  });

  useEffect(() => {
    if (list) {
      reset({
        name: list.name,
        description: list.description ?? '',
      });
    }
  }, [list, reset]);

  const onSubmit = async (values: FormValues) => {
    if (!list) return;
    try {
      await updateList.mutateAsync({
        id: list.id,
        payload: {
          name: values.name.trim(),
          description: values.description?.trim() || undefined,
        },
      });
      toast.success('List updated');
      onOpenChange(false);
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit List</DialogTitle>
          <DialogDescription>
            Update name or description for this subscriber audience.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="List Name"
            placeholder="List name"
            error={errors.name?.message}
            {...register('name')}
          />

          <div className="space-y-1.5">
            <Label htmlFor="edit-list-desc">Description</Label>
            <textarea
              id="edit-list-desc"
              rows={3}
              placeholder="Description"
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register('description')}
            />
            {errors.description?.message && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
