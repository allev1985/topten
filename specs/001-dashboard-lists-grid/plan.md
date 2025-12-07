# Implementation Plan: Dashboard Lists and Grids

**Branch**: `001-dashboard-lists-grid` | **Date**: 2025-12-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-dashboard-lists-grid/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Create a responsive dashboard grid that displays curator lists as visual cards. Each card shows a hero image, title, publication status badge, and place count. The grid adapts from 1 column (mobile) to 2 columns (tablet) to 3 columns (desktop). This feature provides curators with a visual portfolio overview of all their lists, enabling quick scanning and status identification. Mock data will be used initially, with console logging for card interactions.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 16.0.5 (App Router)  
**Primary Dependencies**: React 19.2.0, shadcn/ui components (Card, Badge, Button), Tailwind CSS 4, lucide-react 0.555.0  
**Storage**: PostgreSQL via Supabase with Drizzle ORM (existing `lists` and `list_places` schema)  
**Testing**: Vitest 4.0.14 with React Testing Library 16.3.0, Playwright 1.57.0 for E2E  
**Target Platform**: Modern web browsers (desktop, tablet, mobile responsive)
**Project Type**: Web application (Next.js App Router with Server/Client Components)  
**Performance Goals**: Dashboard page load within 2 seconds, <100ms interaction response, 60 FPS smooth scrolling  
**Constraints**: WCAG 2.1 AA accessibility compliance, responsive 320px-4K viewports, ≥65% test coverage  
**Scale/Scope**: Initial support for 5 mock lists, designed to scale to hundreds of lists per curator

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ I. Code Quality & Maintainability (NON-NEGOTIABLE)

- **DRY Compliance**: Component will reuse existing shadcn/ui components (Card, Badge, Button). Grid layout uses Tailwind utility classes. No custom abstraction layers needed.
- **Framework Code Integrity**: Will NOT modify shadcn/ui components in `components/ui/`. Will compose Card component for ListCard. Uses Next.js Image component as provided.
- **Simplicity**: Single-responsibility components (ListCard for display, ListGrid for layout). Clear separation of concerns.
- **Status**: ✅ PASS - No violations. Reusing existing patterns and components.

### ✅ II. Testing Discipline & Safety Nets (NON-NEGOTIABLE)

- **Test Coverage Target**: ≥65% coverage for new components (ListCard, ListGrid)
- **Test Strategy**:
  - Unit tests (Vitest + RTL): ListCard component with various props, status badge rendering, truncation behavior
  - Unit tests (Vitest + RTL): ListGrid responsive layout with different data sets
  - Component integration tests: Card click handlers, menu button isolation
  - E2E tests (Playwright): Responsive grid at different breakpoints, accessibility
- **Status**: ✅ PASS - Comprehensive test plan defined in spec (SC-007, SC-008)

### ✅ III. User Experience Consistency

- **Consistency**: Uses existing dashboard layout patterns (DashboardContent, DashboardHeader)
- **Terminology**: Follows established patterns ("Published"/"Draft" status, "places" terminology)
- **Visual Design**: Uses shadcn/ui design system, Tailwind utility classes matching existing components
- **Status**: ✅ PASS - Maintains consistency with existing dashboard patterns

### ✅ IV. Performance & Resource Efficiency

- **Performance Targets**: 
  - Dashboard load: <2 seconds (SC-001)
  - Interaction response: <100ms (SC-005)
  - Smooth 60 FPS scrolling
- **Optimizations**:
  - Next.js Image component for optimized image delivery (FR-020)
  - Placeholder service (placehold.co) for mock images
  - Responsive images with appropriate sizes
- **Status**: ✅ PASS - Clear performance targets with optimization strategy

### ✅ V. Observability & Debuggability

- **Logging**: Console logging for card clicks (FR-015) during initial implementation
- **Error Handling**: Next.js Image component handles failed image loads, fallback for missing hero images
- **Accessibility**: Alt text for images (FR-016), semantic HTML (FR-017), ARIA labels
- **Status**: ✅ PASS - Adequate observability for development and debugging

### Gate Decision: ✅ PROCEED TO PHASE 0 → ✅ POST-DESIGN RE-CHECK PASSED

**Initial Check (Pre-Phase 0)**: All constitutional requirements satisfied.

**Post-Design Re-Check (After Phase 1)**:
- ✅ **Code Quality**: Design maintains DRY principles with typed interfaces, mock data structure, and component composition pattern
- ✅ **Testing**: Detailed test contracts defined with unit, integration, and E2E coverage. Testing strategy covers all user scenarios
- ✅ **UX Consistency**: Component contracts ensure consistent interaction patterns. Accessibility requirements fully specified
- ✅ **Performance**: Next.js Image optimization configured. Responsive grid uses CSS Grid for efficient layout. Bundle size impact documented (~7KB)
- ✅ **Observability**: Clear error handling contracts. TypeScript types prevent runtime errors. Console logging for debugging

**Conclusion**: Design phase complete. All constitutional requirements remain satisfied. No complexity exceptions needed. Ready to proceed to Phase 2 (Task Generation).

## Project Structure

### Documentation (this feature)

```text
specs/001-dashboard-lists-grid/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── dashboard/
│   │   ├── DashboardContent.tsx      # Existing - layout container
│   │   ├── DashboardHeader.tsx       # Existing - header component
│   │   ├── DashboardSidebar.tsx      # Existing - navigation sidebar
│   │   ├── ListCard.tsx              # NEW - individual list card component
│   │   └── ListGrid.tsx              # NEW - responsive grid container
│   └── ui/
│       ├── card.tsx                  # Existing - shadcn/ui base card
│       ├── badge.tsx                 # NEW - shadcn/ui badge component
│       ├── button.tsx                # Existing - shadcn/ui button
│       └── dropdown-menu.tsx         # NEW - shadcn/ui dropdown menu
├── app/
│   └── (dashboard)/
│       └── dashboard/
│           └── page.tsx              # MODIFIED - integrate ListGrid
├── types/
│   └── list.ts                       # NEW - TypeScript types for List entity
└── lib/
    └── mocks/
        └── lists.ts                  # NEW - mock data for development

tests/
├── unit/
│   └── components/
│       └── dashboard/
│           ├── ListCard.test.tsx     # NEW - ListCard unit tests
│           └── ListGrid.test.tsx     # NEW - ListGrid unit tests
└── e2e/
    └── dashboard/
        └── lists-grid.spec.ts        # NEW - E2E tests for responsive grid
```

**Structure Decision**: Next.js App Router with component-based architecture. New components in `src/components/dashboard/` follow existing dashboard pattern. shadcn/ui components added via CLI to `src/components/ui/`. Mock data in `src/lib/mocks/` for development isolation. Tests mirror source structure for discoverability.

## Complexity Tracking

> **No violations identified - section intentionally left empty**

The implementation follows established patterns and does not introduce complexity that requires constitutional justification.
