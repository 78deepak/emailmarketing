export interface PlanCurrency {
  id: string;
  code: string;
  symbol: string;
  name: string;
  exchangeRate?: string;
  isBase?: boolean;
  isActive?: boolean;
}

export interface PlanLimit {
  id?: string;
  planId?: string;
  maxContacts: number | null;
  maxLists: number | null;
  maxEmailsMonth: number | null;
  maxEmailsDay: number | null;
  maxSubscribers?: number | null;
  maxUsers: number | null;
  maxCampaigns: number | null;
  maxAutomations: number | null;
  dedicatedIp: boolean;
  aiEnabled: boolean;
}

export interface Plan {
  id: string;
  name: string;
  code: string;
  priceCents: number;
  currencyId?: string | null;
  billingPeriod: 'monthly' | 'yearly';
  planType: string;
  isActive: boolean;
  createdAt?: string;
  planLimit?: PlanLimit | null;
  currency?: PlanCurrency | null;
}

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'unpaid'
  | 'ended'
  | 'pending';

export interface Subscription {
  id: string;
  tenantId?: string;
  status: SubscriptionStatus;
  planId: string;
  provider?: string | null;
  providerSubId?: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  isRecurring?: boolean;
  subscribedAt?: string;
  endedAt?: string | null;
  plan?: Plan | null;
}

export interface CreateCheckoutPayload {
  planId: string;
}

export interface CheckoutResult {
  checkoutUrl?: string;
  razorpaySubscriptionId?: string;
}

export interface CancelSubscriptionResult {
  message: string;
}
