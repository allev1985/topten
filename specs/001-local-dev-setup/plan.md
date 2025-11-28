# Implementation Plan: Local Development Environment Setup

**Branch**: `001-local-dev-setup` | **Date**: 2025-11-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-local-dev-setup/spec.md`

## Summary

This feature establishes the complete local development environment for the YourFavs/TopTen platform. The implementation will provide a fully functional development setup enabling developers to clone the repository and begin contributing within 15 minutes. The technical approach uses Next.js 14+ with App Router, Supabase (Postgres + Auth) running locally via Docker, Drizzle ORM for database operations, Tailwind CSS with shadcn/ui for styling, and a comprehensive testing stack (Vitest, React Testing Library, Playwright).

## Technical Context

**Language/Version**: TypeScript with Node.js 20+ (LTS)
**Primary Dependencies**: Next.js 14+, Drizzle ORM, Supabase JS Client, Tailwind CSS 3.4+, shadcn/ui, ESLint, Prettier
**Storage**: PostgreSQL via Supabase (local Docker instance for development)
**Testing**: Vitest (unit), React Testing Library (component), Playwright (E2E)
**Target Platform**: Web application (server-side rendered with Next.js App Router)
**Project Type**: Web application (fullstack Next.js monorepo)
**Performance Goals**: Development server startup < 30s, hot reload < 3s, lint < 30s, format < 30s
**Constraints**: Must run on Docker for local Supabase, pnpm as package manager, Node.js 20+
**Scale/Scope**: Single-developer to small-team development workflow, ~50 screens target

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Pre-Design Gates (Phase 0)

| Principle              | Requirement                                                          | Status  | Evidence                                                                                   |
| ---------------------- | -------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------ |
| I. Code Quality        | Modules have clear single responsibility, follow style/linting rules | ✅ PASS | ESLint + Prettier configuration planned; TypeScript strict mode enabled                    |
| II. Testing Discipline | Automated tests for user-facing behavior and critical logic          | ✅ PASS | Vitest + RTL + Playwright stack configured; test coverage reporting enabled                |
| III. UX Consistency    | Consistent terminology and interaction patterns                      | ✅ PASS | shadcn/ui provides consistent component patterns; Tailwind ensures visual consistency      |
| IV. Performance        | Clearly defined performance targets with measurement                 | ✅ PASS | Performance goals defined: dev startup <30s, hot reload <3s, tests within specified bounds |
| V. Observability       | Sufficient logging and diagnostics                                   | ✅ PASS | Development environment enables debugging; console logging available                       |

### Quality & Delivery Standards

| Standard                     | Compliance | Notes                                          |
| ---------------------------- | ---------- | ---------------------------------------------- |
| Testing strategy documented  | ✅         | Unit/Component/E2E strategy defined in spec    |
| Performance goals documented | ✅         | Success criteria SC-001 through SC-012 in spec |
| Testable acceptance criteria | ✅         | Each user story has Given/When/Then scenarios  |

## Project Structure

### Documentation (this feature)

```text
specs/001-local-dev-setup/
├── plan.md              # This file (implementation plan)
├── research.md          # Phase 0 output (research findings)
├── data-model.md        # Phase 1 output (entity definitions)
├── quickstart.md        # Phase 1 output (developer setup guide)
├── contracts/           # Phase 1 output (N/A for dev setup - no API contracts)
└── tasks.md             # Phase 2 output (created by /speckit.tasks command)
```

### Source Code (repository root)

```text
# Next.js App Router structure (fullstack monorepo)
src/
├── app/                     # Next.js App Router pages and layouts
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Homepage
│   ├── @[vanity_slug]/      # Creator profile routes (dynamic)
│   └── category/            # Category browse routes
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   └── [feature]/           # Feature-specific components
├── db/                      # Database layer
│   ├── schema/              # Drizzle schema definitions
│   ├── migrations/          # Database migrations
│   └── seed/                # Seed data scripts
├── lib/                     # Shared utilities and clients
│   ├── supabase/            # Supabase client configuration
│   └── utils/               # Helper functions
└── types/                   # TypeScript type definitions

