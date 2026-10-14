export interface WhiteLabelConfig {
  customDomain?: string;
  removeBranding?: boolean;
  footerText?: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  bounceRate?: number | null;
  whiteLabel?: WhiteLabelConfig | null;
  createdAt: string;
  plan?: {
    id: string;
    name: string;
    code: string;
    priceCents: number;
  } | null;
}

export interface UpdateTenantPayload {
  name?: string;
  whiteLabel?: WhiteLabelConfig;
}

export interface UserRoleItem {
  id: string;
  name: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  status: string;
  emailVerifiedAt?: string | null;
  mfaEnabled?: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  tenant?: {
    id: string;
    name: string;
    slug: string;
    status: string;
  } | null;
  roles?: UserRoleItem[];
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

export interface TeamMember {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  status: 'active' | 'invited' | 'suspended';
  emailVerifiedAt?: string | null;
  mfaEnabled?: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  roles?: UserRoleItem[];
}

export interface InviteUserPayload {
  email: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  permissions: string[];
}

export interface Permission {
  id: string;
  key: string;
  description?: string;
  category?: string;
}
