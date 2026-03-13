# Data Model: Brand Styling — myfaves Visual Identity

**Branch**: `001-brand-styling` | **Date**: 2026-03-13

---

## Schema Changes

**None.** This feature is purely presentational. No database migrations are required.

---

## New Application Constants

### `src/lib/utils/gradient.ts` (new file)

Provides the four brand gradients and a deterministic lookup function for list card covers.

```ts
/** The four myfaves brand gradients, ordered by index 0–3. */
export const BRAND_GRADIENTS = [
  "linear-gradient(135deg, #8B5CF6, #F472B6)", // 0 — violet → pink (default)
  "linear-gradient(135deg, #34D399, #3B82F6)", // 1 — mint → blue
  "linear-gradient(135deg, #8B5CF6, #3B82F6)", // 2 — violet → blue
  "linear-gradient(135deg, #F472B6, #FBBF24)", // 3 — pink → amber
] as const;

/**
 * Deterministically maps a list UUID to one of the four brand gradients.
 * Sums the first 8 hex characters of the UUID and takes modulo 4.
 * Stable across re-renders; changes only when the list ID changes.
 */
export function listCoverGradient(listId: string): string {
  const sum = listId
    .replace(/-/g, "")
    .slice(0, 8)
    .split("")
    .reduce((acc, c) => acc + parseInt(c, 16), 0);
  return BRAND_GRADIENTS[sum % 4];
}
```

**Usage in `ListCard.tsx`**:
```tsx
import { listCoverGradient } from "@/lib/utils/gradient";

// Inside the card JSX, above the existing CardContent body:
<div
  className="h-24 w-full rounded-t-[calc(var(--radius)-1px)]"
  style={{ background: listCoverGradient(list.id) }}
  aria-hidden="true"
/>
```

---

## Token Reference (no schema — CSS only)

See [plan.md](./plan.md) § "CSS token map" for the full `:root` and dark-mode token tables.
