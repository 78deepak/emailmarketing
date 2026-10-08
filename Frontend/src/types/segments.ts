import type { Contact, PaginatedResponse } from './contacts';

export type SegmentOperator = 'eq' | 'neq' | 'contains';

export interface SegmentCondition {
  field: string; // 'status' | 'email' | 'firstName' | 'lastName' | 'attributes.<key>'
  op: SegmentOperator;
  value: string;
}

export interface SegmentRules {
  match: 'all' | 'any';
  conditions: SegmentCondition[];
}

export interface Segment {
  id: string;
  name: string;
  rules: SegmentRules;
  createdAt: string;
}

export interface CreateSegmentPayload {
  name: string;
  rules: SegmentRules;
}

export interface UpdateSegmentPayload {
  name?: string;
  rules?: SegmentRules;
}

export interface SegmentPreviewResponse extends PaginatedResponse<Contact> {
  meta: PaginatedResponse<Contact>['meta'] & {
    matchCount: number;
  };
}
