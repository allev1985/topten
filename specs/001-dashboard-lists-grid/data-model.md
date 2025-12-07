# Data Model: Dashboard Lists and Grids

**Feature**: Dashboard Lists and Grids  
**Phase**: 1 - Design & Contracts  
**Date**: 2025-12-07

## Overview

This document defines the data structures and relationships for displaying curator lists in a dashboard grid. The feature uses mock data initially, with structures designed to align with existing database schema for future integration.

## Entity Definitions

### List Entity

Represents a curator's collection of favorite places within a category.

**Attributes**:

| Field | Type | Required | Description | Validation Rules | Source |
|-------|------|----------|-------------|------------------|--------|
| `id` | `string` (UUID) | Yes | Unique identifier for the list | Must be valid UUID format | Database primary key |
| `title` | `string` | Yes | Display name of the list | 1-255 characters, no empty strings | Database `title` column |
| `heroImageUrl` | `string` (URL) | Yes | URL to hero/cover image | Must be valid URL format | Derived from first `list_places.hero_image_url` or placeholder |
| `isPublished` | `boolean` | Yes | Publication status of the list | true (published) or false (draft) | Database `is_published` column |
| `placeCount` | `number` (integer) | Yes | Number of places in the list | Must be non-negative integer (≥0) | Derived from count of `list_places` where `deleted_at IS NULL` |

**Additional Context**:
- The `List` entity maps to the existing `lists` table in the database schema
- Additional fields exist in the database (userId, slug, description, publishedAt, createdAt, updatedAt, deletedAt) but are not needed for this feature
- Hero image is derived from the first place in the list's `list_places.hero_image_url` or uses placeholder

**Relationships**:
- **One-to-Many** with Places: One list contains multiple places (via `list_places` junction table)
- **Many-to-One** with User: Multiple lists belong to one curator (via `user_id` foreign key)

**State Transitions**:
```
[Draft] (isPublished = false)
   ↓ (curator publishes)
[Published] (isPublished = true)
   ↓ (curator unpublishes)
[Draft] (isPublished = false)
```

---

### ListCardProps (Component Interface)

Component-level data structure for rendering a list card in the grid.

**Attributes**:

| Field | Type | Required | Description | Default |
|-------|------|----------|-------------|---------|
| `list` | `List` | Yes | The list entity data to display | - |
| `onClick` | `(listId: string) => void` | Yes | Handler for card click events | - |

**Derived Display Values**:
- **Status Badge Text**: `isPublished ? "Published" : "Draft"`
- **Status Badge Variant**: `isPublished ? "default" : "secondary"`
- **Place Count Text**: `placeCount === 1 ? "${placeCount} place" : "${placeCount} places"`
- **Image Alt Text**: `"${title} cover image"`

---

### ListGridProps (Component Interface)

Component-level data structure for rendering the grid container.

**Attributes**:

| Field | Type | Required | Description | Default |
|-------|------|----------|-------------|---------|
| `lists` | `List[]` | Yes | Array of list entities to display | - |
| `onListClick` | `(listId: string) => void` | Yes | Handler for list card click events | - |

---

### Mock Data Structure

**Type Definition** (`src/types/list.ts`):
```typescript
export interface List {
  id: string;
  title: string;
  heroImageUrl: string;
  isPublished: boolean;
  placeCount: number;
}
```

**Mock Data** (`src/lib/mocks/lists.ts`):
```typescript
import type { List } from "@/types/list";

/**
 * Mock list data for dashboard development
 * TODO: Replace with real data from database in future implementation
 */
export const mockLists: List[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    title: "Best Coffee Shops in San Francisco",
    heroImageUrl: "https://placehold.co/600x400/png",
    isPublished: true,
    placeCount: 12,
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    title: "Hidden Gem Restaurants You Must Try Before They Get Too Popular",
    heroImageUrl: "https://placehold.co/600x400/png",
    isPublished: false,
    placeCount: 8,
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440003",
    title: "Weekend Brunch Spots",
    heroImageUrl: "https://placehold.co/600x400/png",
    isPublished: true,
    placeCount: 1,
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440004",
    title: "Craft Beer Bars Downtown",
    heroImageUrl: "https://placehold.co/600x400/png",
    isPublished: true,
    placeCount: 15,
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440005",
    title: "New Places to Explore",
    heroImageUrl: "https://placehold.co/600x400/png",
    isPublished: false,
    placeCount: 0,
  },
];
```

