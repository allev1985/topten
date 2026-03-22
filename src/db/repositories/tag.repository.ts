/**
 * Tag Repository
 *
 * Pure data-access functions for the tags, list_tags, and place_tags tables.
 * No business logic — all validation and error translation live in the service layer.
 *
 * @module db/repositories/tag.repository
 */

import { eq, and, isNull, ilike, inArray } from "drizzle-orm";
import { db } from "@/db";
import { tags } from "@/db/schema/tag";
import { listTags } from "@/db/schema/listTag";
import { placeTags } from "@/db/schema/placeTag";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TagRow = typeof tags.$inferSelect;

export type TagSummaryRow = {
  id: string;
  name: string;
  source: "system" | "custom";
};

export type ListTagRow = typeof listTags.$inferSelect;
export type PlaceTagRow = typeof placeTags.$inferSelect;

// ─── Tag queries ──────────────────────────────────────────────────────────────

/**
 * Search tags by name prefix (case-insensitive).
 *
 * @param query - Search prefix
 * @param limit - Maximum results (default 20)
 * @returns Matching tag summary rows
 */
export async function searchTags(
  query: string,
  limit = 20
): Promise<TagSummaryRow[]> {
  return db
    .select({ id: tags.id, name: tags.name, source: tags.source })
    .from(tags)
    .where(ilike(tags.name, `${query}%`))
    .limit(limit);
}

/**
 * Get a tag by exact name.
 *
 * @param name - Exact tag name (lowercase kebab-case)
 * @returns The tag row or null
 */
export async function getTagByName(name: string): Promise<TagRow | null> {
  const rows = await db.select().from(tags).where(eq(tags.name, name)).limit(1);
  return rows[0] ?? null;
}

/**
 * Get multiple tags by their IDs.
 *
 * @param ids - Array of tag UUIDs
 * @returns Array of matching tag rows
 */
export async function getTagsByIds(ids: string[]): Promise<TagRow[]> {
  if (ids.length === 0) return [];
  return db.select().from(tags).where(inArray(tags.id, ids));
}

/**
 * Insert a new tag.
 *
 * @param values - Tag name and source
 * @returns The inserted tag row
 */
export async function insertTag(values: {
  name: string;
  source: "system" | "custom";
}): Promise<TagRow> {
  const rows = await db.insert(tags).values(values).returning();
  const row = rows[0];
  if (!row) throw new Error("Tag insert returned no row.");
  return row;
}

/**
 * Upsert a tag by name — insert if not exists, return existing if it does.
 *
 * @param values - Tag name and source
 * @returns The tag row (existing or newly created)
 */
export async function upsertTag(values: {
  name: string;
  source: "system" | "custom";
}): Promise<TagRow> {
  const rows = await db
    .insert(tags)
    .values(values)
    .onConflictDoNothing({ target: tags.name })
    .returning();

  if (rows[0]) return rows[0];

  // Conflict occurred — fetch existing
  const existing = await getTagByName(values.name);
  if (!existing)
    throw new Error("Tag upsert failed: conflict but no row found");
  return existing;
}

// ─── List tag queries ─────────────────────────────────────────────────────────

/**
 * Get active tags for a list.
 *
 * @param listId - The list UUID
 * @returns Array of tag summary rows
 */
export async function getTagsByList(listId: string): Promise<TagSummaryRow[]> {
  return db
    .select({ id: tags.id, name: tags.name, source: tags.source })
    .from(listTags)
    .innerJoin(tags, eq(listTags.tagId, tags.id))
    .where(and(eq(listTags.listId, listId), isNull(listTags.deletedAt)));
}

/**
 * Replace all tags on a list. Soft-deletes removed tags and restores/inserts new ones.
 *
 * @param listId - The list UUID
 * @param tagIds - The desired set of tag IDs
 */
export async function setListTags(
  listId: string,
  tagIds: string[]
): Promise<void> {
  await db.transaction(async (tx) => {
    // Soft-delete all current active tags
    await tx
      .update(listTags)
      .set({ deletedAt: new Date() })
      .where(and(eq(listTags.listId, listId), isNull(listTags.deletedAt)));

    if (tagIds.length === 0) return;

    // Insert new associations (ignore conflicts from soft-deleted rows)
    for (const tagId of tagIds) {
      // Check if a row exists (active or deleted)
      const existing = await tx
        .select({ id: listTags.id, deletedAt: listTags.deletedAt })
        .from(listTags)
        .where(and(eq(listTags.listId, listId), eq(listTags.tagId, tagId)))
        .limit(1);

      if (existing[0]) {
        // Restore if soft-deleted
        await tx
          .update(listTags)
          .set({ deletedAt: null })
          .where(eq(listTags.id, existing[0].id));
      } else {
        await tx.insert(listTags).values({ listId, tagId });
      }
    }
  });
}

// ─── Place tag queries ────────────────────────────────────────────────────────

/**
 * Get active tags for a place.
 *
 * @param placeId - The place UUID
 * @returns Array of tag summary rows
 */
export async function getTagsByPlace(
  placeId: string
): Promise<TagSummaryRow[]> {
  return db
    .select({ id: tags.id, name: tags.name, source: tags.source })
    .from(placeTags)
    .innerJoin(tags, eq(placeTags.tagId, tags.id))
    .where(and(eq(placeTags.placeId, placeId), isNull(placeTags.deletedAt)));
}

/**
 * Replace all tags on a place. Soft-deletes removed tags and restores/inserts new ones.
 *
 * @param placeId - The place UUID
 * @param tagIds - The desired set of tag IDs
 */
export async function setPlaceTags(
  placeId: string,
  tagIds: string[]
): Promise<void> {
  await db.transaction(async (tx) => {
    // Soft-delete all current active tags
    await tx
      .update(placeTags)
      .set({ deletedAt: new Date() })
      .where(and(eq(placeTags.placeId, placeId), isNull(placeTags.deletedAt)));

    if (tagIds.length === 0) return;

    for (const tagId of tagIds) {
      const existing = await tx
        .select({ id: placeTags.id, deletedAt: placeTags.deletedAt })
        .from(placeTags)
        .where(and(eq(placeTags.placeId, placeId), eq(placeTags.tagId, tagId)))
        .limit(1);

      if (existing[0]) {
        await tx
          .update(placeTags)
          .set({ deletedAt: null })
          .where(eq(placeTags.id, existing[0].id));
      } else {
        await tx.insert(placeTags).values({ placeId, tagId });
      }
    }
  });
}
