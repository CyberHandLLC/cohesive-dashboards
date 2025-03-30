
export type ContentType = 'BLOG' | 'ARTICLE' | 'ANNOUNCEMENT' | 'NEWSLETTER';
export type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type ContentPlatform = 'WEBSITE' | 'EMAIL' | 'SOCIAL_MEDIA' | 'OTHER';

export interface Content {
  id: string;
  title: string;
  body: string;
  contentType: ContentType;
  status: ContentStatus;
  tags: string[];
  publishedAt: string | null;
  client_id: string | null; 
  platform: ContentPlatform | null;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContentData {
  title: string;
  body: string;
  contentType?: ContentType;
  status?: ContentStatus;
  tags?: string[];
  publishedAt?: string | null;
  client_id?: string | null;
  platform?: ContentPlatform | null;
  authorId: string;
}

export interface UpdateContentData {
  title?: string;
  body?: string;
  contentType?: ContentType;
  status?: ContentStatus;
  tags?: string[];
  publishedAt?: string | null;
  client_id?: string | null;
  platform?: ContentPlatform | null;
}
