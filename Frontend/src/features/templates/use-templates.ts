import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiCall } from '@/lib/api';
import type {
  CreateCategoryPayload,
  CreateTemplatePayload,
  ListTemplatesQuery,
  Template,
  TemplateCategory,
  UpdateCategoryPayload,
  UpdateTemplatePayload,
} from '@/types/templates';
import type { PaginatedResponse } from '@/types/contacts';

/**
 * Templates API layer — one hook per endpoint.
 *
 * Query key conventions:
 *   ['template-categories']
 *   ['templates', 'list', query]
 *   ['templates', 'detail', id]
 */

// ---- Template Categories ----

export function useTemplateCategories() {
  return useQuery({
    queryKey: ['template-categories'],
    queryFn: () =>
      apiCall<TemplateCategory[]>(() => api.get('/template-categories')),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) =>
      apiCall<TemplateCategory>(() => api.post('/template-categories', payload)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['template-categories'] });
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCategoryPayload }) =>
      apiCall<TemplateCategory>(() =>
        api.patch(`/template-categories/${id}`, payload),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['template-categories'] });
      qc.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/template-categories/${id}`).then(() => undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['template-categories'] });
      qc.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

// ---- Templates ----

export function useTemplates(query: ListTemplatesQuery = {}) {
  return useQuery({
    queryKey: ['templates', 'list', query],
    queryFn: () =>
      apiCall<PaginatedResponse<Template>>(() =>
        api.get('/templates', { params: query }),
      ),
    placeholderData: (prev) => prev,
  });
}

export function useTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ['templates', 'detail', id],
    queryFn: () => apiCall<Template>(() => api.get(`/templates/${id}`)),
    enabled: !!id,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTemplatePayload) =>
      apiCall<Template>(() => api.post('/templates', payload)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTemplatePayload }) =>
      apiCall<Template>(() => api.patch(`/templates/${id}`, payload)),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['templates', 'detail', variables.id] });
      qc.invalidateQueries({ queryKey: ['templates', 'list'] });
    },
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/templates/${id}`).then(() => undefined),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['templates', 'list'] });
      qc.removeQueries({ queryKey: ['templates', 'detail', id] });
    },
  });
}

export function useDuplicateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiCall<Template>(() => api.post(`/templates/${id}/duplicate`)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}
