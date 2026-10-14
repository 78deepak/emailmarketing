import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { api, apiCall } from '@/lib/api';
import type {
  CreateFormPayload,
  Form,
  FormSubmission,
  SubmitFormPayload,
  UpdateFormPayload,
} from '@/types/forms';
import type { PaginatedResponse } from '@/types/contacts';

/**
 * Forms API layer.
 *
 * Query key conventions:
 *   ['forms']
 *   ['forms', 'list', page, limit]
 *   ['forms', 'detail', id]
 *   ['forms', 'submissions', id, page, limit]
 */

// ---- Admin Reads ----

export function useForms(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['forms', 'list', page, limit],
    queryFn: () =>
      apiCall<PaginatedResponse<Form>>(() =>
        api.get('/forms', { params: { page, limit } }),
      ),
    placeholderData: (prev) => prev,
  });
}

export function useForm(id: string | undefined) {
  return useQuery({
    queryKey: ['forms', 'detail', id],
    queryFn: () => apiCall<Form>(() => api.get(`/forms/${id}`)),
    enabled: !!id,
  });
}

export function useFormSubmissions(id: string | undefined, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['forms', 'submissions', id, page, limit],
    queryFn: () =>
      apiCall<PaginatedResponse<FormSubmission>>(() =>
        api.get(`/forms/${id}/submissions`, { params: { page, limit } }),
      ),
    enabled: !!id,
    placeholderData: (prev) => prev,
  });
}

// ---- Admin Mutations ----

export function useCreateForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFormPayload) =>
      apiCall<Form>(() => api.post('/forms', payload)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forms'] });
    },
  });
}

export function useUpdateForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateFormPayload }) =>
      apiCall<Form>(() => api.patch(`/forms/${id}`, payload)),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['forms', 'detail', vars.id] });
      qc.invalidateQueries({ queryKey: ['forms', 'list'] });
    },
  });
}

export function useDeleteForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/forms/${id}`).then(() => undefined),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['forms', 'list'] });
      qc.removeQueries({ queryKey: ['forms', 'detail', id] });
    },
  });
}

// ---- Public Endpoints ----

export function useSubmitPublicForm() {
  return useMutation({
    mutationFn: ({
      formId,
      payload,
    }: {
      formId: string;
      payload: SubmitFormPayload;
    }) =>
      axios
        .post<{ success: boolean; data: { message: string; submissionId: string } }>(
          `/api/public/forms/${formId}/submissions`,
          payload,
        )
        .then((res) => res.data.data),
  });
}

export function useConsumeUnsubscribe(token: string | undefined) {
  return useQuery({
    queryKey: ['unsubscribe', token],
    queryFn: () =>
      axios
        .get<{ success: boolean; data: { message: string } }>(
          `/api/unsubscribe/${token}`,
        )
        .then((res) => res.data.data),
    enabled: !!token,
    retry: false,
  });
}
