import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  UserPlus,
  UserMinus,
  Users,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useLists,
  useListContacts,
  useAddContactsToList,
  useRemoveContactFromList,
} from '@/features/lists/use-lists';
import { useContacts } from '@/features/contacts/use-contacts';
import { ContactStatusBadge } from '@/features/contacts/status-badge';
import { normalizeAxiosError } from '@/lib/api';
import type { Contact } from '@/types/contacts';

export default function ListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Add subscribers dialog state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [searchContact, setSearchContact] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);

  // Remove confirmation state
  const [removingContactId, setRemovingContactId] = useState<string | null>(null);

  const { data: lists } = useLists();
  const currentList = lists?.find((l) => l.id === id);

  const { data: listContactsData, isLoading } = useListContacts(id, page, limit);
  const contacts: Contact[] = Array.isArray(listContactsData)
    ? listContactsData
    : (listContactsData?.data ?? []);
  const meta = Array.isArray(listContactsData)
    ? { page, limit, total: contacts.length, pages: Math.max(1, Math.ceil(contacts.length / limit)) }
    : listContactsData?.meta;

  // Query general contacts for the picker modal
  const { data: allContactsData } = useContacts({
    page: 1,
    limit: 50,
    search: searchContact.trim() || undefined,
  });

  const allContactsList: Contact[] = Array.isArray(allContactsData)
    ? allContactsData
    : (allContactsData?.data ?? []);

  const addContacts = useAddContactsToList();
  const removeContact = useRemoveContactFromList();

  const handleAddSelected = async () => {
    if (!id || selectedContactIds.length === 0) return;
    try {
      const res = await addContacts.mutateAsync({
        listId: id,
        payload: { contactIds: selectedContactIds },
      });
      toast.success(`Added ${res.added} contacts to list.`);
      setSelectedContactIds([]);
      setAddModalOpen(false);
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  const handleRemove = async () => {
    if (!id || !removingContactId) return;
    try {
      await removeContact.mutateAsync({ listId: id, contactId: removingContactId });
      toast.success('Contact removed from list');
      setRemovingContactId(null);
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  const toggleSelectContact = (contactId: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(contactId)
        ? prev.filter((i) => i !== contactId)
        : [...prev, contactId],
    );
  };

  const currentMemberIds = new Set(contacts.map((c) => c.id));
  const candidateContacts = allContactsList.filter(
    (c) => !currentMemberIds.has(c.id),
  );

  return (
    <div className="space-y-6">
      {/* Back button & Breadcrumb */}
      <div>
        <Link
          to="/app/lists"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Lists</span>
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {currentList?.name ?? 'Subscriber List'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {currentList?.description || 'Audience segment subscribers'}
            </p>
          </div>
          <Button onClick={() => setAddModalOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            <span>Add Subscribers</span>
          </Button>
        </div>
      </div>

      {/* Table of list members */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Tags</th>
                <th className="py-3 px-4">Added</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 w-36 rounded bg-muted" /></td>
                    <td className="py-4 px-4"><div className="h-5 w-20 rounded bg-muted" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-20 rounded bg-muted" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-24 rounded bg-muted" /></td>
                    <td className="py-4 px-4 text-right"><div className="h-8 w-16 rounded bg-muted ml-auto" /></td>
                  </tr>
                ))
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="h-9 w-9 stroke-1 text-muted-foreground" />
                      <p className="text-base font-medium">No contacts in this list yet</p>
                      <p className="text-xs max-w-sm">
                        Add subscribers from your audience to target them in campaigns.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAddModalOpen(true)}
                        className="mt-2"
                      >
                        Add subscribers now
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => {
                  const fullName = [contact.firstName, contact.lastName]
                    .filter(Boolean)
                    .join(' ');
                  return (
                    <tr key={contact.id} className="hover:bg-accent/30 transition-colors">
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
                        {contact.tags && contact.tags.length > 0
                          ? contact.tags.map((t) => t.name).join(', ')
                          : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        {new Date(contact.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRemovingContactId(contact.id)}
                          className="h-8 gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                          <span>Remove</span>
                        </Button>
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
            <div>
              Showing {(meta.page - 1) * meta.limit + 1} to{' '}
              {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
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
              <span>
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

      {/* Add Contacts to List Picker Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Subscribers to List</DialogTitle>
            <DialogDescription>
              Select existing contacts from your database to assign to this list.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search contact email..."
                value={searchContact}
                onChange={(e) => setSearchContact(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div className="max-h-64 overflow-y-auto rounded-md border border-border divide-y divide-border">
              {candidateContacts.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No eligible contacts available to add.
                </div>
              ) : (
                candidateContacts.map((contact) => {
                  const isChecked = selectedContactIds.includes(contact.id);
                  return (
                    <div
                      key={contact.id}
                      onClick={() => toggleSelectContact(contact.id)}
                      className="flex items-center justify-between p-2.5 hover:bg-accent/40 cursor-pointer transition-colors text-xs"
                    >
                      <div>
                        <div className="font-medium text-foreground">{contact.email}</div>
                        {(contact.firstName || contact.lastName) && (
                          <div className="text-[11px] text-muted-foreground">
                            {[contact.firstName, contact.lastName].filter(Boolean).join(' ')}
                          </div>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by row onClick
                        className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                      />
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>{selectedContactIds.length} contact(s) selected</span>
              {selectedContactIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedContactIds([])}
                  className="text-primary hover:underline"
                >
                  Clear selection
                </button>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddSelected}
              disabled={selectedContactIds.length === 0 || addContacts.isPending}
            >
              {addContacts.isPending ? 'Adding...' : 'Add Selected'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <Dialog
        open={!!removingContactId}
        onOpenChange={(v) => !v && setRemovingContactId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove from List</DialogTitle>
            <DialogDescription>
              Remove this contact from <span className="font-semibold">{currentList?.name}</span>?
              They will not be deleted from your main contacts database.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setRemovingContactId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={removeContact.isPending}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
