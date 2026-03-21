/**
 * Public Service
 *
 * Centralised service for reading public profile and list data.
 * All functions are wrapped in React.cache so repeated calls within
 * the same request (e.g. layout + page) are deduplicated.
 *
 * Published list queries are additionally cached in Redis (24h TTL,
 * keyed by userId) and invalidated on mutations.
 *
 * Delegates all DB access to the public repository.
 * Used by Server Components only — never called from client code.
 *
 * @see docs/decisions/caching-and-rate-limiting.md
 * @module public/service
 */

import { cache } from "react";
import * as publicRepository from "@/db/repositories/public.repository";
import { createServiceLogger } from "@/lib/services/logging";
import { cachedQuery, invalidateCache } from "@/lib/services/cache/helpers";
import { config } from "@/lib/config";
import type {
  PublicProfile,
  PublicListSummary,
  PublicListDetail,
} from "./types";
import { publicServiceError } from "./errors";

const log = createServiceLogger("public-service");

// ─── Cache key builders ───────────────────────────────────────────────────────

/**
 * Build the cache key for a user's published list summaries.
 * @param userId - The user's UUID
 * @returns The cache key
 */
export function publicListsCacheKey(userId: string): string {
  return `pub:lists:${userId}`;
}

/**
 * Build the cache key for a single published list's detail (with places).
 * @param userId - The user's UUID
 * @param listSlug - The list slug
 * @returns The cache key
 */
export function publicListDetailCacheKey(
  userId: string,
  listSlug: string
): string {
  return `pub:list:${userId}:${listSlug}`;
}

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
    log.debug(
      { method: "getPublicProfile" },
      `Fetching public profile for slug "${safeSlug}"`
    );

    try {
      const row = await publicRepository.getPublicProfileBySlug(vanitySlug);

      if (row) {
        log.info(
          { method: "getPublicProfile", userId: row.id },
          `Profile found for slug "${safeSlug}"`
        );
      } else {
        log.info(
          { method: "getPublicProfile" },
          `No profile found for slug "${safeSlug}"`
        );
      }

      return row;
    } catch (err) {
      log.error({ method: "getPublicProfile", err }, "DB error");
      throw publicServiceError("Failed to load profile.", err);
    }
  }
);

/**
 * Fetch all published lists for a user, newest first.
 * Results are cached in Redis for 24h, keyed by userId.
 *
 * @param userId - The user's UUID
 * @returns Array of PublicListSummary ordered by publishedAt DESC
 */
export const getPublicListsForProfile = cache(
  async (userId: string): Promise<PublicListSummary[]> => {
    log.debug(
      { method: "getPublicListsForProfile", userId },
      "Fetching published lists"
    );

    try {
      const rows = await cachedQuery(
        publicListsCacheKey(userId),
        config.cache.publicListTtlSeconds,
        () => publicRepository.getPublicListsForProfile(userId)
      );

      log.info(
        { method: "getPublicListsForProfile", userId, count: rows.length },
        "Published lists fetched"
      );

      return rows;
    } catch (err) {
      log.error(
        { method: "getPublicListsForProfile", userId, err },
        "DB error"
      );
      throw publicServiceError("Failed to load lists.", err);
    }
  }
);

/**
 * Fetch the full detail of a single published list, including ordered places.
 * Results are cached in Redis for 24h, keyed by userId and listSlug.
 *
 * @param userId - The list owner's UUID (ownership scoping)
 * @param listSlug - The list slug
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
    log.debug(
      { method: "getPublicListDetail", userId },
      `Fetching list detail for slug "${safeListSlug}"`
    );

    try {
      const result = await cachedQuery(
        publicListDetailCacheKey(userId, listSlug),
        config.cache.publicListTtlSeconds,
        () => publicRepository.getPublicListDetail({ userId, listSlug })
      );

      if (result) {
        log.info(
          {
            method: "getPublicListDetail",
            userId,
            listId: result.id,
            placeCount: result.places.length,
          },
          `List detail found for slug "${safeListSlug}"`
        );
      } else {
        log.info(
          { method: "getPublicListDetail", userId },
          `List not found or not published: slug "${safeListSlug}"`
        );
      }

      return result;
    } catch (err) {
      log.error({ method: "getPublicListDetail", userId, err }, "DB error");
      throw publicServiceError("Failed to load list.", err);
    }
  }
);

// ─── Cache invalidation ──────────────────────────────────────────────────────

/**
 * Invalidate public list caches for a user.
 * Always invalidates the list summaries cache. If listSlug is provided,
 * also invalidates the specific list detail cache.
 * @param userId - The user's UUID
 * @param listSlug - Optional list slug to also invalidate the detail cache
 */
export async function invalidatePublicListCaches(
  userId: string,
  listSlug?: string
): Promise<void> {
  const keys = [publicListsCacheKey(userId)];
  if (listSlug) {
    keys.push(publicListDetailCacheKey(userId, listSlug));
  }
  await invalidateCache(...keys);
}
