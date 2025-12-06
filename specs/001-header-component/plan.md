# Implementation Plan: Landing Page Header Component

**Branch**: `001-header-component` | **Date**: 2025-12-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-header-component/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a reusable Header component for the YourFavs landing page that displays brand identity (MapPin icon + "YourFavs" text) and provides authentication entry points through "Log In" and "Start Curating" buttons. The component will be integrated into the existing LandingPageClient component and follow Next.js App Router patterns with client-side interactivity for button clicks. Implementation uses existing shadcn/ui Button components with ghost and default variants, lucide-react for icons, and follows the project's TypeScript and Tailwind CSS conventions.

## Technical Context

**Language/Version**: TypeScript 5.x with React 19.2.0 and Next.js 16.0.5 (App Router)  
**Primary Dependencies**:

- React 19.2.0 for component rendering
- Next.js 16.0.5 with App Router for routing and Link component
- lucide-react 0.555.0 for MapPin icon
- shadcn/ui Button component (already available in `src/components/ui/button.tsx`)
- Tailwind CSS 4.x for styling
- class-variance-authority for variant management (already used in Button)

**Storage**: N/A (presentational component only)  
**Testing**:

- Vitest 4.0.14 for unit and component tests
- @testing-library/react 16.3.0 for component testing
- @testing-library/jest-dom 6.9.1 for DOM assertions
- jsdom 27.2.0 as test environment

**Target Platform**: Web browsers (modern browsers supporting ES2020+)  
**Project Type**: Web application (Next.js App Router)  
**Performance Goals**:

- Initial render < 50ms (lightweight component)
- Interactive within 100ms of page load
- No layout shift during render

**Constraints**:

- Must be a Client Component (uses onClick handlers)
- Must work with Next.js Server Components parent (page.tsx)
- Must integrate into existing LandingPageClient component
- Must use existing Button component variants (no new variants needed)
- Must follow existing test patterns in tests/component/landing-page/

**Scale/Scope**:

- Single component (~100-150 lines)
- 3 test files (~300-400 lines total)
- Integration into 1 existing component (LandingPageClient)
- 0 new dependencies (all required packages already installed)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### I. Code Quality & Maintainability ✅ PASS

**Single Responsibility**: Header component has clear, single purpose - display brand identity and authentication buttons. No unnecessary abstraction.

**DRY Compliance**:

- Reuses existing Button component (src/components/ui/button.tsx) - no duplication
- Reuses existing Next.js Link component - no custom routing logic
- Reuses lucide-react MapPin icon - no custom icon implementation
- No logic duplication detected

**Justification**: All existing shared components and utilities are leveraged. No new abstractions needed.

### II. Testing Discipline & Safety Nets ✅ PASS

**Test Coverage Plan**:

- Component tests for rendering, visual elements, and accessibility (User Stories 1, 4)
- Interaction tests for button clicks and logo navigation (User Stories 2, 3)
- Integration tests for parent component integration
- Target: >85% coverage per success criteria SC-007 (65% minimum)

**Test-First Approach**: Tests will be written alongside implementation following existing patterns in tests/component/landing-page/

**Critical Paths**:

- Button click handlers triggering login/signup actions
- Logo link navigation to homepage
- Keyboard accessibility for all interactive elements

### III. User Experience Consistency ✅ PASS

**Terminology Consistency**:

- "Log In" and "Start Curating" match auth flow terminology
- "YourFavs" brand name consistent with existing usage

**Interaction Patterns**:

- Buttons use existing shadcn/ui Button component patterns
- Logo-as-home-link follows standard web conventions
- Keyboard navigation (Tab, Enter) follows standard accessibility patterns

**Visual Consistency**:

- Uses existing Button variants (ghost for subtle, default for prominent)
- Follows Tailwind CSS conventions already established in codebase
- Orange brand color for logo circle matches existing design system

### IV. Performance & Resource Efficiency ✅ PASS

**Performance Targets** (from Technical Context):

- Initial render < 50ms ✓ (lightweight component, no heavy computations)
- Interactive within 100ms ✓ (simple onClick handlers, no async operations)
- No layout shift ✓ (fixed header dimensions, no dynamic content loading)

**Resource Efficiency**:

- No new dependencies required
- Component size < 200 lines
- Minimal bundle impact (uses tree-shakeable lucide-react icons)

### V. Observability & Debuggability ✅ PASS

**Development Experience**:

- Clear prop types with TypeScript for type safety
- Accessible labels provide clear semantic meaning
- Simple component structure easy to debug in React DevTools

**Error Handling**:

- onClick handlers will be provided by parent component
- Type safety prevents incorrect prop usage
- Accessibility attributes ensure screen reader compatibility

**Status**: ✅ ALL GATES PASSED - Ready to proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/001-header-component/
├── plan.md              # This file (/speckit.plan command output)
├── spec.md              # Feature specification (already exists)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output - N/A for UI-only component
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output - Component API contract
│   └── header-component-api.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── shared/
│   │   ├── Header.tsx                    # NEW: Main Header component
│   │   └── LandingPageClient.tsx         # MODIFIED: Integrate Header
│   └── ui/
│       └── button.tsx                    # EXISTING: Reused for action buttons
├── app/
│   └── page.tsx                          # EXISTING: Landing page (no changes)
└── lib/
    └── utils/
        └── styling/
            └── cn.ts                     # EXISTING: Utility for className merging

