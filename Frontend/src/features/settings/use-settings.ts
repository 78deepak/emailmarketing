import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiCall } from '@/lib/api';
import type {
  Tenant,
  UpdateTenantPayload,
  UserProfile,
  UpdateProfilePayload,
  ChangePasswordPayload,
  TeamMember,
  InviteUserPayload,
  Role,
  Permission,
} from '@/types/settings';
import { useAuthStore } from '@/stores/auth.store';

/**
 * useTenant — reads GET /tenants/current.
 */
export function useTenant() {
  const authed = useAuthStore((s) => s.isAuthenticated());

  return useQuery({
    queryKey: ['tenants', 'current'],
    queryFn: () => apiCall<Tenant>(() => api.get('/tenants/current')),
    enabled: authed,
  });
}

/**
 * useUpdateTenant — updates workspace details via PATCH /tenants/current.
 */
export function useUpdateTenant() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateTenantPayload) =>
      apiCall<Tenant>(() => api.patch('/tenants/current', payload)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants', 'current'] });
    },
  });
}

/**
 * useProfile — reads GET /users/me.
 */
export function useProfile() {
  const authed = useAuthStore((s) => s.isAuthenticated());

  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => apiCall<UserProfile>(() => api.get('/users/me')),
    enabled: authed,
  });
}

/**
 * useUpdateProfile — updates user name via PATCH /users/me.
 */
export function useUpdateProfile() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      apiCall<UserProfile>(() => api.patch('/users/me', payload)),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['users', 'me'] });
      // Also update local auth store if available
      const store = useAuthStore.getState();
      if (store.user) {
        useAuthStore.setState({
          user: {
            ...store.user,
            firstName: updated.firstName,
            lastName: updated.lastName,
          },
        });
      }
    },
  });
}

/**
 * useChangePassword — updates password via PATCH /users/me/password.
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) =>
      apiCall<{ message: string }>(() =>
        api.patch('/users/me/password', payload),
      ),
  });
}

/**
 * useTeamMembers — reads GET /users.
 */
export function useTeamMembers(page = 1, limit = 50) {
  const authed = useAuthStore((s) => s.isAuthenticated());

  return useQuery({
    queryKey: ['users', 'team', page, limit],
    queryFn: async () => {
      const res = await apiCall<{ data: TeamMember[]; meta?: { total: number } }>(
        () => api.get(`/users?page=${page}&limit=${limit}`),
      );
      // apiCall unwraps paginated response as { data: [...], meta: {...} } or array
      if (Array.isArray(res)) {
        return { data: res, total: res.length };
      }
      return {
        data: res.data || [],
        total: res.meta?.total ?? (res.data ? res.data.length : 0),
      };
    },
    enabled: authed,
  });
}

/**
 * useInviteMember — invites a user via POST /users/invite.
 */
export function useInviteMember() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: InviteUserPayload) =>
      apiCall<TeamMember>(() => api.post('/users/invite', payload)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users', 'team'] });
    },
  });
}

/**
 * useDeactivateMember — deactivates a user via DELETE /users/:id.
 */
export function useDeactivateMember() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) =>
      apiCall<{ message: string }>(() => api.delete(`/users/${userId}`)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users', 'team'] });
    },
  });
}

/**
 * useRoles — reads GET /roles.
 */
export function useRoles() {
  const authed = useAuthStore((s) => s.isAuthenticated());

  return useQuery({
    queryKey: ['roles'],
    queryFn: () => apiCall<Role[]>(() => api.get('/roles')),
    enabled: authed,
  });
}

/**
 * usePermissions — reads GET /permissions.
 */
export function usePermissions() {
  const authed = useAuthStore((s) => s.isAuthenticated());

  return useQuery({
    queryKey: ['permissions'],
    queryFn: () => apiCall<Permission[] | string[]>(() => api.get('/permissions')),
    enabled: authed,
  });
}
