export interface Tag {
  id: string;
  name: string;
  createdAt?: string;
}

export interface CreateTagPayload {
  name: string;
}

export type SuppressionReason = 'hard_bounce' | 'complaint' | 'unsubscribe' | 'manual';

export interface Suppression {
  id: string;
  email: string;
  reason: SuppressionReason;
  createdAt: string;
}

export interface CreateSuppressionPayload {
  email: string;
  reason: SuppressionReason;
}
