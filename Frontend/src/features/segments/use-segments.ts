import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiCall } from '@/lib/api';
import type {
  CreateSegmentPayload,
  Segment,
  SegmentPreviewResponse,
  UpdateSegmentPayload,
} from '@/types/segments';

// ---- Reads ----

export function useSegments() {
  return useQuery({
    queryKey: ['segments'],
    queryFn: () => apiCall<Segment[]>(() => api.get('/segments')),
  });
}

export function useSegmentPreview(id: string | undefined, page = 1, limit = 10) {
  return useQuery({
    queryKey: ['segments', id, 'preview', { page, limit }],
    queryFn: () =>
      apiCall<SegmentPreviewResponse>(() =>
        api.get(`/segments/${id}/preview`, { params: { page, limit } }),
      ),
    enabled: !!id,
    placeholderData: (prev) => prev,
  });
}

// ---- Mutations ----

export function useCreateSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSegmentPayload) =>
      apiCall<Segment>(() => api.post('/segments', payload)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['segments'] });
    },
  });
}

export function useUpdateSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSegmentPayload }) =>
      apiCall<Segment>(() => api.patch(`/segments/${id}`, payload)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['segments'] });
    },
  });
}

export function useDeleteSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/segments/${id}`).then(() => undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['segments'] });
    },
  });
}
