import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { FolderPlus } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form.field';
import { Label } from '@/components/ui/label';
import { useCreateList } from '@/features/lists/use-lists';
import { normalizeAxiosError } from '@/lib/api';

const createListSchema = z.object({
  name: z.string().min(1, 'List name is required').max(80, 'Max 80 characters'),
  description: z.string().max(250, 'Max 250 characters').optional(),
});

type FormValues = z.infer<typeof createListSchema>;

export function CreateListDialog() {
  const [open, setOpen] = useState(false);
  const createList = useCreateList();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createListSchema),
    defaultValues: { name: '', description: '' },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await createList.mutateAsync({
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
      });
      toast.success('List created');
      reset();
      setOpen(false);
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <FolderPlus className="h-4 w-4" />
          <span>Create List</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Subscriber List</DialogTitle>
          <DialogDescription>
            Lists help you organize subscribers into distinct audiences (e.g. Newsletter, Customers, Beta Testers).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="List Name"
            placeholder="e.g. Weekly Newsletter"
            error={errors.name?.message}
            {...register('name')}
          />

          <div className="space-y-1.5">
            <Label htmlFor="create-list-desc">Description (optional)</Label>
            <textarea
              id="create-list-desc"
              rows={3}
              placeholder="Who belongs in this list and what do they receive?"
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
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create List'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
