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

# Local dev infrastructure — Postgres + Mailhog (requires Docker)
pnpm dev:start    # Start postgres (port 5432) and Mailhog SMTP (port 1025)
pnpm dev:stop     # Stop containers
pnpm dev:status   # Check running containers
pnpm dev:email    # Open Mailhog UI at http://localhost:8025

# Local observability stack — Grafana at http://localhost:3001 (requires Docker)
pnpm observability:start   # Start Grafana, Tempo, Prometheus, Loki, OTel Collector
pnpm observability:stop    # Stop the stack
pnpm observability:status  # Check running containers
```

To run a single test file: `pnpm test -- tests/unit/my-file.test.ts`

## Architecture

**myfaves** is a Next.js App Router application where users curate and share lists of favourite places.

### Layer overview

```
React Components (Client/Server)
        ↓
Server Actions (src/actions/)           ← form submission handlers
        ↓
Auth Service (src/lib/auth/service.ts)  ← centralised auth business logic
        ↓
BetterAuth (src/lib/auth/auth.ts)
        ↓
Drizzle ORM + Postgres
```

Authentication uses a **service-based architecture** — server actions call `src/lib/auth/service.ts` directly (no HTTP roundtrip). The API route `POST|GET /api/auth/[...all]` is the BetterAuth catch-all handler.

### Key directories

- `src/app/` — Next.js App Router pages and layouts
- `src/app/api/auth/[...all]/` — BetterAuth catch-all API route
- `src/actions/` — Server actions (`auth-actions.ts`, `list-actions.ts`, `place-actions.ts`, `profile-actions.ts`)
- `src/lib/auth/` — Auth service, BetterAuth config, middleware helpers
- `src/lib/config/` — App-wide constants and route definitions (`index.ts` server, `client.ts` client-safe)
- `src/lib/place/` — Place service and types
- `src/lib/list/` — List service and types
- `src/lib/profile/` — Profile service and types
- `src/lib/services/logging/` — Structured pino logger and OpenTelemetry integration
- `src/components/auth/` — Auth forms shared across pages and modals (`login-form.tsx`, `signup-form.tsx`)
- `src/components/dashboard/` — Dashboard UI: list management, place management, settings forms, sidebar/header
- `src/components/public/` — Public profile and list view components
- `src/components/shared/` — App-wide components (Header, LoginModal, SignupModal)
- `src/components/ui/` — **shadcn/ui generated components — never edit directly**
- `src/db/schema/` — Drizzle ORM table definitions
- `src/schemas/` — Zod validation schemas
- `tests/` — `unit/`, `component/`, `integration/`, `e2e/`, `fixtures/`, `utils/`
- `docs/decisions/` — Architecture Decision Records (ADRs)

### Component conventions

Components follow a **page-local / shared** split:

- **`src/components/`** — any component used by more than one page or route, or by another shared component. Organised by domain: `auth/`, `dashboard/`, `dashboard/places/`, `dashboard/settings/`, `public/`, `shared/`.
- **`src/app/**/_components/`** — components used by exactly one page. The underscore prefix prevents Next.js treating the folder as a route segment. Do not import from a `_components/` folder belonging to a different route.

When a component grows to be needed in a second place, move it from `_components/` into the appropriate `src/components/` subdirectory and update imports.

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
- **Never use `console.log/info/warn/error` in server-side code** — use the structured logger instead (see Logging below)
- **Never use `process.env` outside `src/lib/config/index.ts`**

## Logging

All server-side code must use the structured logger from `src/lib/services/logging/`:

```typescript
import { createServiceLogger } from "@/lib/services/logging";

const log = createServiceLogger("my-service");

log.info({ method: "doThing", userId }, "Thing done");
log.error({ method: "doThing", err }, "Thing failed");
```

**Log level semantics:**

| Level | When to use |
|-------|-------------|
| `trace` | Method entry/exit, every DB call parameter |
| `debug` | Intermediate state, computed values, dev-only detail |
| `info` | User-initiated actions, successful state transitions |
| `warn` | Recoverable failures, fallbacks used |
| `error` | Thrown errors, failed operations |
| `fatal` | Process-level failures |

**Standard fields** — include whichever are in scope: `method`, `userId`, `sessionId`, `listId`, `placeId`, `durationMs`, `err`. The `traceId`/`spanId` fields are injected automatically from the active OpenTelemetry span.

`LOG_LEVEL` is set in `.env.local` and exported from `src/lib/config/index.ts`. The one exception is client components, where `console.error` is acceptable since the server-side logger cannot run in the browser.

## Environment variables

```
AUTH_SECRET                    # generate: openssl rand -base64 32
NEXT_PUBLIC_APP_URL            # e.g. http://localhost:3000
DATABASE_URL                   # e.g. postgresql://postgres:postgres@localhost:5432/topten
SMTP_HOST                      # default: localhost
SMTP_PORT                      # default: 1025 (Mailhog)
SMTP_FROM                      # default: noreply@myfaves.local
GOOGLE_PLACES_API_KEY          # server-side only
LOG_LEVEL                      # trace|debug|info|warn|error|fatal (optional)
OTEL_SERVICE_NAME              # defaults to "topten" (optional)
OTEL_EXPORTER_OTLP_ENDPOINT   # defaults to http://localhost:4318 (optional)
```

Copy `.env.example` to `.env.local` for local development.

## Testing

- **Unit** (`tests/unit/`) — business logic, utilities, hooks
- **Component** (`tests/component/`) — React Testing Library, UI in isolation
- **Integration** (`tests/integration/`) — auth flows, middleware, service-to-database
- **E2E** (`tests/e2e/`) — Playwright, critical user journeys

Vitest config: `vitest.config.ts` (jsdom, v8 coverage, excludes `src/db/migrations/` and `src/app/`).

Bug fixes must include a failing test before the fix.
