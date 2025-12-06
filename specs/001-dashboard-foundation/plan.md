# Implementation Plan: Dashboard Foundation

**Branch**: `001-dashboard-foundation` | **Date**: 2025-12-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-dashboard-foundation/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

The Dashboard Foundation feature provides a secure, responsive workspace for authenticated curators. It implements:

1. **Authentication Protection**: Server-side auth via existing (dashboard) layout + client-side session monitoring
2. **Responsive Layout**: Fixed sidebar for desktop (≥1024px), hamburger menu with slide-out drawer for mobile (<1024px)
3. **Component Architecture**: Modular design with DashboardSidebar, DashboardContent, and mobile drawer using shadcn Sheet
4. **Testing Strategy**: Comprehensive coverage (≥65%) across unit, component, and integration tests

**Technical Approach**: Leverage existing Supabase auth infrastructure and Next.js 16 App Router patterns. Use shadcn/ui Sheet component for mobile drawer with smooth animations. Implement client-side session monitoring via useEffect for detecting auth state changes.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 16 (App Router)  
**Primary Dependencies**: 
- React 19.2.0
- Next.js 16.0.5
- Supabase SSR (@supabase/ssr 0.8.0)
- shadcn/ui (with Radix UI primitives)
- Tailwind CSS 4.x
- Lucide React (icons)

**Storage**: Supabase (PostgreSQL) with Drizzle ORM - already configured  
**Testing**: 
- Vitest 4.x for unit/component tests
- React Testing Library 16.x
- Playwright for E2E tests
- @vitest/coverage-v8 for coverage reports

**Target Platform**: Web (responsive: mobile 320px+, tablet 768px+, desktop 1024px+)  
**Project Type**: Web application (Next.js App Router structure)  
**Performance Goals**: 
- Dashboard load: <1s for authenticated users
- Auth redirect: <500ms for unauthenticated access
- Drawer animation: <300ms open/close
- Session detection: <2s after token expiration

**Constraints**: 
- Server-side auth already implemented in (dashboard) layout
- Must use existing Supabase client utilities
- Must not modify shadcn/ui components directly (use composition)
- Semantic HTML required (nav, aside, main)
- ≥65% test coverage mandatory

**Scale/Scope**: Single-user dashboard (foundation for future multi-list management)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality & Maintainability ✅

- **Single Responsibility**: Each component (DashboardSidebar, DashboardContent, page.tsx) has clear, focused purpose
- **DRY Compliance**: Reusing existing Supabase client utilities, shadcn/ui components, and layout patterns
- **Framework Integrity**: Will use shadcn Sheet component via composition (not direct modification)
- **Simplicity**: Straightforward responsive layout without unnecessary abstractions
- **Justification**: N/A - no complexity violations

### II. Testing Discipline & Safety Nets ✅

- **Coverage Target**: ≥65% test coverage (SC-005)
- **Test Types Planned**:
  - Unit tests: Authentication state helpers, responsive logic utilities
  - Component tests: DashboardSidebar, DashboardContent, mobile drawer interactions
  - Integration tests: Auth redirect flows, session expiration detection
  - E2E tests: Full dashboard access and navigation flows
- **Test-First Approach**: Tests will be written alongside implementation
- **Critical Paths Covered**: Auth protection, session monitoring, responsive layout, drawer interactions

### III. User Experience Consistency ✅

- **Navigation Pattern**: Consistent with existing app patterns (login/logout flows)
- **Visual Structure**: Using existing shadcn/ui components for consistency
- **Responsive Breakpoints**: Standard Tailwind breakpoints (lg:1024px)
- **Branding**: Consistent "📍 YourFavs" branding across sidebar and mobile drawer
- **Semantic HTML**: nav, aside, main elements for accessibility

### IV. Performance & Resource Efficiency ✅

**Baseline Targets (from spec Success Criteria)**:
- ✅ SC-001: Unauthenticated redirect <500ms
- ✅ SC-002: Dashboard load <1s for authenticated users
- ✅ SC-003: Drawer animation <300ms
- ✅ SC-006: Session expiration detection <2s

**Performance Strategy**:
- Client component only where needed (page.tsx for session monitoring)
- Server-side auth check already optimized in layout.tsx
- Minimal JavaScript bundle (only drawer state management)
- CSS animations for smooth drawer transitions

