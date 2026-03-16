/**
 * Public Service
 *
 * Centralised service for reading public profile and list data.
 * All functions are wrapped in React.cache so repeated calls within
 * the same request (e.g. layout + page) are deduplicated.
 *
 * Delegates all DB access to the public repository.
 * Used by Server Components only — never called from client code.
 *
 * @module public/service
 */

import { cache } from "react";
import * as publicRepository from "@/db/repositories/public.repository";
import type {
  PublicProfile,
  PublicListSummary,
  PublicListDetail,
  PublicPlaceEntry,
} from "./service/types";
import { publicServiceError } from "./service/errors";
export { PublicServiceError } from "./service/errors";

export type {
  PublicProfile,
  PublicListSummary,
  PublicListDetail,
  PublicPlaceEntry,
};

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
      const row = await publicRepository.getPublicProfileBySlug(vanitySlug);

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
      throw publicServiceError("Failed to load profile.", err);
    }
  }
);

/**
 * Fetch all published lists for a user, newest first.
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
      const rows = await publicRepository.getPublicListsForProfile(userId);

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
      throw publicServiceError("Failed to load lists.", err);
    }
  }
);

/**
 * Fetch the full detail of a single published list, including ordered places.
 *
 * @param userId   - The list owner's UUID (ownership scoping)
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
    console.info(
      "[PublicService:getPublicListDetail]",
      `Fetching list detail for user ${userId}, slug "${safeListSlug}"`
    );

    try {
      const result = await publicRepository.getPublicListDetail({
        userId,
        listSlug,
      });

      if (result) {
        console.info(
          "[PublicService:getPublicListDetail]",
          `Found list "${safeListSlug}" with ${result.places.length} places`
        );
      } else {
        console.info(
          "[PublicService:getPublicListDetail]",
          `List not found or not published: user ${userId}, slug "${safeListSlug}"`
        );
      }

      return result;
    } catch (err) {
      console.error(
        "[PublicService:getPublicListDetail]",
        "DB error:",
        err instanceof Error ? err.message : "Unknown error"
      );
      throw publicServiceError("Failed to load list.", err);
    }
  }
);