**Mock Data Coverage**:
- ✅ Published lists (3)
- ✅ Draft lists (2)
- ✅ Singular place count (1 place)
- ✅ Plural place count (0, 8, 12, 15 places)
- ✅ Long title for truncation testing (item 2)
- ✅ Short titles (items 1, 3, 4, 5)
- ✅ Unique UUIDs for each list
- ✅ Placeholder images from placehold.co

---

## Database Schema Reference

### Existing Schema (from `src/db/schema/`)

The feature aligns with existing database tables:

**`lists` table**:
```typescript
{
  id: uuid (PK),
  userId: uuid (FK → users),
  title: varchar(255),
  slug: varchar(255),
  description: text,
  isPublished: boolean (default: false),
  publishedAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp,
  deletedAt: timestamp
}
```

**`list_places` table**:
```typescript
{
  id: uuid (PK),
  listId: uuid (FK → lists),
  placeId: uuid (FK → places),
  position: integer,
  heroImageUrl: varchar(2048),
  createdAt: timestamp,
  deletedAt: timestamp
}
```

### Future Database Integration

When transitioning from mock data to real data:

**Query Pattern** (pseudo-SQL):
```sql
SELECT 
  l.id,
  l.title,
  COALESCE(
    (SELECT lp.hero_image_url 
     FROM list_places lp 
     WHERE lp.list_id = l.id 
       AND lp.deleted_at IS NULL 
     ORDER BY lp.position 
     LIMIT 1),
    'https://placehold.co/600x400/png'
  ) as heroImageUrl,
  l.is_published as isPublished,
  COUNT(lp.id) FILTER (WHERE lp.deleted_at IS NULL) as placeCount
FROM lists l
LEFT JOIN list_places lp ON l.list_id = lp.list_id
WHERE l.user_id = :currentUserId
  AND l.deleted_at IS NULL
GROUP BY l.id, l.title, l.is_published
ORDER BY l.updated_at DESC
```

**Drizzle ORM Pattern**:
```typescript
// Future implementation reference
import { lists, listPlaces } from "@/db/schema";
import { eq, isNull, count } from "drizzle-orm";

const userLists = await db
  .select({
    id: lists.id,
    title: lists.title,
    heroImageUrl: listPlaces.heroImageUrl,
    isPublished: lists.isPublished,
    placeCount: count(listPlaces.id),
  })
  .from(lists)
  .leftJoin(listPlaces, eq(lists.id, listPlaces.listId))
  .where(
    and(
      eq(lists.userId, currentUserId),
      isNull(lists.deletedAt),
      isNull(listPlaces.deletedAt)
    )
  )
  .groupBy(lists.id)
  .orderBy(desc(lists.updatedAt));
```

---

## Validation Rules

### List Entity Validation

**Client-Side Validation** (TypeScript):
```typescript
function isValidList(data: unknown): data is List {
  if (typeof data !== "object" || data === null) return false;
  
  const candidate = data as Record<string, unknown>;
  
  return (
    typeof candidate.id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(candidate.id) &&
    typeof candidate.title === "string" &&
    candidate.title.length > 0 &&
    candidate.title.length <= 255 &&
    typeof candidate.heroImageUrl === "string" &&
    isValidUrl(candidate.heroImageUrl) &&
    typeof candidate.isPublished === "boolean" &&
    typeof candidate.placeCount === "number" &&
    Number.isInteger(candidate.placeCount) &&
    candidate.placeCount >= 0
  );
}
```

**Zod Schema** (for future API integration):
```typescript
import { z } from "zod";

export const ListSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255),
  heroImageUrl: z.string().url(),
  isPublished: z.boolean(),
  placeCount: z.number().int().nonnegative(),
});

export type List = z.infer<typeof ListSchema>;
```

---

## Edge Cases and Error Handling

