import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiCall } from '@/lib/api';
import type { Contact, PaginatedResponse } from '@/types/contacts';
import type {
  AddContactsToListPayload,
  CreateListPayload,
  List,
  UpdateListPayload,
} from '@/types/lists';

// ---- Reads ----

export function useLists() {
  return useQuery({
    queryKey: ['lists'],
    queryFn: () => apiCall<List[]>(() => api.get('/lists')),
  });
}

export function useListContacts(listId: string | undefined, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['lists', listId, 'contacts', { page, limit }],
    queryFn: () =>
      apiCall<PaginatedResponse<Contact>>(() =>
        api.get(`/lists/${listId}/contacts`, { params: { page, limit } }),
      ),
    enabled: !!listId,
    placeholderData: (prev) => prev,
  });
}

// ---- Mutations ----

export function useCreateList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateListPayload) =>
      apiCall<List>(() => api.post('/lists', payload)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lists'] });
    },
  });
}

export function useUpdateList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateListPayload }) =>
      apiCall<List>(() => api.patch(`/lists/${id}`, payload)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lists'] });
    },
  });
}

export function useDeleteList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/lists/${id}`).then(() => undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lists'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useAddContactsToList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, payload }: { listId: string; payload: AddContactsToListPayload }) =>
      apiCall<{ added: number; skipped: number }>(() =>
        api.post(`/lists/${listId}/contacts`, payload),
      ),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['lists'] });
      qc.invalidateQueries({ queryKey: ['lists', variables.listId, 'contacts'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useRemoveContactFromList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, contactId }: { listId: string; contactId: string }) =>
      apiCall<{ message: string }>(() =>
        api.delete(`/lists/${listId}/contacts/${contactId}`),
      ),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['lists'] });
      qc.invalidateQueries({ queryKey: ['lists', variables.listId, 'contacts'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}
