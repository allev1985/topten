# Data Model: Repository Layer Contracts

**Branch**: `009-db-layer-abstraction` | **Date**: 2026-03-13  
**Purpose**: Define the public function signatures each repository module must export. These are the contracts between the service layer and the db layer. Implementation details (Drizzle query syntax) live only inside each repository function.

---

## Overview

No schema changes. No migrations. This document describes the TypeScript function signatures for the new `src/db/repositories/` modules.

---

## `src/db/repositories/list.repository.ts`

Extracted from: `src/lib/list/service.ts`

```typescript
import type { InferSelectModel } from "drizzle-orm";
import type { lists, listPlaces } from "@/db/schema";

export type ListRow = InferSelectModel<typeof lists>;
export type ListSummaryRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  isPublished: boolean;
  createdAt: Date;
  placeCount: number;
};
export type PublishedListRow = Pick<ListRow, "id" | "isPublished" | "publishedAt" | "slug">;

/** Fetch all active lists for a user, newest first, with place count. */
export async function getListsByUser(userId: string): Promise<ListSummaryRow[]>

/** Insert a new list row. Returns the full inserted row. */
export async function insertList(values: {
  userId: string;
  title: string;
  slug: string;
  isPublished: boolean;
}): Promise<ListRow>

/** Update list title and/or description. Returns updated fields or empty array if not found. */
export async function updateList(params: {
  listId: string;
  userId: string;
  title?: string;
  description?: string;
  updatedAt: Date;
}): Promise<Pick<ListRow, "id" | "title" | "description" | "updatedAt">[]>

/** Soft-delete a list. Returns affected row ids or empty array if not found. */
export async function softDeleteList(params: {
  listId: string;
  userId: string;
  now: Date;
}): Promise<Pick<ListRow, "id">[]>

/** Set isPublished=true on a list. Returns updated published fields or empty array. */
export async function publishList(params: {
  listId: string;
  userId: string;
  now: Date;
}): Promise<PublishedListRow[]>

/** Set isPublished=false on a list. Returns updated published fields or empty array. */
export async function unpublishList(params: {
  listId: string;
  userId: string;
  now: Date;
}): Promise<PublishedListRow[]>
```

---

## `src/db/repositories/user.repository.ts`

Extracted from: cross-domain user lookups in `src/lib/list/service.ts` (`publishList`, `unpublishList`)

```typescript
import type { InferSelectModel } from "drizzle-orm";
import type { users } from "@/db/schema";

export type UserRow = InferSelectModel<typeof users>;

/** Return the vanitySlug for an active user, or null if not found. */
export async function getVanitySlugByUserId(
  userId: string
): Promise<{ vanitySlug: string | null } | null>
```

---

## `src/db/repositories/place.repository.ts`

Extracted from: `src/lib/place/service.ts`

