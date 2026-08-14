import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiCall } from '@/lib/api';
import type {
  Contact,
  CreateContactPayload,
  ListContactsQuery,
  PaginatedResponse,
  UpdateContactPayload,
} from '@/types/contacts';

/**
 * Contacts API layer — one hook per endpoint.
 *
 * Query key convention:
 *   ['contacts']                 -> anything contacts-related (invalidate root)
 *   ['contacts', 'list', query]  -> a specific listing page
 *   ['contacts', 'detail', id]   -> single contact
 *
 * Mutations invalidate the appropriate scope. On create/delete the ENTIRE
 * 'contacts' subtree is invalidated (list counts and pagination change).
 * On update, only the affected detail + list are invalidated.
 */

// ---- Reads ----

export function useContacts(query: ListContactsQuery) {
  return useQuery({
    queryKey: ['contacts', 'list', query],
    queryFn: () =>
      apiCall<PaginatedResponse<Contact>>(() =>
        api.get('/contacts', { params: query }),
      ),
    // Keep the previous page visible while a new page loads — no flash
    // of empty state during pagination clicks.
    placeholderData: (prev) => prev,
  });
}

export function useContact(id: string | undefined) {
  return useQuery({
    queryKey: ['contacts', 'detail', id],
    queryFn: () => apiCall<Contact>(() => api.get(`/contacts/${id}`)),
    enabled: !!id, // don't fire until we actually have an id
  });
}

// ---- Mutations ----

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateContactPayload) =>
      apiCall<Contact>(() => api.post('/contacts', payload)),
    onSuccess: () => {
      // Any list view might now be stale — invalidate all contact queries.
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateContactPayload }) =>
      apiCall<Contact>(() => api.patch(`/contacts/${id}`, payload)),
    onSuccess: (_data, variables) => {
      // Only the detail + all lists (status/name in list rows) need refresh.
      qc.invalidateQueries({ queryKey: ['contacts', 'detail', variables.id] });
      qc.invalidateQueries({ queryKey: ['contacts', 'list'] });
    },
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    // Backend soft-deletes and returns { message: 'Contact deleted' }.
    // We don't need the response — mutateAsync throws on 4xx/5xx anyway.
    mutationFn: (id: string) =>
      api.delete(`/contacts/${id}`).then(() => undefined),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['contacts', 'list'] });
      // Remove the cached detail — it's now soft-deleted, don't serve it stale.
      qc.removeQueries({ queryKey: ['contacts', 'detail', id] });
    },
  });
}