tests/
├── component/
│   ├── landing-page/
│   │   ├── landing-page-auth.test.tsx              # EXISTING: May need updates
│   │   ├── landing-page-responsive.test.tsx        # EXISTING: May need updates
│   │   └── landing-page-accessibility.test.tsx     # EXISTING: May need updates
│   └── header/                                     # NEW: Header-specific tests
│       ├── header-rendering.test.tsx               # NEW: Visual elements (US1)
│       ├── header-navigation.test.tsx              # NEW: Logo click (US2)
│       ├── header-actions.test.tsx                 # NEW: Button clicks (US3)
│       └── header-accessibility.test.tsx           # NEW: Keyboard nav (US4)
└── integration/
    └── landing-page/
        └── navigation.test.tsx           # EXISTING: Integration tests
```

**Structure Decision**:

This feature follows the **Web application** structure already established in the TopTen/YourFavs codebase:

1. **Component Placement**:
   - New `Header.tsx` goes in `src/components/shared/` alongside `LandingPageClient.tsx` because it's a shared UI component used across the landing page
   - Follows existing pattern where shared components live in `shared/` and reusable UI primitives live in `ui/`

2. **Test Organization**:
   - New test directory `tests/component/header/` created to isolate Header component tests
   - Follows existing pattern of `tests/component/{feature}/` organization
   - Existing `tests/component/landing-page/` tests may need minimal updates to account for new Header structure

3. **Integration Points**:
   - `LandingPageClient.tsx` will import and render the new `Header` component
   - Header will receive `onLogin` and `onSignup` callbacks from parent
   - No changes to `app/page.tsx` (server component) - maintains existing server/client boundary

## Complexity Tracking

> **No complexity violations** - This section is intentionally left empty as all Constitution Check gates passed without requiring justification. The implementation follows established patterns, reuses existing components, and introduces no unnecessary abstractions.

---

## Post-Phase 1 Constitution Re-evaluation

_Re-checked after completing Phase 1 (Design & Contracts)_

### Changes Since Initial Check

Phase 1 deliverables completed:

- ✅ research.md - All technical decisions documented
- ✅ contracts/header-component-api.md - Component API contract defined
- ✅ quickstart.md - Implementation guide created
- ✅ Agent context updated - Copilot instructions file updated
- N/A data-model.md - Not applicable (UI component only)

### Constitution Compliance After Design

#### I. Code Quality & Maintainability ✅ STILL PASSING

**Design Review**:

- Component API contract clearly defines single responsibility
- Props interface is minimal (2 callbacks only)
- No hidden complexity introduced in design
- Reuses all existing components as planned

**DRY Verification**:

- Quickstart guide confirms no code duplication
- All shared components leveraged as planned
- No new abstractions created during design phase

**Verdict**: Design maintains simplicity and clarity. No violations introduced.

#### II. Testing Discipline & Safety Nets ✅ STILL PASSING

**Test Strategy Validation**:

- 4 test files designed covering all user stories
- Each test file maps to specific acceptance criteria
- Test examples in quickstart demonstrate proper coverage
- Integration tests account for parent component changes

**Coverage Projection**:

- Rendering tests: ~25% (visual elements, structure)
- Navigation tests: ~20% (logo link behavior)
- Action tests: ~30% (button click handlers)
- Accessibility tests: ~25% (keyboard, ARIA, focus)
- **Total: ~100% of user-facing behavior** (exceeds 65% minimum)

**Verdict**: Test strategy is comprehensive and follows existing patterns. No gaps identified.

#### III. User Experience Consistency ✅ STILL PASSING

**Design Consistency Validation**:

- Component API contract documents standard interaction patterns
- Button variants chosen match existing UI patterns
- Logo-as-home-link follows universal web conventions
- Terminology verified against existing auth flow

**Breaking Changes**: None - this is a new component with no backward compatibility concerns

**Verdict**: Design maintains consistency with existing UX patterns. No violations.

#### IV. Performance & Resource Efficiency ✅ STILL PASSING

**Performance Analysis**:

- Component API contract documents performance characteristics
- Rendering: < 16ms (single frame)
- Bundle size: ~2KB (minimal impact)
- No async operations or heavy computations

**Resource Verification**:

- 0 new dependencies confirmed (all packages already installed)
- Component size estimate: ~150 lines (within 200 line target)
- Tree-shakeable icon import (only MapPin included)

**Verdict**: Design meets all performance targets. No efficiency concerns.

#### V. Observability & Debuggability ✅ STILL PASSING

**Debug Support**:

- TypeScript provides full type safety
- Component API contract documents all behavior guarantees
- Error handling strategy documented (errors propagate to parent)
- Clear separation of concerns (parent handles auth logic)

**Developer Experience**:

- Quickstart guide provides step-by-step implementation
- Test examples demonstrate proper mocking strategy
- Common issues section helps troubleshooting

**Verdict**: Design supports effective debugging and maintenance. No observability gaps.

---

### Final Constitution Status: ✅ ALL GATES PASSED

**Summary**: Phase 1 design phase has been completed without introducing any Constitution violations. The implementation plan, component contract, and testing strategy all align with TopTen's core principles. The feature is ready to proceed to Phase 2 (Task Breakdown).

**Key Achievements**:

- Clear component API with minimal surface area
- Comprehensive test coverage strategy (>85% projected)
- No new dependencies or unnecessary abstractions
- Performance targets clearly defined and achievable
- Strong developer documentation (research, contracts, quickstart)

**Risk Assessment**: LOW - This is a straightforward UI component with well-defined scope and no complex dependencies or integrations.
