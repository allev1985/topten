# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev          # Start dev server (port 3000)
pnpm build        # Production build
pnpm typecheck    # TypeScript type checking

# Linting & formatting
pnpm lint         # ESLint
pnpm lint:fix     # Auto-fix lint issues
pnpm format       # Prettier write
pnpm format:check # Prettier check

# Testing
pnpm test               # Run all Vitest tests (unit + component + integration)
pnpm test:watch         # Watch mode
pnpm test:coverage      # Coverage report
pnpm test:e2e           # Playwright E2E tests
pnpm test:e2e:ui        # Playwright interactive UI

# Database
pnpm db:generate  # Generate Drizzle migrations
pnpm db:migrate   # Run migrations
pnpm db:seed      # Seed initial data
pnpm db:studio    # Drizzle Studio GUI

# Local Supabase (requires Docker)
pnpm supabase:start
pnpm supabase:stop
pnpm supabase:status

# Local observability stack — Grafana at http://localhost:3001 (requires Docker)
pnpm observability:start   # Start Grafana, Tempo, Prometheus, Loki, OTel Collector
pnpm observability:stop    # Stop the stack
pnpm observability:status  # Check running containers
```

To run a single test file: `pnpm test -- tests/unit/my-file.test.ts`

## Architecture

**YourFavs** is a Next.js App Router application where users curate and share lists of favourite places.

### Layer overview

```
React Components (Client/Server)
        ↓
Server Actions (src/actions/)        ← form submission handlers
        ↓
Auth Service (src/lib/auth/service.ts)  ← centralised auth business logic
        ↓
Supabase SDK (@supabase/ssr)
        ↓
Supabase (Postgres + Auth)
```

Authentication uses a **service-based architecture** — server actions call `src/lib/auth/service.ts` directly (no HTTP roundtrip). The only remaining API route is `GET /api/auth/verify` for Supabase email verification callbacks.

### Key directories

- `src/app/` — Next.js App Router pages and the single remaining API route
- `src/actions/` — Server actions (`auth-actions.ts` is the main one)
- `src/lib/auth/` — Auth service, middleware helpers, Supabase client wrappers
- `src/lib/config/` — App-wide constants and route definitions
- `src/components/ui/` — **shadcn/ui generated components — never edit directly**
- `src/db/schema/` — Drizzle ORM table definitions
- `src/schemas/` — Zod validation schemas
- `tests/` — `unit/`, `component/`, `integration/`, `e2e/`, `fixtures/`, `utils/`
- `docs/decisions/` — Architecture Decision Records (ADRs)

### Data model

Four core tables (all with UUID PKs and soft deletes via `deleted_at`):

- **User** — has a unique `vanity_slug` for profile URLs (`/@alex`)
- **List** — belongs to User; `slug` is unique per user; has `is_published` / `published_at`
- **Place** — cached Google Places data; unique on `google_place_id`
- **ListPlace** — junction table with `position` (ordering) and `hero_image_url` (per-creator image choice)

All queries must filter `deleted_at IS NULL`. List slugs are unique per user, not globally.

### URL structure

| Route | Description |
|-------|-------------|
| `/@{vanity_slug}` | Creator profile |
| `/@{vanity_slug}/{list-slug}` | Individual list |
| `/` | Homepage |

### Route protection

Middleware (`src/middleware.ts` + `src/lib/auth/helpers/middleware.ts`) protects `/dashboard` and `/settings`. Public routes include `/`, `/login`, `/signup`, `/verify-email`, `/forgot-password`, `/reset-password`. Redirects to login preserve a `redirectTo` param and validate against open-redirect.

### Google Places integration

All Google Places API calls are **server-side only**. Place data is cached in the `Place` table and refreshed when a list containing that place is edited. Failed API calls must not block list operations — fall back to cached data.

## Key conventions

- **Never modify `src/components/ui/`** — these are shadcn/ui generated files; wrap or compose instead
- Soft deletes everywhere — set `deleted_at`, never hard-delete for MVP
- Passwords require: 12+ chars, upper, lower, number, special character
- Comment complex logic with references to `docs/decisions/`
- Google Places API key is server-side only (`GOOGLE_PLACES_API_KEY`, no `NEXT_PUBLIC_` prefix)

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
GOOGLE_PLACES_API_KEY   # server-side only
```

Copy `.env.example` to `.env.local` for local development.

## Testing

- **Unit** (`tests/unit/`) — business logic, utilities, hooks
- **Component** (`tests/component/`) — React Testing Library, UI in isolation
- **Integration** (`tests/integration/`) — auth flows, middleware, service-to-Supabase
- **E2E** (`tests/e2e/`) — Playwright, critical user journeys

Vitest config: `vitest.config.ts` (jsdom, v8 coverage, excludes `src/db/migrations/` and `src/app/`).

Bug fixes must include a failing test before the fix.
