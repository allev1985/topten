# Implementation Plan: Remove Category Entity

**Branch**: `001-remove-category` | **Date**: 2025-11-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-remove-category/spec.md`

## Summary

Remove the Category entity from the data model to align with the updated high-level architecture. The platform will defer category functionality to future releases, simplifying the MVP by allowing lists to exist independently without category associations. This involves:

1. Removing the Category database table and schema definition
2. Removing the `category_id` foreign key from the List table
3. Removing category-related indexes
4. Removing category seeding logic
5. Updating documentation to reflect the simplified data model

## Technical Context

**Language/Version**: TypeScript with Node.js 20+  
**Primary Dependencies**: Drizzle ORM, Next.js (App Router)  
**Storage**: PostgreSQL via Supabase  
**Testing**: Vitest + React Testing Library + Playwright  
**Target Platform**: Next.js web application deployed on Vercel  
**Project Type**: Web application (single codebase with App Router)  
**Performance Goals**: Creator profile pages loading in under 2 seconds  
**Constraints**: Pre-launch architectural change, no production data migration required  
**Scale/Scope**: MVP scope, schema simplification

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality & Maintainability ✅
- **Compliant**: Removing the Category entity simplifies the data model and reduces unnecessary complexity
- **Action**: Ensure clean removal of all Category references without orphaned code

### II. Testing Discipline & Safety Nets ✅
- **Compliant**: All existing tests must pass after category removal
- **Action**: Update or remove any tests that reference Category; verify test suite passes

### III. User Experience Consistency ✅
- **Compliant**: URL structure changes from `/@{vanity_slug}/{category-slug}/{list-slug}` to `/@{vanity_slug}/{list-slug}` - intentional simplification
- **Action**: Document the URL change; no backward compatibility required per spec assumptions

### IV. Performance & Resource Efficiency ✅
- **Compliant**: Removing the Category table reduces JOIN complexity and improves query performance
- **Action**: Remove `lists_category_published_idx` index; no new performance concerns

### V. Observability & Debuggability ✅
- **Compliant**: No impact on logging or diagnostics
- **Action**: None required

**Gate Status**: PASSED - No violations requiring justification

## Project Structure

### Documentation (this feature)

```text
specs/001-remove-category/
├── plan.md              # This file
├── research.md          # Phase 0 output - research findings
├── data-model.md        # Phase 1 output - updated schema definitions
├── quickstart.md        # Phase 1 output - implementation guide
├── contracts/           # Phase 1 output - API contracts (N/A for schema-only change)
└── tasks.md             # Phase 2 output - implementation tasks
```

### Source Code (repository root)

```text
src/
├── db/
│   ├── schema/
│   │   ├── category.ts    # DELETE - Category schema definition
│   │   ├── list.ts        # MODIFY - Remove category_id FK and index
│   │   ├── index.ts       # MODIFY - Remove Category export
│   │   ├── user.ts        # UNCHANGED
│   │   ├── place.ts       # UNCHANGED
│   │   └── listPlace.ts   # UNCHANGED
│   ├── seed/
│   │   ├── categories.ts  # DELETE - Category seed data
│   │   └── index.ts       # MODIFY - Remove seedCategories call
│   └── index.ts           # UNCHANGED - DB connection
├── app/                   # Next.js App Router pages (potential future updates)
└── components/            # React components (potential future updates)

specs/
└── 001-local-dev-setup/
    ├── data-model.md      # UPDATE - Remove Category references
    └── spec.md            # UPDATE - Remove Category references
```

**Structure Decision**: Single Next.js application with Drizzle ORM. Changes are localized to the database schema and seed directories, plus documentation updates.

## Complexity Tracking

> No Constitution Check violations - this table is not required.

*This change reduces complexity by removing an unused entity from the data model.*
