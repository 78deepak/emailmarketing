import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiCall } from '@/lib/api';
import type {
  AdminOverview,
  AdminTenantItem,
  AdminTenantDetail,
  PlatformSettingItem,
  CreateAdminPlanPayload,
  UpdateAdminPlanPayload,
} from '@/types/admin';
import type { Plan } from '@/types/billing';
import { useAuthStore } from '@/stores/auth.store';

export function useAdminOverview() {
  const isSuper = useAuthStore((s) => s.user?.isPlatformAdmin);

  return useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: () => apiCall<AdminOverview>(() => api.get('/admin/overview')),
    enabled: !!isSuper,
  });
}

export function useAdminTenants(
  page = 1,
  limit = 20,
  search = '',
  status = '',
) {
  const isSuper = useAuthStore((s) => s.user?.isPlatformAdmin);

  return useQuery({
    queryKey: ['admin', 'tenants', { page, limit, search, status }],
    queryFn: async () => {
      const res = await apiCall<{
        data: AdminTenantItem[];
        meta?: { total: number; page: number; limit: number };
      }>(() =>
        api.get('/admin/tenants', {
          params: { page, limit, search: search || undefined, status: status || undefined },
        }),
      );
      if (Array.isArray(res)) {
        return { data: res, total: res.length };
      }
      return {
        data: res.data || [],
        total: res.meta?.total ?? (res.data ? res.data.length : 0),
      };
    },
    enabled: !!isSuper,
  });
}

export function useAdminTenant(id: string | undefined) {
  const isSuper = useAuthStore((s) => s.user?.isPlatformAdmin);

  return useQuery({
    queryKey: ['admin', 'tenant', id],
    queryFn: () =>
      apiCall<AdminTenantDetail>(() => api.get(`/admin/tenants/${id}`)),
    enabled: !!isSuper && !!id,
  });
}

export function useUpdateTenantStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: 'active' | 'suspended';
    }) =>
      apiCall<{ id: string; status: string }>(() =>
        api.patch(`/admin/tenants/${id}/status`, { status }),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'tenants'] });
      qc.invalidateQueries({ queryKey: ['admin', 'overview'] });
    },
  });
}

export function useUpdateTenantPlan() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, planId }: { id: string; planId: string }) =>
      apiCall<{ id: string }>(() =>
        api.patch(`/admin/tenants/${id}/plan`, { planId }),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'tenants'] });
    },
  });
}

// ---------------- PLANS MANAGEMENT ----------------

export function useAdminPlans() {
  const isSuper = useAuthStore((s) => s.user?.isPlatformAdmin);

  return useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: () => apiCall<Plan[]>(() => api.get('/admin/plans')),
    enabled: !!isSuper,
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAdminPlanPayload) =>
      apiCall<Plan>(() => api.post('/admin/plans', payload)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'plans'] });
      qc.invalidateQueries({ queryKey: ['billing', 'plans'] });
    },
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateAdminPlanPayload & { id: string }) =>
      apiCall<Plan>(() => api.patch(`/admin/plans/${id}`, payload)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'plans'] });
      qc.invalidateQueries({ queryKey: ['billing', 'plans'] });
    },
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiCall<{ id: string }>(() => api.delete(`/admin/plans/${id}`)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'plans'] });
      qc.invalidateQueries({ queryKey: ['billing', 'plans'] });
    },
  });
}

// ---------------- SETTINGS ----------------

export function useAdminSettings() {
  const isSuper = useAuthStore((s) => s.user?.isPlatformAdmin);

  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () =>
      apiCall<PlatformSettingItem[]>(() => api.get('/admin/settings')),
    enabled: !!isSuper,
  });
}

export function useUpdateAdminSetting() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: { key: string; value: any }) =>
      apiCall<PlatformSettingItem>(() => api.patch('/admin/settings', payload)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'settings'] });
    },
  });
}
