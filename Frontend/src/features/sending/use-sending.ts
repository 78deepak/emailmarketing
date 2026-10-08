import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiCall } from '@/lib/api';
import type {
  CreateSendingDomainPayload,
  CreateSignaturePayload,
  SendingDomain,
  Signature,
  UpdateSignaturePayload,
} from '@/types/sending';

/**
 * Sending API layer — signatures and sending domains.
 *
 * Query key conventions:
 *   ['signatures']
 *   ['sending-domains']
 */

// ---- Signatures ----

export function useSignatures() {
  return useQuery({
    queryKey: ['signatures'],
    queryFn: () => apiCall<Signature[]>(() => api.get('/signatures')),
  });
}

export function useCreateSignature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSignaturePayload) =>
      apiCall<Signature>(() => api.post('/signatures', payload)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['signatures'] });
    },
  });
}

export function useUpdateSignature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSignaturePayload }) =>
      apiCall<Signature>(() => api.patch(`/signatures/${id}`, payload)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['signatures'] });
    },
  });
}

export function useDeleteSignature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/signatures/${id}`).then(() => undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['signatures'] });
    },
  });
}

export function useVerifySignature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiCall<Signature>(() => api.post(`/signatures/${id}/verify`)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['signatures'] });
    },
  });
}

export function useSetDefaultSignature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiCall<Signature>(() => api.post(`/signatures/${id}/default`)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['signatures'] });
    },
  });
}

// ---- Sending Domains ----

export function useSendingDomains() {
  return useQuery({
    queryKey: ['sending-domains'],
    queryFn: () => apiCall<SendingDomain[]>(() => api.get('/sending-domains')),
  });
}

export function useCreateSendingDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSendingDomainPayload) =>
      apiCall<SendingDomain>(() => api.post('/sending-domains', payload)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sending-domains'] });
    },
  });
}

export function useDeleteSendingDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/sending-domains/${id}`).then(() => undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sending-domains'] });
    },
  });
}

export function useVerifySendingDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiCall<SendingDomain>(() => api.post(`/sending-domains/${id}/verify`)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sending-domains'] });
    },
  });
}
