/**
 * Type definitions for the Public Service
 * @module lib/public/types
 */

import type { TagSummary } from "@/lib/tag/types";

/**
 * Public-facing user profile data.
 */
export interface PublicProfile {
  id: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  vanitySlug: string;
}

/**
 * Summary of a published list for display on a profile page.
 */
export interface PublicListSummary {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  updatedAt: Date;
  placeCount: number;
  tags: TagSummary[];
}

/**
 * A single place entry within a public list.
 */
export interface PublicPlaceEntry {
  id: string;
  name: string;
  address: string;
  description: string | null;
  heroImageUrl: string | null;
  position: number;
  tags: TagSummary[];
}

/**
 * Full detail for a published list, including ordered places.
 */
export interface PublicListDetail {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  updatedAt: Date;
  tags: TagSummary[];
  places: PublicPlaceEntry[];
}
