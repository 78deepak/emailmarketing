export type BuilderType = 'classic' | 'pro';

export interface TemplateCategory {
  id: string;
  tenantId?: string | null;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  tenantId?: string | null;
  name: string;
  builderType: BuilderType;
  categoryId?: string | null;
  designJson?: Record<string, unknown> | null;
  renderedHtml?: string | null;
  thumbnailUrl?: string | null;
  isGallery: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ListTemplatesQuery {
  page?: number;
  limit?: number;
  categoryId?: string;
  builderType?: BuilderType;
  search?: string;
  gallery?: 'true' | 'false';
}

export interface CreateTemplatePayload {
  name: string;
  builderType?: BuilderType;
  categoryId?: string;
  designJson?: Record<string, unknown>;
  renderedHtml?: string;
  thumbnailUrl?: string;
}

export interface UpdateTemplatePayload {
  name?: string;
  builderType?: BuilderType;
  categoryId?: string;
  designJson?: Record<string, unknown>;
  renderedHtml?: string;
  thumbnailUrl?: string;
}

export interface CreateCategoryPayload {
  name: string;
}

export interface UpdateCategoryPayload {
  name?: string;
}
