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
- 001-dashboard-states: Added TypeScript / Next.js 16.0.5 with App Router, React 19.2.0
- 001-dashboard-lists-grid: Added TypeScript 5.x with Next.js 16.0.5 (App Router) + React 19.2.0, shadcn/ui components (Card, Badge, Button), Tailwind CSS 4, lucide-react 0.555.0
- 001-dashboard-foundation: Added TypeScript 5.x with Next.js 16 (App Router)


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
