export type CampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'sending'
  | 'sent'
  | 'paused'
  | 'cancelled';

export interface CampaignTemplateRef {
  id: string;
  name: string;
  isGallery?: boolean;
}

export interface CampaignSignatureRef {
  id: string;
  name: string;
  fromName?: string;
  fromEmail: string;
  replyTo?: string | null;
  isVerified?: boolean;
}

export interface CampaignListRef {
  id: string;
  name: string;
}

export interface CampaignSegmentRef {
  id: string;
  name: string;
}

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  preheader?: string | null;
  fromName?: string | null;
  fromEmail?: string | null;
  status: CampaignStatus;
  scheduledAt?: string | null;
  sentAt?: string | null;
  templateId?: string | null;
  signatureId?: string | null;
  listId?: string | null;
  segmentId?: string | null;
  template?: CampaignTemplateRef | null;
  signature?: CampaignSignatureRef | null;
  list?: CampaignListRef | null;
  segment?: CampaignSegmentRef | null;
  recipientCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignPayload {
  name: string;
  subject: string;
  preheader?: string;
  fromName?: string;
  fromEmail?: string;
  signatureId?: string;
  templateId?: string;
  listId?: string;
  segmentId?: string;
}

export interface UpdateCampaignPayload {
  name?: string;
  subject?: string;
  preheader?: string;
  fromName?: string;
  fromEmail?: string;
  signatureId?: string;
  templateId?: string;
  listId?: string;
  segmentId?: string;
}

export interface ListCampaignsQuery {
  page?: number;
  limit?: number;
  status?: CampaignStatus;
  search?: string;
  templateId?: string;
}

export interface ScheduleCampaignPayload {
  scheduledAt: string; // ISO date string
}

export interface AudienceSummary {
  total: number;
  excluded: {
    unsubscribed: number;
    suppressed: number;
    blacklisted: number;
    duplicates: number;
  };
}

export interface CampaignAnalytics {
  campaign: {
    id: string;
    name: string;
    status: CampaignStatus;
    sentAt: string | null;
  };
  totals: {
    totalRecipients: number;
    sent: number;
    delivered: number;
    opens: number;
    uniqueOpens: number;
    clicks: number;
    bounces: number;
    complaints: number;
    unsubscribes: number;
  };
  rates: {
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
    complaintRate: number;
  };
}

export interface CampaignPreviewData {
  subject: string;
  preheader?: string | null;
  fromName?: string | null;
  fromEmail?: string | null;
  replyTo?: string | null;
  template?: { id: string; name: string } | null;
  html?: string | null;
}

export interface CampaignRecipient {
  id: string;
  campaignId: string;
  contactId: string;
  email: string;
  status: string;
  sentAt?: string | null;
  contact?: {
    firstName?: string | null;
    lastName?: string | null;
  };
}
