# Quickstart: Places Management

**Branch**: `007-places-management`

## Overview

This feature adds a "My Places" management page at `/dashboard/places`. It extends the existing `PlaceService` and wires three new Server Actions to a new UI page.

## No Migrations Required

This feature adds no new schema columns or tables. The `places.user_id` column and existing indexes (`places_deleted_at_idx`, `list_places_place_id_idx`) added in spec 006 are sufficient.

## Implementation Order

Work through these phases in order — each phase unlocks the next.

### Phase 1 — Service layer

1. Add `PlaceWithListCount`, `CreateStandalonePlaceResult`, and `DeletePlaceResult` to `src/lib/place/service/types.ts`.
2. Add `createStandalonePlaceSchema` to `src/schemas/place.ts`.
3. Add three new functions to `src/lib/place/service.ts`:
   - `getAllPlacesByUser({ userId })` — left-join count query
   - `createStandalonePlace({ userId, name, address })` — insert only, no ListPlace
   - `deletePlace({ placeId, userId })` — single atomic transaction with cascade

### Phase 2 — Config + Actions

4. Add `places: "/dashboard/places"` to `DASHBOARD_ROUTES` in `src/lib/config/index.ts`.
5. Add `createStandalonePlaceAction` and `deletePlaceAction` to `src/actions/place-actions.ts` following the existing action pattern (auth → validate → service → revalidatePath → return ActionState).
   - `deletePlaceAction` MUST call `revalidatePath("/dashboard/lists", "layout")` in addition to `revalidatePath("/dashboard/places")` to invalidate all list-detail pages.

### Phase 3 — UI components

6. Build `src/app/(dashboard)/dashboard/places/_components/`:
   - `PlaceCard.tsx` — name, address, "In N list(s)", Edit button, Delete button
   - `AddPlaceDialog.tsx` — standalone create form (name + address, no list picker)
   - `EditPlaceDialog.tsx` — pre-filled edit form with dirty-state tracking (reuse or closely follow the pattern from the list-detail `EditPlaceDialog`)
   - `DeletePlaceDialog.tsx` — confirmation dialog with `activeListCount` in message
   - `PlacesClient.tsx` — orchestrates the above; manages dialog open/close state

7. Build `src/app/(dashboard)/dashboard/places/page.tsx`:
   ```tsx
   // Server Component — same pattern as DashboardPage
   const sessionResult = await getSession();
   if (!sessionResult.authenticated) redirect("/login");
   const places = await getAllPlacesByUser(sessionResult.user.id);
   return <PlacesClient initialPlaces={places} />;
   ```

### Phase 4 — Navigation

8. Add a "My Places" nav link in the dashboard layout or sidebar pointing to `DASHBOARD_ROUTES.places`.

## Running the feature locally

```bash
# No migration needed — schema is already up to date
pnpm dev
# Navigate to /dashboard/places
```

## Verifying correctness

```bash
# Unit + integration tests
pnpm test

# Component tests
pnpm test:component

# E2E
pnpm test:e2e --grep "places-management"
```
