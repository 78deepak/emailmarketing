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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useUpdateContact } from '@/features/contacts/use-contacts';
import { normalizeAxiosError } from '@/lib/api';
import type { Contact, ContactStatus } from '@/types/contacts';

const editContactSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(['subscribed', 'unsubscribed', 'bounced', 'complained']),
});

type FormValues = z.infer<typeof editContactSchema>;

interface EditContactDialogProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditContactDialog({
  contact,
  open,
  onOpenChange,
}: EditContactDialogProps) {
  const updateContact = useUpdateContact();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(editContactSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      status: 'subscribed',
    },
  });

  useEffect(() => {
    if (contact) {
      const phoneAttr = (contact.attributes as Record<string, unknown> | null)?.phone;
      reset({
        firstName: contact.firstName ?? '',
        lastName: contact.lastName ?? '',
        phone: typeof phoneAttr === 'string' ? phoneAttr : '',
        status: contact.status,
      });
    }
  }, [contact, reset]);

  const selectedStatus = watch('status');

  const onSubmit = async (values: FormValues) => {
    if (!contact) return;
    try {
      const attributes: Record<string, unknown> = {
        ...((contact.attributes as Record<string, unknown> | null) ?? {}),
      };
      if (values.phone?.trim()) {
        attributes.phone = values.phone.trim();
      } else {
        delete attributes.phone;
      }

      await updateContact.mutateAsync({
        id: contact.id,
        payload: {
          firstName: values.firstName?.trim() || undefined,
          lastName: values.lastName?.trim() || undefined,
          status: values.status,
          attributes,
        },
      });

      toast.success('Contact updated');
      onOpenChange(false);
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
          <DialogDescription>
            Update contact details for <span className="font-semibold">{contact?.email}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="First Name"
              placeholder="First name"
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <FormField
              label="Last Name"
              placeholder="Last name"
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
            <Label htmlFor="edit-contact-status">Status</Label>
            <Select
              value={selectedStatus}
              onValueChange={(val) => setValue('status', val as ContactStatus)}
            >
              <SelectTrigger id="edit-contact-status">
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
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Update Contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
