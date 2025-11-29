# topten Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-11-28

## Active Technologies

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

- **001-supabase-auth-setup**: Added authentication foundation with Supabase SSR integration

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