| Edge Case | Expected Behavior | Implementation |
|-----------|-------------------|----------------|
| List with no places (`placeCount: 0`) | Display "0 places" | Standard pluralization logic |
| List with exactly 1 place | Display "1 place" (singular) | Conditional: `placeCount === 1` |
| Very long title (>100 chars) | Truncate to 2 lines with ellipsis | Tailwind `line-clamp-2` class |
| Missing hero image URL | Use placeholder service | Default to placehold.co URL |
| Failed image load | Show Next.js Image fallback | Next.js Image component handles automatically |
| Invalid UUID format | TypeScript compile error / runtime validation | Type checking + runtime guard (future) |
| Negative place count | Should never occur | Database constraint + validation at data layer |
| Empty lists array | Display empty grid | No special handling needed |

---

## Component Data Flow

```
[Mock Data: mockLists]
        ↓
[Dashboard Page: /dashboard/page.tsx]
        ↓
[ListGrid Component]
   ├─→ [ListCard Component] × N
   │       ├─→ [Image: Next.js Image]
   │       ├─→ [Title: h3]
   │       ├─→ [Badge: shadcn/ui]
   │       ├─→ [Place Count: span]
   │       └─→ [Menu Button: DropdownMenu]
   └─→ onListClick(listId) → console.log
```

---

## Type Export Strategy

**File**: `src/types/list.ts`
```typescript
/**
 * List entity representing a curator's collection of places
 * Used for dashboard grid display
 * 
 * @property id - Unique identifier (UUID)
 * @property title - Display name of the list
 * @property heroImageUrl - URL to hero/cover image
 * @property isPublished - Publication status (true = published, false = draft)
 * @property placeCount - Number of places in the list
 */
export interface List {
  id: string;
  title: string;
  heroImageUrl: string;
  isPublished: boolean;
  placeCount: number;
}

/**
 * Props for ListCard component
 */
export interface ListCardProps {
  list: List;
  onClick: (listId: string) => void;
}

/**
 * Props for ListGrid component
 */
export interface ListGridProps {
  lists: List[];
  onListClick: (listId: string) => void;
}
```

---

## Testing Data Requirements

### Unit Test Data

**Minimal List**:
```typescript
const minimalList: List = {
  id: "test-id-001",
  title: "Test List",
  heroImageUrl: "https://placehold.co/600x400",
  isPublished: true,
  placeCount: 5,
};
```

**Long Title List**:
```typescript
const longTitleList: List = {
  id: "test-id-002",
  title: "This is an extremely long list title that should definitely be truncated after two lines of text to ensure the UI remains clean and consistent",
  heroImageUrl: "https://placehold.co/600x400",
  isPublished: false,
  placeCount: 1,
};
```

**Edge Case Lists**:
```typescript
const edgeCases: List[] = [
  { /* 0 places */ },
  { /* 1 place */ },
  { /* 999 places */ },
  { /* published */ },
  { /* draft */ },
];
```

---

## Accessibility Data Requirements

**Alt Text Pattern**: `${title} cover image`

**Example**:
- List title: "Best Coffee Shops"
- Image alt: "Best Coffee Shops cover image"

**Screen Reader Announcements**:
- Card: "Best Coffee Shops, Published, 12 places"
- Status: Badge with text content "Published" or "Draft"
- Menu: "Options for Best Coffee Shops"

---

## Future Enhancements (Out of Scope)

- Category information (requires category entity)
- Last updated timestamp
- Creator information (for shared/collaborative lists)
- Like/favorite count
- View count analytics
- Tags/keywords
- Geographic region/location
- Currency/price range (for restaurant lists)

---

## Summary

The data model for Dashboard Lists and Grids is intentionally simple, focusing on the minimum attributes needed for the initial implementation. The structure aligns with existing database schema to facilitate future integration while using mock data for development isolation. All validation rules, edge cases, and type definitions are clearly specified to guide implementation.

**Key Design Decisions**:
1. Use TypeScript interfaces for type safety
2. Mock data structure mirrors database schema
3. Derived values (badge variant, place text) computed in components
4. Future-ready for database integration via Drizzle ORM
5. Comprehensive edge case handling defined upfront
