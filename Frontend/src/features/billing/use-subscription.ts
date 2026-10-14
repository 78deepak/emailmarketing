import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiCall } from '@/lib/api';
import type {
  Plan,
  Subscription,
  CreateCheckoutPayload,
  CheckoutResult,
  CancelSubscriptionResult,
} from '@/types/billing';
import { useAuthStore } from '@/stores/auth.store';

/**
 * usePlans — reads public GET /plans.
 * Plans are marketing content, accessible without auth.
 */
export function usePlans() {
  return useQuery({
    queryKey: ['billing', 'plans'],
    queryFn: () => apiCall<Plan[]>(() => api.get('/plans')),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * useSubscription — reads GET /billing/subscription.
 * Returns the active subscription for the current tenant.
 */
export function useSubscription() {
  const authed = useAuthStore((s) => s.isAuthenticated());

  return useQuery({
    queryKey: ['billing', 'subscription'],
    queryFn: () =>
      apiCall<Subscription | null>(() => api.get('/billing/subscription')),
    enabled: authed,
    staleTime: 30 * 1000,
  });
}

/**
 * useCreateCheckout — mutation for POST /billing/subscription/checkout.
 * Returns checkoutUrl and razorpaySubscriptionId.
 */
export function useCreateCheckout() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCheckoutPayload) =>
      apiCall<CheckoutResult>(() =>
        api.post('/billing/subscription/checkout', payload),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['billing', 'subscription'] });
    },
  });
}

/**
 * useCancelSubscription — mutation for POST /billing/subscription/cancel.
 */
export function useCancelSubscription() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiCall<CancelSubscriptionResult>(() =>
        api.post('/billing/subscription/cancel'),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['billing', 'subscription'] });
    },
  });
}
