import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useCreateContact } from '@/features/contacts/use-contacts';
import { normalizeAxiosError } from '@/lib/api';
import type { ContactStatus } from '@/types/contacts';

const createContactSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(['subscribed', 'unsubscribed', 'bounced', 'complained']),
});

type FormValues = z.infer<typeof createContactSchema>;

export function AddContactDialog() {
  const [open, setOpen] = useState(false);
  const createContact = useCreateContact();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createContactSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      status: 'subscribed',
    },
  });

  const selectedStatus = watch('status');

  const onSubmit = async (values: FormValues) => {
    try {
      const attributes: Record<string, unknown> = {};
      if (values.phone?.trim()) attributes.phone = values.phone.trim();

      await createContact.mutateAsync({
        email: values.email.trim(),
        firstName: values.firstName?.trim() || undefined,
        lastName: values.lastName?.trim() || undefined,
        status: values.status,
        attributes: Object.keys(attributes).length ? attributes : undefined,
      });

      toast.success('Contact added successfully');
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
          <UserPlus className="h-4 w-4" />
          <span>Add Contact</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
          <DialogDescription>
            Add an individual subscriber to your audience database.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="Email Address"
            type="email"
            placeholder="alex@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="First Name"
              placeholder="Alex"
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <FormField
              label="Last Name"
              placeholder="Morgan"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          <FormField
            label="Phone (optional)"
            placeholder="+1 555-0199"
            error={errors.phone?.message}
            {...register('phone')}
          />

          <div className="space-y-1.5">
            <Label htmlFor="contact-status">Subscription Status</Label>
            <Select
              value={selectedStatus}
              onValueChange={(val) => setValue('status', val as ContactStatus)}
            >
              <SelectTrigger id="contact-status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="subscribed">Subscribed</SelectItem>
                <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                <SelectItem value="bounced">Bounced</SelectItem>
                <SelectItem value="complained">Complained</SelectItem>
              </SelectContent>
            </Select>
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
              {isSubmitting ? 'Saving...' : 'Save Contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
