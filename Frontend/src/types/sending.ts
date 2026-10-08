export interface Signature {
  id: string;
  tenantId: string;
  name: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string | null;
  isVerified: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSignaturePayload {
  name: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
}

export interface UpdateSignaturePayload {
  name?: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
}

export type SendingDomainStatus = 'pending' | 'verified' | 'failed';

export interface SendingDomain {
  id: string;
  tenantId: string;
  domain: string;
  status: SendingDomainStatus;
  spfVerified: boolean;
  dkimVerified: boolean;
  dmarcVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSendingDomainPayload {
  domain: string;
}
