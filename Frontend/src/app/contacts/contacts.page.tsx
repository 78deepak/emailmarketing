import { useState } from 'react';
import {
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Tag as TagIcon,
  Users,
  FilterX,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { useContacts, useDeleteContact } from '@/features/contacts/use-contacts';
import { ContactStatusBadge } from '@/features/contacts/status-badge';
import { useLists } from '@/features/lists/use-lists';
import { useTags } from '@/features/tags/use-tags';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { normalizeAxiosError } from '@/lib/api';
import type { Contact, ContactStatus } from '@/types/contacts';

import { AddContactDialog } from './add-contact-dialog';
import { EditContactDialog } from './edit-contact-dialog';
import { ImportContactsDialog } from './import-contacts-dialog';
import { ContactTagsDialog } from './contact-tags-dialog';

export default function ContactsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [listId, setListId] = useState<string>('all');
  const [tagId, setTagId] = useState<string>('all');

  // Dialog states
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [taggingContact, setTaggingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300);

  // Queries
  const { data: contactsData, isLoading } = useContacts({
    page,
    limit,
    search: debouncedSearch.trim() || undefined,
    status: status !== 'all' ? (status as ContactStatus) : undefined,
    listId: listId !== 'all' ? listId : undefined,
    tagId: tagId !== 'all' ? tagId : undefined,
  });

  const { data: lists } = useLists();
  const { data: tags } = useTags();
  const deleteContact = useDeleteContact();

  const contacts: Contact[] = Array.isArray(contactsData)
    ? contactsData
    : (contactsData?.data ?? []);
  const meta = Array.isArray(contactsData)
    ? { page, limit, total: contacts.length, pages: Math.max(1, Math.ceil(contacts.length / limit)) }
    : contactsData?.meta;

  const handleDelete = async () => {
    if (!deletingContact) return;
    try {
      await deleteContact.mutateAsync(deletingContact.id);
      toast.success('Contact deleted');
      setDeletingContact(null);
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  const hasActiveFilters =
    search.trim() !== '' || status !== 'all' || listId !== 'all' || tagId !== 'all';

  const clearFilters = () => {
    setSearch('');
    setStatus('all');
    setListId('all');
    setTagId('all');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
          <p className="text-sm text-muted-foreground">
            Manage your subscribers, custom attributes, and engagement status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ImportContactsDialog />
          <AddContactDialog />
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
        {/* Search */}
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search email or name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        {/* Status filter */}
        <div className="w-36">
          <Select
            value={status}
            onValueChange={(val) => {
              setStatus(val);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="subscribed">Subscribed</SelectItem>
              <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
              <SelectItem value="bounced">Bounced</SelectItem>
              <SelectItem value="complained">Complained</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* List filter */}
        {lists && lists.length > 0 && (
          <div className="w-40">
            <Select
              value={listId}
              onValueChange={(val) => {
                setListId(val);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="List" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Lists</SelectItem>
                {lists.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Tag filter */}
        {tags && tags.length > 0 && (
          <div className="w-36">
            <Select
              value={tagId}
              onValueChange={(val) => {
                setTagId(val);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {tags.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <FilterX className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Contacts Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Lists</th>
                <th className="py-3 px-4">Tags</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4">
                      <div className="h-4 w-40 rounded bg-muted mb-1" />
                      <div className="h-3 w-24 rounded bg-muted/60" />
                    </td>
                    <td className="py-4 px-4"><div className="h-5 w-20 rounded bg-muted" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-24 rounded bg-muted" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-20 rounded bg-muted" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-16 rounded bg-muted" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-24 rounded bg-muted" /></td>
                    <td className="py-4 px-4 text-right"><div className="h-8 w-8 rounded bg-muted ml-auto" /></td>
                  </tr>
                ))
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Users className="h-10 w-10 stroke-1" />
                      <p className="text-base font-medium">No contacts found</p>
                      <p className="text-xs max-w-sm">
                        {hasActiveFilters
                          ? 'Try adjusting your search criteria or clear your active filters.'
                          : 'Get started by adding your first subscriber or importing a CSV list.'}
                      </p>
                      {hasActiveFilters && (
                        <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2">
                          Reset filters
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => {
                  const fullName = [contact.firstName, contact.lastName]
                    .filter(Boolean)
                    .join(' ');
                  const phone = (contact.attributes as Record<string, unknown> | null)?.phone;

                  return (
                    <tr
                      key={contact.id}
                      className="hover:bg-accent/30 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-foreground">{contact.email}</div>
                        {fullName && (
                          <div className="text-xs text-muted-foreground">{fullName}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <ContactStatusBadge status={contact.status} />
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        {typeof phone === 'string' ? phone : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        {contact.lists && contact.lists.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {contact.lists.map((l) => (
                              <Badge key={l.id} variant="outline" className="text-[11px] py-0">
                                {l.name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {contact.tags && contact.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {contact.tags.map((t) => (
                              <Badge key={t.id} variant="secondary" className="text-[11px] py-0">
                                {t.name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        {new Date(contact.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => setEditingContact(contact)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTaggingContact(contact)}>
                              <TagIcon className="mr-2 h-4 w-4" />
                              Manage Tags
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeletingContact(contact)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {meta && meta.total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border bg-card px-4 py-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>
                Showing{' '}
                <strong className="text-foreground">
                  {(meta.page - 1) * meta.limit + 1}
                </strong>{' '}
                to{' '}
                <strong className="text-foreground">
                  {Math.min(meta.page * meta.limit, meta.total)}
                </strong>{' '}
                of <strong className="text-foreground">{meta.total}</strong> contacts
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span>Rows:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="rounded border border-input bg-transparent px-2 py-1 text-xs"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={meta.page <= 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-2 font-medium text-foreground">
                  {meta.page} / {meta.pages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={meta.page >= (meta.pages || 1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Contact Dialog */}
      <EditContactDialog
        contact={editingContact}
        open={!!editingContact}
        onOpenChange={(v) => !v && setEditingContact(null)}
      />

      {/* Manage Tags Dialog */}
      <ContactTagsDialog
        contact={taggingContact}
        open={!!taggingContact}
        onOpenChange={(v) => !v && setTaggingContact(null)}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingContact}
        onOpenChange={(v) => !v && setDeletingContact(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{' '}
              <span className="font-semibold">{deletingContact?.email}</span>? This contact
              will be removed from active campaigns and subscriber lists.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setDeletingContact(null)}
              disabled={deleteContact.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteContact.isPending}
            >
              {deleteContact.isPending ? 'Deleting...' : 'Delete Contact'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
