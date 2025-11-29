# Implementation Plan: Database Schema & Supabase Auth Configuration

**Branch**: `001-database-schema-auth-config` | **Date**: 2025-11-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-database-schema-auth-config/spec.md`

## Summary

Configure Supabase Auth for secure user authentication with email verification and strong password requirements. This task establishes the foundational database schema with Row Level Security (RLS) policies that protect user data, creates branded email templates for verification and password reset flows, and implements password validation utilities. The implementation uses PostgreSQL functions and Supabase Auth configuration to enforce security requirements at the database level.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+  
**Primary Dependencies**: Next.js 16 (App Router), @supabase/ssr 0.8.0, @supabase/supabase-js 2.86.0, Drizzle ORM 0.44.7  
**Storage**: PostgreSQL via Supabase (major version 17)  
**Testing**: Vitest 4.x + React Testing Library + Playwright  
**Target Platform**: Web (Vercel deployment)  
**Project Type**: Web application (Next.js App Router)  
**Performance Goals**: Authentication operations < 500ms p95, RLS policy evaluation < 10ms  
**Constraints**: Must integrate with existing Drizzle schema, maintain compatibility with `auth.users` table  
**Scale/Scope**: Initial MVP targeting thousands of users, single database instance

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Pre-Phase 0 Gate Evaluation

| Principle                             | Status  | Evidence                                                                          |
| ------------------------------------- | ------- | --------------------------------------------------------------------------------- |
| I. Code Quality & Maintainability     | ✅ PASS | SQL migrations use clear naming, single responsibility per file                   |
| II. Testing Discipline & Safety Nets  | ✅ PASS | Unit tests for password validation, integration tests for RLS policies planned    |
| III. User Experience Consistency      | ✅ PASS | Email templates follow consistent branding, error messages are user-friendly      |
| IV. Performance & Resource Efficiency | ✅ PASS | RLS policies use indexed columns (auth.uid()), password validation is lightweight |
| V. Observability & Debuggability      | ✅ PASS | Configuration changes documented in migration comments                            |

### Post-Phase 1 Gate Re-Evaluation

| Principle                             | Status  | Evidence                                                                    |
| ------------------------------------- | ------- | --------------------------------------------------------------------------- |
| I. Code Quality & Maintainability     | ✅ PASS | Migration file follows Supabase conventions, helper functions are isolated  |
| II. Testing Discipline & Safety Nets  | ✅ PASS | Test strategy covers password validation (unit), RLS policies (integration) |
| III. User Experience Consistency      | ✅ PASS | Email templates use consistent layout, clear CTAs                           |
| IV. Performance & Resource Efficiency | ✅ PASS | RLS policies optimized with `auth.uid()` comparisons on indexed columns     |
| V. Observability & Debuggability      | ✅ PASS | Migration includes comments explaining policy rationale                     |

## Project Structure

### Documentation (this feature)

```text
specs/001-database-schema-auth-config/
├── plan.md              # This file
├── research.md          # Phase 0 output - RLS patterns, email template best practices
├── data-model.md        # Phase 1 output - Schema and policy definitions
├── quickstart.md        # Phase 1 output - Setup instructions
├── contracts/           # Phase 1 output - N/A for this feature (no API endpoints)
└── tasks.md             # Phase 2 output (NOT created by this plan)
```

### Source Code (repository root)

```text
supabase/
├── config.toml                              # Auth configuration (modified)
├── migrations/
│   └── 001_initial_auth_setup.sql          # Database schema with RLS policies
└── templates/
    ├── confirmation.html                    # Email verification template
    └── recovery.html                        # Password reset template

src/
├── lib/
│   └── validation/
│       └── password.ts                      # Password validation utilities
└── db/
    └── schema/
        └── user.ts                          # Existing user schema (no changes needed)

tests/
└── unit/
    └── lib/
        └── validation/
            └── password.test.ts             # Password validation tests
```

**Structure Decision**: Using existing Next.js App Router structure with `src/` directory. Supabase-specific files (migrations, templates, config) reside in the `supabase/` directory following Supabase CLI conventions. Password validation utilities are placed in `src/lib/validation/` to be reusable across the application.

## Complexity Tracking

No violations identified. The implementation follows standard Supabase patterns without introducing additional complexity.
