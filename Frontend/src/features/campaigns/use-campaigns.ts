import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiCall } from '@/lib/api';
import type {
  AudienceSummary,
  Campaign,
  CampaignAnalytics,
  CampaignPreviewData,
  CampaignRecipient,
  CreateCampaignPayload,
  ListCampaignsQuery,
  ScheduleCampaignPayload,
  UpdateCampaignPayload,
} from '@/types/campaigns';
import type { PaginatedResponse } from '@/types/contacts';

/**
 * Campaigns API hooks layer.
 *
 * Query key conventions:
 *   ['campaigns']
 *   ['campaigns', 'list', query]
 *   ['campaigns', 'detail', id]
 *   ['campaigns', 'recipients', id, page, limit]
 *   ['campaigns', 'analytics', id]
 *   ['campaigns', 'preview', id]
 */

// ---- Reads ----

export function useCampaigns(query: ListCampaignsQuery = {}) {
  return useQuery({
    queryKey: ['campaigns', 'list', query],
    queryFn: () =>
      apiCall<PaginatedResponse<Campaign>>(() =>
        api.get('/campaigns', { params: query }),
      ),
    placeholderData: (prev) => prev,
  });
}

export function useCampaign(id: string | undefined) {
  return useQuery({
    queryKey: ['campaigns', 'detail', id],
    queryFn: () => apiCall<Campaign>(() => api.get(`/campaigns/${id}`)),
    enabled: !!id,
  });
}

export function useCampaignRecipients(id: string | undefined, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['campaigns', 'recipients', id, page, limit],
    queryFn: () =>
      apiCall<PaginatedResponse<CampaignRecipient>>(() =>
        api.get(`/campaigns/${id}/recipients`, { params: { page, limit } }),
      ),
    enabled: !!id,
    placeholderData: (prev) => prev,
  });
}

export function useCampaignAnalytics(id: string | undefined) {
  return useQuery({
    queryKey: ['campaigns', 'analytics', id],
    queryFn: () =>
      apiCall<CampaignAnalytics>(() => api.get(`/campaigns/${id}/analytics`)),
    enabled: !!id,
    refetchInterval: (query) => {
      // Poll every 10 seconds if sending
      const status = query.state.data?.campaign.status;
      return status === 'sending' ? 10000 : false;
    },
  });
}

export function useCampaignPreview(id: string | undefined) {
  return useQuery({
    queryKey: ['campaigns', 'preview', id],
    queryFn: () =>
      apiCall<CampaignPreviewData>(() => api.get(`/campaigns/${id}/preview`)),
    enabled: !!id,
  });
}

// ---- Mutations ----

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCampaignPayload) =>
      apiCall<Campaign>(() => api.post('/campaigns', payload)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCampaignPayload }) =>
      apiCall<Campaign>(() => api.patch(`/campaigns/${id}`, payload)),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['campaigns', 'detail', vars.id] });
      qc.invalidateQueries({ queryKey: ['campaigns', 'list'] });
      qc.invalidateQueries({ queryKey: ['campaigns', 'preview', vars.id] });
    },
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/campaigns/${id}`).then(() => undefined),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['campaigns', 'list'] });
      qc.removeQueries({ queryKey: ['campaigns', 'detail', id] });
    },
  });
}

export function useDuplicateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiCall<Campaign>(() => api.post(`/campaigns/${id}/duplicate`)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useScheduleCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ScheduleCampaignPayload }) =>
      apiCall<Campaign>(() => api.post(`/campaigns/${id}/schedule`, payload)),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['campaigns', 'detail', vars.id] });
      qc.invalidateQueries({ queryKey: ['campaigns', 'list'] });
    },
  });
}

export function useUnscheduleCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiCall<Campaign>(() => api.post(`/campaigns/${id}/unschedule`)),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['campaigns', 'detail', id] });
      qc.invalidateQueries({ queryKey: ['campaigns', 'list'] });
    },
  });
}

export function usePauseCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiCall<Campaign>(() => api.post(`/campaigns/${id}/pause`)),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['campaigns', 'detail', id] });
      qc.invalidateQueries({ queryKey: ['campaigns', 'list'] });
    },
  });
}

export function useResumeCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiCall<Campaign>(() => api.post(`/campaigns/${id}/resume`)),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['campaigns', 'detail', id] });
      qc.invalidateQueries({ queryKey: ['campaigns', 'list'] });
    },
  });
}

export function useCancelCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiCall<Campaign>(() => api.post(`/campaigns/${id}/cancel`)),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['campaigns', 'detail', id] });
      qc.invalidateQueries({ queryKey: ['campaigns', 'list'] });
    },
  });
}

export function useResolveRecipients() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiCall<AudienceSummary>(() =>
        api.post(`/campaigns/${id}/resolve-recipients`),
      ),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['campaigns', 'detail', id] });
      qc.invalidateQueries({ queryKey: ['campaigns', 'recipients', id] });
    },
  });
}