### V. Observability & Debuggability ✅

- **Session Monitoring**: Client-side useEffect clearly logs auth state changes
- **Error Handling**: Graceful fallback for Supabase unavailability
- **Developer Experience**: Clear component structure, semantic HTML for inspector
- **Production Logs**: Auth redirects will surface actionable messages

**GATE STATUS**: ✅ PASS - All constitution principles satisfied. No violations requiring justification.

---

### Post-Phase 1 Re-Check ✅

**Date**: 2025-12-06  
**Status**: Constitution compliance verified after Phase 1 design completion

**Design Validation**:
- ✅ Component architecture adheres to single responsibility (3 focused components)
- ✅ Data model (data-model.md) shows minimal state management (drawer state only)
- ✅ Component contracts (contracts/components.md) clearly define interfaces and behavior
- ✅ No new abstractions or complexity introduced beyond spec requirements
- ✅ Testing strategy in quickstart.md meets ≥65% coverage target
- ✅ All dependencies listed are existing or minimal additions (shadcn Sheet only)
- ✅ Semantic HTML requirements documented and enforced in contracts
- ✅ Performance targets mapped to measurable metrics in quickstart

**Changes from Initial Check**: None - design maintained constitution compliance throughout.

**Conclusion**: ✅ Ready to proceed to Phase 2 (Task Planning)

## Project Structure

### Documentation (this feature)

```text
specs/001-dashboard-foundation/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output - Design decisions & best practices
├── data-model.md        # Phase 1 output - Component architecture & state
├── quickstart.md        # Phase 1 output - Implementation guide
├── contracts/           # Phase 1 output - Component interfaces & props
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   └── (dashboard)/
│       ├── layout.tsx           # [EXISTS] Server-side auth protection
│       └── dashboard/
│           └── page.tsx         # [NEW] Client component with session monitoring
│
├── components/
│   ├── dashboard/               # [NEW] Dashboard-specific components
│   │   ├── DashboardSidebar.tsx # Navigation sidebar (desktop + mobile content)
│   │   └── DashboardContent.tsx # Main content area wrapper
│   │
│   └── ui/                      # [EXISTS] shadcn/ui components
│       ├── button.tsx           # [EXISTS]
│       ├── sheet.tsx            # [NEW] Install via: pnpm dlx shadcn@latest add sheet
│       └── ...
│
└── lib/
    └── supabase/
        ├── client.ts            # [EXISTS] Client-side Supabase utilities
        └── server.ts            # [EXISTS] Server-side Supabase utilities

tests/
├── component/
│   └── dashboard/               # [NEW] Component tests
│       ├── DashboardSidebar.test.tsx
│       ├── DashboardContent.test.tsx
│       └── page.test.tsx
│
├── integration/
│   └── dashboard/               # [NEW] Integration tests
│       ├── auth-protection.test.ts
│       ├── session-monitoring.test.ts
│       └── responsive-layout.test.ts
│
└── e2e/
    └── dashboard/               # [NEW] E2E tests
        └── dashboard-access.spec.ts
```

**Structure Decision**: 

This feature uses the existing Next.js App Router structure with minimal additions:

1. **App Router Integration**: New `/dashboard` route within existing `(dashboard)` route group
   - Leverages existing server-side auth in layout.tsx
   - Page component is client-side for session monitoring

2. **Component Organization**: New `components/dashboard/` directory for feature-specific components
   - Separates dashboard UI from generic shadcn/ui components
   - Follows single-responsibility principle (sidebar, content area)

3. **Testing Structure**: Mirrors source structure with component/integration/e2e separation
   - Component tests: Isolated component behavior and rendering
   - Integration tests: Auth flows and responsive behavior
   - E2E tests: Full user scenarios from spec

4. **Dependency Management**: 
   - Single new dependency: shadcn Sheet component (install via CLI)
   - Reuses existing Supabase, Tailwind, and React infrastructure

## Complexity Tracking

**No violations** - This section is not applicable.

All constitution principles are satisfied without requiring complexity justifications:
- No additional projects or architectural layers needed
- No abstractions beyond standard React component patterns
- Reusing existing authentication and styling infrastructure
- Straightforward responsive layout implementation
