/**
 * Type definitions for the List Service
 * @module lib/list/types
 */

/**
 * Minimal list representation used for the dashboard grid.
 * Returned by getListsByUser — contains only columns needed for rendering.
 */
export interface ListSummary {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  isPublished: boolean;
  createdAt: Date;
  placeCount: number;
  tags: Array<{ name: string; source: "system" | "custom" }>;
}

/**
 * Full list record returned after a mutation.
 */
export interface ListRecord {
  id: string;
  userId: string;
  title: string;
  slug: string;
  description: string | null;
  isPublished: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/** Result of a successful createList operation */
export interface CreateListResult {
  list: ListRecord;
}

/** Result of a successful updateList operation */
export interface UpdateListResult {
  list: Pick<ListRecord, "id" | "title" | "description" | "updatedAt">;
}

/** Result of a successful deleteList operation */
export interface DeleteListResult {
  success: true;
  slug: string;
}

/** Result of a successful publishList operation */
export interface PublishListResult {
  list: Pick<ListRecord, "id" | "isPublished" | "publishedAt" | "slug"> & {
    vanitySlug: string | null;
  };
}

/** Result of a successful unpublishList operation */
export interface UnpublishListResult {
  list: Pick<ListRecord, "id" | "isPublished" | "publishedAt" | "slug"> & {
    vanitySlug: string | null;
  };
}
