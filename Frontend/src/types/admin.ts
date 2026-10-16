import { Plan } from './billing';

export interface AdminUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  isSuper: boolean;
}

export interface AdminOverview {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  totalUsers: number;
  totalContacts: number;
  totalCampaigns: number;
  totalEmailsSent: number;
  activeSubscriptionsCount: number;
  estimatedMrrCents: number;
  recentTenants: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    createdAt: string;
    plan?: { name: string; code: string; priceCents: number } | null;
    _count: { users: number; contacts: number; campaigns: number };
  }>;
}

export interface AdminTenantItem {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended';
  bounceRate?: number | null;
  createdAt: string;
  plan?: {
    id: string;
    name: string;
    code: string;
    priceCents: number;
  } | null;
  subscriptions?: Array<{
    id: string;
    status: string;
    currentPeriodStart?: string | null;
    currentPeriodEnd?: string | null;
    cancelAtPeriodEnd?: boolean;
  }>;
  _count: {
    users: number;
    contacts: number;
    campaigns: number;
    lists: number;
  };
}

export interface AdminTenantDetail extends AdminTenantItem {
  users: Array<{
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    status: string;
    lastLoginAt?: string | null;
    createdAt: string;
    userRoles?: Array<{ role: { name: string } }>;
  }>;
  subscriptions: Array<{
    id: string;
    status: string;
    currentPeriodStart?: string | null;
    currentPeriodEnd?: string | null;
    cancelAtPeriodEnd?: boolean;
    plan?: Plan;
  }>;
}

export interface PlatformSettingItem {
  id: string;
  key: string;
  value: any;
  updatedAt: string;
}

export interface AdminLoginResponse {
  admin: AdminUser;
  accessToken: string;
  refreshToken: string;
}

export interface CreateAdminPlanPayload {
  name: string;
  code: string;
  priceCents: number;
  billingPeriod?: 'monthly' | 'yearly';
  planType?: string;
  isActive?: boolean;
  maxContacts?: number;
  maxLists?: number;
  maxEmailsMonth?: number;
  maxEmailsDay?: number;
  maxUsers?: number;
  maxCampaigns?: number;
  maxAutomations?: number;
  dedicatedIp?: boolean;
  aiEnabled?: boolean;
}

export interface UpdateAdminPlanPayload {
  name?: string;
  priceCents?: number;
  billingPeriod?: 'monthly' | 'yearly';
  isActive?: boolean;
  maxContacts?: number;
  maxLists?: number;
  maxEmailsMonth?: number;
  maxEmailsDay?: number;
  maxUsers?: number;
  maxCampaigns?: number;
  maxAutomations?: number;
  dedicatedIp?: boolean;
  aiEnabled?: boolean;
}
