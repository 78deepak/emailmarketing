import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiCall } from '@/lib/api';
import type {
  Automation,
  AutomationRun,
  CreateAutomationPayload,
  EnrollPayload,
  SetStepsPayload,
  UpdateAutomationPayload,
} from '@/types/automations';
import type { PaginatedResponse } from '@/types/contacts';

/**
 * Automations API hooks layer.
 *
 * Query key conventions:
 *   ['automations']
 *   ['automations', 'list', page, limit]
 *   ['automations', 'detail', id]
 *   ['automations', 'runs', id, page, limit, status]
 */

// ---- Reads ----

export function useAutomations(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['automations', 'list', page, limit],
    queryFn: () =>
      apiCall<PaginatedResponse<Automation>>(() =>
        api.get('/automations', { params: { page, limit } }),
      ),
    placeholderData: (prev) => prev,
  });
}

export function useAutomation(id: string | undefined) {
  return useQuery({
    queryKey: ['automations', 'detail', id],
    queryFn: () => apiCall<Automation>(() => api.get(`/automations/${id}`)),
    enabled: !!id,
  });
}

export function useAutomationRuns(
  id: string | undefined,
  page = 1,
  limit = 20,
  status?: string,
) {
  return useQuery({
    queryKey: ['automations', 'runs', id, page, limit, status],
    queryFn: () =>
      apiCall<PaginatedResponse<AutomationRun>>(() =>
        api.get(`/automations/${id}/runs`, {
          params: { page, limit, status: status || undefined },
        }),
      ),
    enabled: !!id,
    placeholderData: (prev) => prev,
  });
}

// ---- Mutations ----

export function useCreateAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAutomationPayload) =>
      apiCall<Automation>(() => api.post('/automations', payload)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['automations'] });
    },
  });
}

export function useUpdateAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAutomationPayload }) =>
      apiCall<Automation>(() => api.patch(`/automations/${id}`, payload)),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['automations', 'detail', vars.id] });
      qc.invalidateQueries({ queryKey: ['automations', 'list'] });
    },
  });
}

export function useDeleteAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/automations/${id}`).then(() => undefined),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['automations', 'list'] });
      qc.removeQueries({ queryKey: ['automations', 'detail', id] });
    },
  });
}

export function useSetAutomationSteps() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SetStepsPayload }) =>
      apiCall<Automation>(() => api.put(`/automations/${id}/steps`, payload)),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['automations', 'detail', vars.id] });
    },
  });
}

export function useActivateAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiCall<Automation>(() => api.post(`/automations/${id}/activate`)),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['automations', 'detail', id] });
      qc.invalidateQueries({ queryKey: ['automations', 'list'] });
    },
  });
}

export function usePauseAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiCall<Automation>(() => api.post(`/automations/${id}/pause`)),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['automations', 'detail', id] });
      qc.invalidateQueries({ queryKey: ['automations', 'list'] });
    },
  });
}

export function useEnrollContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EnrollPayload }) =>
      apiCall<{ message: string; runId?: string }>(() =>
        api.post(`/automations/${id}/enroll`, payload),
      ),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['automations', 'runs', vars.id] });
    },
  });
}
