# topten Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-11-28

## Active Technologies
- TypeScript 5.x, Node.js >=20.0.0 + Next.js (App Router), Supabase Auth (@supabase/ssr, @supabase/supabase-js), Zod (validation) (002-multi-auth-password-reset)
- Supabase (PostgreSQL) - Auth handled by Supabase Auth service (002-multi-auth-password-reset)
- N/A (UI-only feature, no data persistence) (001-dialog-component-setup)
- TypeScript 5.x, React 19.2.0, Next.js 16.0.5 + Next.js App Router, React 19, Tailwind CSS 4, shadcn/ui (New York style) (001-landing-page)
- N/A (static landing page) (001-landing-page)
- TypeScript 5.x with React 19.2.0 and Next.js 16.0.5 (App Router) (001-header-component)
- N/A (presentational component only) (001-header-component)
- TypeScript 5.x with Next.js 16.0.5 (App Router) (001-landing-page-polish)
- N/A (frontend-only changes) (001-landing-page-polish)
- TypeScript (Next.js 15 with App Router) + React 19, Next.js 15, Tailwind CSS, shadcn/ui (003-fix-modal-headers)
- N/A (UI-only change) (003-fix-modal-headers)
- TypeScript 5.x with Next.js 16 (App Router) (001-dashboard-foundation)
- Supabase (PostgreSQL) with Drizzle ORM - already configured (001-dashboard-foundation)
- TypeScript 5.x with Next.js 16.0.5 (App Router) + React 19.2.0, shadcn/ui components (Card, Badge, Button), Tailwind CSS 4, lucide-react 0.555.0 (001-dashboard-lists-grid)
- PostgreSQL via Supabase with Drizzle ORM (existing `lists` and `list_places` schema) (001-dashboard-lists-grid)
- TypeScript / Next.js 16.0.5 with App Router, React 19.2.0 (001-dashboard-states)
- TypeScript (Next.js 15+ with App Router) + Next.js, React, Supabase Auth, Drizzle ORM, Vitest, React Testing Library (001-auth-service-refactor)
- Supabase (PostgreSQL via Drizzle ORM) (001-auth-service-refactor)
- TypeScript 5 / Next.js 15 App Router (React 19) + Drizzle ORM, Supabase Auth, Zod, shadcn/ui, `useActionState` (React 19) (004-user-settings)
- PostgreSQL via Supabase — `public.users` table (`name varchar(255)`, `vanity_slug varchar(50) UNIQUE`) (004-user-settings)
- TypeScript 5 / Node.js 20 (Next.js 15, App Router) + Next.js 15, Drizzle ORM, Supabase (Postgres), Zod, shadcn/ui, Tailwind CSS v4 (005-lists-service)
- PostgreSQL via Supabase; Drizzle schema at `src/db/schema/list.ts` — table already exists, no migration needed (005-lists-service)
- PostgreSQL via Supabase; Drizzle schemas at `src/db/schema/place.ts` and `src/db/schema/listPlace.ts` — tables already exist, no migration needed (006-places-service)
- TypeScript 5 / Node 20 + Next.js 15 App Router, Drizzle ORM, Supabase Postgres, shadcn/ui, Tailwind CSS v4, Zod, Vitest, Playwright (007-places-management)
- PostgreSQL via Supabase — `places` table (with `userId` ownership column, confirmed in schema) and `list_places` junction table (007-places-management)
- TypeScript 5 / Node.js 20 (Next.js 15, App Router) + Next.js 15, Drizzle ORM, Supabase Postgres, Zod, shadcn/ui, Tailwind CSS v4 (008-google-places-integration)
- Supabase Postgres — `places` table extended with 3 new columns; 1 new Drizzle migration (008-google-places-integration)
- TypeScript 5 / Node 20 + Next.js 16.0.5 (App Router), Tailwind CSS v4, shadcn/ui (new-york), Google Fonts (DM Serif Display, DM Sans) (001-brand-styling)
- N/A for this feature — no schema changes (001-brand-styling)
- TypeScript 5 / Node.js 22 + Next.js 16 (App Router), Drizzle ORM, Supabase (Postgres), Vitest 4, Playwright (009-db-layer-abstraction)
- PostgreSQL via Supabase — Drizzle as ORM (009-db-layer-abstraction)

- **Languages**: TypeScript 5.x, Node.js ≥20.0.0
- **Framework**: Next.js 16.0.5 (App Router)
- **Auth/DB**: @supabase/ssr 0.8.0, @supabase/supabase-js 2.86.0, Supabase (PostgreSQL)
- **Session Storage**: Cookie-based authentication

## Project Structure

```text
src/
├── lib/
│   ├── supabase/       # Supabase clients (browser, server, middleware)
│   └── env.ts          # Environment validation
├── types/
│   └── auth.ts         # Authentication TypeScript types
└── app/                # Next.js App Router pages

tests/
└── unit/               # Unit tests (Vitest)
```

## Commands

- `pnpm dev` - Start development server
- `pnpm test` - Run unit tests
- `pnpm test:coverage` - Run tests with coverage
- `pnpm lint` - Run linting
- `pnpm typecheck` - TypeScript type checking

## Code Style

- Follow TypeScript strict mode conventions
- Use path alias `@/*` for imports from `./src/*`
- Prefer server components in Next.js App Router where appropriate

## Recent Changes
- 009-db-layer-abstraction: Added TypeScript 5 / Node.js 22 + Next.js 16 (App Router), Drizzle ORM, Supabase (Postgres), Vitest 4, Playwright
- 001-brand-styling: Added TypeScript 5 / Node 20 + Next.js 16.0.5 (App Router), Tailwind CSS v4, shadcn/ui (new-york), Google Fonts (DM Serif Display, DM Sans)
- 008-google-places-integration: Added TypeScript 5 / Node.js 20 (Next.js 15, App Router) + Next.js 15, Drizzle ORM, Supabase Postgres, Zod, shadcn/ui, Tailwind CSS v4


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
