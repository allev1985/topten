# Tags for Lists and Places

## Status

Accepted — 2026-03-22

## Context

Users have requested the ability to tag their lists and places to improve discoverability and categorisation. Tags serve two purposes:

1. **System tags** — derived from the Google Places taxonomy (e.g. "cafe", "restaurant", "hair_care"). These are pre-populated and normalised so that viewers can reliably filter and understand what a list contains.
2. **Custom tags** — free-form labels created by users (e.g. "vegan-friendly", "date-night"). These allow creators to express nuances that the Google taxonomy does not cover.

Both lists and places support multiple tags. Tags are reusable across the entire platform — a tag created by one user can be applied by any user.

## Decision

### Data model

Introduce three new tables:

| Table | Purpose |
|-------|---------|
| `tags` | Canonical tag registry with `name` (unique, lowercase, kebab-case) and `source` (`system` or `custom`) |
| `list_tags` | Junction: `list_id` + `tag_id`, soft-deletable |
| `place_tags` | Junction: `place_id` + `tag_id`, soft-deletable |

The `tags` table is **global** — not per-user. This enables future cross-user discovery (e.g. "show all lists tagged `cafe`"). System tags are seeded from the Google Places type taxonomy and are not editable by users.

### Tag naming

- All tag names are stored lowercase with hyphens replacing underscores and spaces (kebab-case).
- Google Places types (e.g. `hair_care`) are normalised to `hair-care`.
- Maximum length: 50 characters.
- Validation regex: `^[a-z0-9][a-z0-9-]{0,48}[a-z0-9]$` (min 2 chars, start/end alphanumeric).

### Service architecture

A new `src/lib/tag/` service module follows the existing pattern:

```
src/lib/tag/
  types.ts      — TagRecord, TagSummary
  errors.ts     — TagServiceError with codes
  service.ts    — CRUD + assignment operations
  index.ts      — public barrel
  seed.ts       — Google Places taxonomy constants
```

A new repository `src/db/repositories/tag.repository.ts` handles all DB access.

### Server actions

A new `src/actions/tag-actions.ts` exposes:

- `setListTagsAction` — replace all tags on a list (idempotent)
- `setPlaceTagsAction` — replace all tags on a place (idempotent)
- `searchTagsAction` — autocomplete search for existing tags
- `createTagAction` — create a custom tag

### UI integration

- Tag input component (`TagInput`) with autocomplete — used in Create/Edit List and Create/Edit Place forms.
- Tag display badges — rendered on `ListCard`, `PlaceCard`, `PublicListCard`, `PublicPlaceCard`.

### Google Places taxonomy seeding

The `db:seed` script will be updated to insert the ~100 most common Google Places types as system tags. The seed is idempotent (upsert on `name`).

## Consequences

- Adds three new database tables and a migration.
- Tags are global and shared across users — a custom tag created by user A is visible to user B.
- Soft deletes on junction tables maintain audit trail consistency.
- System tags cannot be deleted or renamed by users.
- Future: tag-based filtering and discovery features can build on this foundation.
