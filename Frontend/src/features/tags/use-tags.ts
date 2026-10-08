import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiCall } from '@/lib/api';
import type {
  CreateSuppressionPayload,
  CreateTagPayload,
  Suppression,
  Tag,
} from '@/types/tags';

// ---- Tags ----

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: () => apiCall<Tag[]>(() => api.get('/tags')),
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTagPayload) =>
      apiCall<Tag>(() => api.post('/tags', payload)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/tags/${id}`).then(() => undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tags'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

// ---- Suppressions (Blacklist) ----

export function useSuppressions() {
  return useQuery({
    queryKey: ['suppressions'],
    queryFn: () => apiCall<Suppression[]>(() => api.get('/suppressions')),
  });
}

export function useCreateSuppression() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSuppressionPayload) =>
      apiCall<Suppression>(() => api.post('/suppressions', payload)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppressions'] });
    },
  });
}

export function useDeleteSuppression() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/suppressions/${id}`).then(() => undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppressions'] });
    },
  });
}
