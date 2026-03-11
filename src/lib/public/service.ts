/**
 * Public Service
 *
 * Centralised service for reading public profile and list data.
 * All functions are wrapped in React.cache so repeated calls within
 * the same request (e.g. layout + page) are deduplicated.
 *
 * Used by Server Components only — never called from client code.
 *
 * @module public/service
 */

import { cache } from "react";
import { eq, and, isNull, desc, count, asc, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema/user";
import { lists } from "@/db/schema/list";
import { listPlaces } from "@/db/schema/listPlace";
import { places } from "@/db/schema/place";
import type {
  PublicProfile,
  PublicListSummary,
  PublicListDetail,
  PublicPlaceEntry,
} from "./service/types";

export type { PublicProfile, PublicListSummary, PublicListDetail, PublicPlaceEntry };

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * Fetch the public profile for a vanity slug.
 *
 * Wrapped in React.cache so the layout and page can both call this
 * without issuing a second DB query within the same request.
 *
 * @param vanitySlug - The user's vanity slug (e.g. "alex")
 * @returns PublicProfile if found and not soft-deleted, null otherwise
 */
export const getPublicProfile = cache(
  async (vanitySlug: string): Promise<PublicProfile | null> => {
    const safeSlug = vanitySlug.replace(/[\r\n]/g, "_");
    console.info(
      "[PublicService:getPublicProfile]",
      `Fetching public profile for slug "${safeSlug}"`
    );

    try {
      const rows = await db
        .select({
          id: users.id,
          name: users.name,
          bio: users.bio,
          avatarUrl: users.avatarUrl,
          vanitySlug: users.vanitySlug,
        })
        .from(users)
        .where(and(eq(users.vanitySlug, vanitySlug), isNull(users.deletedAt)))
        .limit(1);

      const row = rows[0] ?? null;

      if (row) {
        console.info(
          "[PublicService:getPublicProfile]",
          `Found profile for slug "${safeSlug}" (id: ${row.id})`
        );
      } else {
        console.info(
          "[PublicService:getPublicProfile]",
          `No profile found for slug "${safeSlug}"`
        );
      }

      return row;
    } catch (err) {
      console.error(
        "[PublicService:getPublicProfile]",
        "DB error:",
        err instanceof Error ? err.message : "Unknown error"
      );
      throw err;
    }
  }
);

/**
 * Fetch all published lists for a user, newest first.
 *
 * Left-joins list_places (filtering deleted_at IS NULL) to produce an
 * accurate place count per list.
 *
 * @param userId - The user's UUID
 * @returns Array of PublicListSummary ordered by publishedAt DESC
 */
export const getPublicListsForProfile = cache(
  async (userId: string): Promise<PublicListSummary[]> => {
    console.info(
      "[PublicService:getPublicListsForProfile]",
      `Fetching published lists for user ${userId}`
    );

    try {
      const rows = await db
        .select({
          id: lists.id,
          title: lists.title,
          slug: lists.slug,
          description: lists.description,
          updatedAt: lists.updatedAt,
          placeCount: count(listPlaces.id),
        })
        .from(lists)
        .leftJoin(
          listPlaces,
          and(eq(listPlaces.listId, lists.id), isNull(listPlaces.deletedAt))
        )
        .where(
          and(
            eq(lists.userId, userId),
            eq(lists.isPublished, true),
            isNull(lists.deletedAt)
          )
        )
        .groupBy(lists.id)
        .orderBy(desc(lists.publishedAt));

      console.info(
        "[PublicService:getPublicListsForProfile]",
        `Found ${rows.length} published lists for user ${userId}`
      );

      return rows;
    } catch (err) {
      console.error(
        "[PublicService:getPublicListsForProfile]",
        "DB error:",
        err instanceof Error ? err.message : "Unknown error"
      );
      throw err;
    }
  }
);

/**
 * Fetch the full detail of a single published list, including ordered places.
 *
 * Hero image uses COALESCE(list_places.hero_image_url, places.hero_image_url)
 * so per-creator overrides take precedence over the cached place image.
 *
 * @param params.userId   - The list owner's UUID (ownership scoping)
 * @param params.listSlug - The list slug
 * @returns PublicListDetail if found and published, null otherwise
 */
export const getPublicListDetail = cache(
  async ({
    userId,
    listSlug,
  }: {
    userId: string;
    listSlug: string;
  }): Promise<PublicListDetail | null> => {
    const safeListSlug = listSlug.replace(/[\r\n]/g, "_");
    console.info(
      "[PublicService:getPublicListDetail]",
      `Fetching list detail for user ${userId}, slug "${safeListSlug}"`
    );

    try {
      // Step 1: Fetch the list header
      const listRows = await db
        .select({
          id: lists.id,
          title: lists.title,
          slug: lists.slug,
          description: lists.description,
          updatedAt: lists.updatedAt,
        })
        .from(lists)
        .where(
          and(
            eq(lists.userId, userId),
            eq(lists.slug, listSlug),
            eq(lists.isPublished, true),
            isNull(lists.deletedAt)
          )
        )
        .limit(1);

      const listRow = listRows[0];
      if (!listRow) {
        console.info(
          "[PublicService:getPublicListDetail]",
          `List not found or not published: user ${userId}, slug "${safeListSlug}"`
        );
        return null;
      }

      // Step 2: Fetch places ordered by position
      const placeRows = await db
        .select({
          id: places.id,
          name: places.name,
          address: places.address,
          description: places.description,
          heroImageUrl: sql<string | null>`COALESCE(${listPlaces.heroImageUrl}, ${places.heroImageUrl})`,
          position: listPlaces.position,
        })
        .from(listPlaces)
        .innerJoin(places, eq(places.id, listPlaces.placeId))
        .where(
          and(
            eq(listPlaces.listId, listRow.id),
            isNull(listPlaces.deletedAt),
            isNull(places.deletedAt)
          )
        )
        .orderBy(asc(listPlaces.position));

      console.info(
        "[PublicService:getPublicListDetail]",
        `Found list "${safeListSlug}" with ${placeRows.length} places`
      );

      const placeEntries: PublicPlaceEntry[] = placeRows.map((row) => ({
        id: row.id,
        name: row.name,
        address: row.address,
        description: row.description ?? null,
        heroImageUrl: row.heroImageUrl,
        position: row.position,
      }));

      return {
        id: listRow.id,
        title: listRow.title,
        slug: listRow.slug,
        description: listRow.description ?? null,
        updatedAt: listRow.updatedAt,
        places: placeEntries,
      };
    } catch (err) {
      console.error(
        "[PublicService:getPublicListDetail]",
        "DB error:",
        err instanceof Error ? err.message : "Unknown error"
      );
      throw err;
    }
  }
);
