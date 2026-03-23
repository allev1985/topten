/**
 * Tag repository helpers.
 *
 * Shared utility functions for working with tag query results.
 *
 * @module db/repositories/helpers/tag-helpers
 */

import type { EntityTagRow } from "@/db/repositories/tag.repository";
import type { TagSummary } from "@/lib/tag/types";

/**
 * Group flat entity-tag rows into a Map keyed by entity id.
 *
 * @param rows - Flat rows from a batch tag query
 * @returns Map of entityId → TagSummary[]
 */
export function groupTagsByEntity(
  rows: EntityTagRow[]
): Map<string, TagSummary[]> {
  const map = new Map<string, TagSummary[]>();
  for (const row of rows) {
    const arr = map.get(row.entityId) ?? [];
    arr.push({
      id: row.id,
      slug: row.slug,
      label: row.label,
      isSystem: row.isSystem,
    });
    map.set(row.entityId, arr);
  }
  return map;
}
