import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  List as ListIcon,
  Users,
  MoreHorizontal,
  Pencil,
  Trash2,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { useLists, useDeleteList } from '@/features/lists/use-lists';
import { normalizeAxiosError } from '@/lib/api';
import type { List } from '@/types/lists';

import { CreateListDialog } from './create-list-dialog';
import { EditListDialog } from './edit-list-dialog';

export default function ListsPage() {
  const { data: lists, isLoading } = useLists();
  const deleteList = useDeleteList();

  const [editingList, setEditingList] = useState<List | null>(null);
  const [deletingList, setDeletingList] = useState<List | null>(null);

  const handleDelete = async () => {
    if (!deletingList) return;
    try {
      await deleteList.mutateAsync(deletingList.id);
      toast.success('List deleted');
      setDeletingList(null);
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subscriber Lists</h1>
          <p className="text-sm text-muted-foreground">
            Segment and group your audience into targeted mailing lists.
          </p>
        </div>
        <CreateListDialog />
      </div>

      {/* Lists Grid / Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-card p-5 animate-pulse space-y-3"
            >
              <div className="h-5 w-32 rounded bg-muted" />
              <div className="h-4 w-48 rounded bg-muted/60" />
              <div className="pt-4 flex justify-between">
                <div className="h-5 w-20 rounded bg-muted" />
                <div className="h-5 w-16 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : !lists || lists.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/60 p-12 text-center">
          <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto text-muted-foreground">
            <ListIcon className="h-10 w-10 stroke-1 text-primary/70 mb-1" />
            <h2 className="text-lg font-semibold text-foreground">No lists created yet</h2>
            <p className="text-sm">
              Create your first audience list to categorize your subscribers for email campaigns.
            </p>
            <div className="pt-3">
              <CreateListDialog />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map((list) => (
            <div
              key={list.id}
              className="flex flex-col justify-between rounded-lg border border-border bg-card p-5 hover:border-primary/40 transition-colors shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <Link
                    to={`/app/lists/${list.id}`}
                    className="font-semibold text-foreground hover:text-primary transition-colors text-base line-clamp-1"
                  >
                    {list.name}
                  </Link>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem asChild>
                        <Link to={`/app/lists/${list.id}`}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Contacts
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingList(list)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit List
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeletingList(list)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete List
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <p className="mt-1 text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
                  {list.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-4 mt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  <span>{list.contactCount}</span>
                  <span className="font-normal text-muted-foreground">
                    subscriber{list.contactCount === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px]">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {new Date(list.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit List Dialog */}
      <EditListDialog
        list={editingList}
        open={!!editingList}
        onOpenChange={(v) => !v && setEditingList(null)}
      />

      {/* Delete List Confirmation Dialog */}
      <Dialog
        open={!!deletingList}
        onOpenChange={(v) => !v && setDeletingList(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Subscriber List</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold">{deletingList?.name}</span>?
              The list will be removed, but your contacts will remain intact in your main audience.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setDeletingList(null)}
              disabled={deleteList.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteList.isPending}
            >
              {deleteList.isPending ? 'Deleting...' : 'Delete List'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