tests/
├── unit/                    # Vitest unit tests
├── component/               # React Testing Library component tests
└── e2e/                     # Playwright end-to-end tests

# Configuration files (root)
.env.example                 # Environment variable template
.env.local                   # Local environment (gitignored)
drizzle.config.ts            # Drizzle ORM configuration
next.config.js               # Next.js configuration
tailwind.config.ts           # Tailwind CSS configuration
tsconfig.json                # TypeScript configuration
vitest.config.ts             # Vitest configuration
playwright.config.ts         # Playwright configuration
```

**Structure Decision**: Using Next.js App Router with a fullstack monorepo structure. All application code lives under `src/` with Next.js conventions. Database schema and migrations use Drizzle ORM under `src/db/`. Tests are organized by type (unit, component, e2e) in the `tests/` directory at root level.

## Complexity Tracking

> **No violations identified - all choices align with constitution principles**

| Decision              | Rationale                                                    | Alternative Considered                                    |
| --------------------- | ------------------------------------------------------------ | --------------------------------------------------------- |
| Next.js App Router    | Industry standard for React SSR; native to Vercel deployment | Pages Router (older pattern), Remix (different ecosystem) |
| Drizzle ORM           | Type-safe, lightweight, excellent TypeScript support         | Prisma (heavier), direct SQL (less type-safe)             |
| Supabase local Docker | Official supported approach for local development            | Direct Postgres (loses auth integration)                  |
| pnpm                  | Faster, disk-efficient; recommended for modern projects      | npm (slower), yarn (similar but less modern)              |
| shadcn/ui             | Copy-paste components, full customization control            | Radix primitives only (more work), MUI (heavier)          |

---

## Post-Design Constitution Check (Phase 1 Complete)

_Re-evaluation after Phase 1 design completion_

### Design Review Gates

| Principle              | Requirement                                       | Status  | Evidence                                                                           |
| ---------------------- | ------------------------------------------------- | ------- | ---------------------------------------------------------------------------------- |
| I. Code Quality        | Schema has clear single responsibility per entity | ✅ PASS | 5 entities (User, Category, List, Place, ListPlace) with distinct responsibilities |
| II. Testing Discipline | Data model supports testability                   | ✅ PASS | Soft delete pattern enables safe testing; seed data defined for Categories         |
| III. UX Consistency    | URL structure supports consistent navigation      | ✅ PASS | Defined routes: `/@{slug}`, `/@{slug}/{cat}/{list}`, `/category/{slug}`            |
| IV. Performance        | Indexes defined for query patterns                | ✅ PASS | Indexes documented for all frequent queries in data-model.md                       |
| V. Observability       | Schema supports audit tracking                    | ✅ PASS | `created_at`, `updated_at`, `deleted_at` on all entities                           |

### Artifacts Produced

| Artifact            | Location                                        | Status                          |
| ------------------- | ----------------------------------------------- | ------------------------------- |
| Implementation Plan | `specs/001-local-dev-setup/plan.md`             | ✅ Complete                     |
| Research Findings   | `specs/001-local-dev-setup/research.md`         | ✅ Complete                     |
| Data Model          | `specs/001-local-dev-setup/data-model.md`       | ✅ Complete                     |
| Quickstart Guide    | `specs/001-local-dev-setup/quickstart.md`       | ✅ Complete                     |
| API Contracts       | `specs/001-local-dev-setup/contracts/README.md` | ✅ N/A (infrastructure feature) |
| Agent Context       | `.github/agents/copilot-instructions.md`        | ✅ Updated                      |

### Ready for Phase 2

All Phase 0-1 gates passed. Feature is ready for task breakdown in Phase 2 (`/speckit.tasks` command).
