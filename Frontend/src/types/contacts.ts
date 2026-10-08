/**
 * Contact-related types — mirrors the backend Contact + ContactsController.
 *
 * Kept separate from types/api.ts because Contacts is one of the largest
 * domains in the app — its DTOs would drown the shared file. Same
 * convention any future big feature (Campaigns, Automations) should follow.
 *
 * Import from '@/types/contacts' rather than '@/types/api' for these.
 */

// ContactStatus — mirrors the Prisma enum exactly (server/prisma/schema.prisma
// `enum ContactStatus`). Only 4 values exist on the backend — there is no
// 'pending' status; ListContactsQueryDto's @IsEnum validator would 400 on
// it, so don't add it back without adding it to the backend enum first.
export type ContactStatus =
  | 'subscribed'
  | 'unsubscribed'
  | 'bounced'
  | 'complained';

// Contact — the model. Only fields the frontend uses. Backend may return
// more (like updatedAt); TypeScript tolerates extra keys, so no problem.
export interface Contact {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  attributes: Record<string, unknown> | null;
  status: ContactStatus;
  createdAt: string;
  // findOne() also nests lists + tags:
  lists?: Array<{ id: string; name: string }>;
  tags?: Array<{ id: string; name: string }>;
}

// GET /contacts query params — matches ListContactsQueryDto on the backend.
// All optional; pagination defaults (page=1, limit=20) are enforced there.
export interface ListContactsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: ContactStatus;
  listId?: string;
  tagId?: string;
}

// POST /contacts body
export interface CreateContactPayload {
  email: string;
  firstName?: string;
  lastName?: string;
  attributes?: Record<string, unknown>;
  status?: ContactStatus;
}

// PATCH /contacts/:id body
export interface UpdateContactPayload {
  firstName?: string;
  lastName?: string;
  attributes?: Record<string, unknown>;
  status?: ContactStatus;
}

export interface ImportContactItem {
  email: string;
  firstName?: string;
  lastName?: string;
  attributes?: Record<string, unknown>;
}

export interface ImportContactsPayload {
  contacts: ImportContactItem[];
  listId?: string;
}

export interface ImportContactsResponse {
  imported: number;
  skipped: number;
  errors: Array<{ email: string; reason: string }>;
}

// Standard paginated envelope from backend's `paginated()` helper
// (server/src/common/dto/pagination.dto.ts). Envelope shape:
// { success: true, data: { data, meta } }. Since apiCall() already
// unwraps the outer envelope, this is what we get. NOTE: the backend's
// meta key is `pages`, not `totalPages`.
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
