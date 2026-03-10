# Implementation Plan: Google Places Integration

**Branch**: `008-google-places-integration` | **Date**: 2026-03-10 | **Spec**: [specs/008-google-places-integration/spec.md](spec.md)

## Summary

Integrate the **Google Places API (New)** into the "Add a place" and "My Places" flows so that users can search for real-world places by name and have `name`, `address`, `latitude`, `longitude`, `googlePlaceId`, `description`, and `heroImageUrl` pre-populated — with all fields except `description` locked read-only for Google-sourced places. The integration is encapsulated in a new `GooglePlacesService` module (`src/lib/services/google-places/`) that is a pure HTTP boundary with no DB or UI dependencies. Schema changes add `description` (text, nullable) and `hero_image_url` (varchar 2048, nullable) to the `places` table. Immutability is determined at runtime by checking whether `google_place_id` is non-null — no additional boolean column is needed. The `updatePlace` service is extended to enforce the immutability rules for Google-sourced places.

---

## Technical Context

**Language/Version**: TypeScript 5 / Node.js 20 (Next.js 15, App Router)  
**Primary Dependencies**: Next.js 15, Drizzle ORM, Supabase Postgres, Zod, shadcn/ui, Tailwind CSS v4  
**External Integration**: Google Places API (New) — Text Search (`POST https://places.googleapis.com/v1/places:searchText`) + Place Photos (`GET https://places.googleapis.com/v1/{photoName}/media`)  
**Storage**: Supabase Postgres — `places` table extended with 2 new columns; 1 new Drizzle migration
**Testing**: Vitest (unit + integration), Playwright (E2E), React Testing Library (component)  
**Target Platform**: Vercel (server-side only for API key usage)  
**Performance Goals**: Google Places suggestions visible within 1 second of debounce firing; photo URI resolved within 1 second on user selection  
**Constraints**: `GOOGLE_PLACES_API_KEY` must never reach the client bundle; all API calls are server-side only (Server Actions); Text Search billed at Enterprise + Atmosphere SKU due to `editorialSummary` field  
**Scale/Scope**: Single-tenant feature on top of existing place domain; no new routes required

---

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality — single responsibility, DRY | ✅ PASS | `GooglePlacesService` is isolated; no duplication with `place/service.ts` |
| II. Testing discipline | ✅ PASS | Unit tests for `GooglePlacesService` (mocked HTTP), integration tests for updated `updatePlace`, component tests for read-only field state, E2E for full selection flow |
| VI. Architecture integrity — service layer | ✅ PASS | Integration is its own service module; place actions call it server-side only; no direct `fetch` in components or actions |
| VI. Architecture integrity — no new API routes | ✅ PASS | No new `app/api/` routes; search triggered via Server Action |
| VII. Data integrity — soft deletes unchanged | ✅ PASS | New columns don't affect soft-delete logic |
| VIII. Security — API key server-side only | ✅ PASS | `GOOGLE_PLACES_API_KEY` read in `GooglePlacesService` server-side; must not be `NEXT_PUBLIC_` prefixed |
| VIII. Security — no PII leakage in logs | ⚠️ CAUTION | Ensure `GooglePlacesService` logs do not include the raw API key value |

No constitution violations. No complexity justification table required.

---

## Project Structure

### Documentation (this feature)

```text
specs/008-google-places-integration/
├── plan.md          ← this file
├── research.md      ← Phase 0 (API decisions, SKU analysis, photo strategy)
├── data-model.md    ← Phase 1 (schema changes, new types)
├── quickstart.md    ← Phase 1 (local dev setup with API key)
├── contracts/
│   ├── google-places-service.md     ← GooglePlacesService public API contract
│   └── server-actions.md            ← new + modified server action contracts
└── tasks.md         ← Phase 2 (created by /speckit.tasks)
```

### Source Code

```text
src/
├── lib/
│   ├── services/
│   │   └── google-places/               # NEW — integration service
│   │       ├── index.ts                 # public exports
│   │       ├── service.ts               # searchPlaces() + resolvePhotoUri()
│   │       ├── types.ts                 # GooglePlaceResult, GooglePlacesServiceError
│   │       └── errors.ts                # error factory functions
│   └── place/
│       ├── service.ts                   # MODIFIED — updatePlace enforces source rules
│       └── service/
│           └── types.ts                 # MODIFIED — add CreateGooglePlaceInput; extend PlaceRecord with new fields
├── actions/
│   └── place-actions.ts                 # MODIFIED — add searchPlacesAction + resolveGooglePlacePhotoAction, extend createPlaceAction
├── db/
│   └── schema/
│       └── place.ts                     # MODIFIED — add description, heroImageUrl columns
├── schemas/
│   └── place.ts                         # MODIFIED — extend createPlaceSchema, updatePlaceSchema
└── components/
    └── place/                           # MODIFIED — add Google Places search UI to AddPlaceForm

supabase/
└── migrations/
    └── YYYYMMDDHHMMSS_add_place_google_fields.sql  # NEW

tests/
├── unit/
│   └── google-places-service.test.ts    # NEW — mocked HTTP, all error codes, field mapping
├── integration/
│   └── update-place-source-rules.test.ts  # NEW — Google-sourced vs manual update enforcement
├── component/
│   └── add-place-form-google.test.tsx   # NEW — read-only field state after selection
└── e2e/
    └── google-places-search.spec.ts     # NEW — full selection → save flow
```