```typescript
import type { InferSelectModel } from "drizzle-orm";
import type { places, listPlaces } from "@/db/schema";

export type PlaceRow = InferSelectModel<typeof places>;
export type ListPlaceRow = InferSelectModel<typeof listPlaces>;
export type PlaceSummaryRow = {
  id: string;
  name: string;
  address: string;
  description: string | null;
  heroImageUrl: string | null;
};
export type PlaceWithListCountRow = PlaceSummaryRow & { activeListCount: number };

/** Fetch active places attached to a list, ordered by position ASC. */
export async function getPlacesByList(listId: string): Promise<PlaceSummaryRow[]>

/** Fetch places owned by a user that are NOT currently in the target list. */
export async function getAvailablePlacesForList(params: {
  listId: string;
  userId: string;
}): Promise<PlaceSummaryRow[]>

/** Fetch all active places for a user with their active-list count. */
export async function getAllPlacesByUser(userId: string): Promise<PlaceWithListCountRow[]>

/** Look up a place by (userId, googlePlaceId) — includes soft-deleted rows. */
export async function getPlaceByGoogleId(params: {
  userId: string;
  googlePlaceId: string;
}): Promise<PlaceRow | null>

/** Restore a soft-deleted place (clear deletedAt). */
export async function restorePlace(params: {
  placeId: string;
  now: Date;
}): Promise<PlaceRow>

/** Insert a new place row (standalone, no list). */
export async function insertPlace(values: {
  userId: string;
  googlePlaceId: string;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  description?: string | null;
  heroImageUrl?: string | null;
}): Promise<PlaceRow>

/**
 * Atomically insert a new place and attach it to a list.
 * Runs inside db.transaction(). Returns the new place row and listPlace id.
 *
 * Caller is responsible for verifying list ownership before calling this.
 */
export async function createPlaceWithListAttachment(params: {
  userId: string;
  listId: string;
  googlePlaceId: string;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  description?: string | null;
  heroImageUrl?: string | null;
}): Promise<{ place: PlaceRow; listPlaceId: string }>

/** Check current ownership of a list. Returns row if owned and active, else empty. */
export async function getListOwnership(params: {
  listId: string;
  userId: string;
}): Promise<{ id: string }[]>

/** Compute MAX(position) for active listPlace rows on a list. Returns 0 if list is empty. */
export async function getMaxPosition(listId: string): Promise<number>

/** Check for an active or soft-deleted listPlace row for (listId, placeId). */
export async function getListPlaceRow(params: {
  listId: string;
  placeId: string;
}): Promise<Pick<ListPlaceRow, "id" | "deletedAt"> | null>

/** Restore a soft-deleted listPlace row (set deletedAt=null, update position). */
export async function restoreListPlace(params: {
  listPlaceId: string;
  position: number;
}): Promise<void>

/** Insert a new listPlace row. Returns the new row id. */
export async function insertListPlace(values: {
  listId: string;
  placeId: string;
  position: number;
}): Promise<{ id: string }>

/** Update a place's description. Returns updated fields or empty array if not found. */
export async function updatePlaceDescription(params: {
  placeId: string;
  description?: string | null;
  now: Date;
}): Promise<Pick<PlaceRow, "id" | "description" | "updatedAt">[]>

/** Verify ownership via list membership (for updatePlace with listId). */
export async function getPlaceInListByOwner(params: {
  placeId: string;
  listId: string;
  userId: string;
}): Promise<{ placeId: string }[]>

/** Verify direct ownership of a place by userId (for updatePlace without listId). */
export async function getPlaceByOwner(params: {
  placeId: string;
  userId: string;
}): Promise<{ id: string }[]>

/** Verify active attachment of a place in a list owned by user (for deletePlaceFromList). */
export async function getActivePlaceInList(params: {
  placeId: string;
  listId: string;
  userId: string;
}): Promise<{ placeId: string }[]>

/** Soft-delete a listPlace row. Returns affected row ids or empty array. */
export async function softDeleteListPlace(params: {
  placeId: string;
  listId: string;
  now: Date;
}): Promise<Pick<ListPlaceRow, "id">[]>

/**
 * Atomically soft-delete a place and cascade to all active listPlace rows.
 * Runs inside db.transaction(). Caller is responsible for ownership check before calling.
 * Returns count of cascaded listPlace deletions.
 */
export async function deletePlaceWithCascade(params: {
  placeId: string;
  userId: string;
  now: Date;
}): Promise<{ deletedListPlaceCount: number }>
```

---

## `src/db/repositories/profile.repository.ts`

Extracted from: `src/lib/profile/service.ts`

```typescript
import type { InferSelectModel } from "drizzle-orm";
import type { users } from "@/db/schema";

export type UserRow = InferSelectModel<typeof users>;
export type SettingsProfileRow = { name: string | null; vanitySlug: string | null };

/** Fetch settings profile fields for a user. Returns null if not found. */
export async function getSettingsProfile(userId: string): Promise<SettingsProfileRow | null>

/** Update user display name. */
export async function updateUserName(params: {
  userId: string;
  name: string;
  now: Date;
}): Promise<void>

/** Check if a vanity slug is already taken by another user. */
export async function getSlugConflict(params: {
  vanitySlug: string;
  excludeUserId: string;
}): Promise<{ id: string }[]>

/** Update user vanity slug. */
export async function updateUserSlug(params: {
  userId: string;
  vanitySlug: string;
  now: Date;
}): Promise<void>
```

---

## `src/db/repositories/public.repository.ts`

Extracted from: `src/lib/public/service.ts`

```typescript
import type {
  PublicProfile,
  PublicListSummary,
  PublicListDetail,
  PublicPlaceEntry,
} from "@/lib/public/service/types";

// Note: returned types re-use the existing public service types — no new types introduced.

/** Fetch public profile by vanity slug. Returns null if not found. */
export async function getPublicProfileBySlug(vanitySlug: string): Promise<PublicProfile | null>

/** Fetch published, non-deleted lists for a user id. */
export async function getPublicListsByUserId(userId: string): Promise<PublicListSummary[]>

/** Fetch a single published list with place count by (userId, listSlug). */
export async function getPublicListBySlug(params: {
  userId: string;
  listSlug: string;
}): Promise<PublicListDetail | null>

/** Fetch all active places for a published list, in position order. */
export async function getPublicPlacesByListId(listId: string): Promise<PublicPlaceEntry[]>
```

---

## Notes on `React.cache`

`public/service.ts` wraps reads in `React.cache()`. The `React.cache` call **stays in the service** — it wraps the call to the repository function, not the repository function itself. Repositories have no awareness of React's request cache.

```typescript
// service.ts (after refactor — stays like this)
export const getPublicProfile = cache(
  async (vanitySlug: string) => publicRepository.getPublicProfileBySlug(vanitySlug)
);
```

---

## Dependency Arrow

```
src/actions/*.ts
      ↓
src/lib/*/service.ts        (business logic, error translation, React.cache)
      ↓
src/db/repositories/*.ts    (all Drizzle SQL, db.transaction for multi-step writes)
      ↓
src/db/index.ts             (db singleton)
src/db/schema/*.ts          (table definitions)
```

No upward imports allowed at any level.
