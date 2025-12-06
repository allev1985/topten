# Implementation Plan: Fix Duplicate Headers in Auth Modals

**Branch**: `003-fix-modal-headers` | **Date**: 2025-12-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-fix-modal-headers/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Fix duplicate header issue in login and signup modals by adding a `variant` prop to LoginForm and SignupForm components. When `variant="inline"` is passed (from modal contexts), the Card wrapper with headers will be excluded, eliminating the visual duplication between DialogHeader and CardHeader. The default `variant="card"` preserves the standalone page behavior.

## Technical Context

**Language/Version**: TypeScript (Next.js 15 with App Router)  
**Primary Dependencies**: React 19, Next.js 15, Tailwind CSS, shadcn/ui  
**Storage**: N/A (UI-only change)  
**Testing**: Vitest + React Testing Library for component tests, Playwright for E2E  
**Target Platform**: Web (client-side React components)  
**Project Type**: Web application  
**Performance Goals**: No performance impact (UI restructuring only)  
**Constraints**: 
- Must not modify shadcn/ui components directly (constitution principle)
- Must preserve all existing accessibility features (ARIA labels, keyboard navigation)
- Must maintain backward compatibility with standalone page usage
- Zero breaking changes to existing API
**Scale/Scope**: 2 components modified (LoginForm, SignupForm), 2 components updated (LoginModal, SignupModal)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality & Maintainability ✅ PASS

- **Single Responsibility**: Each component maintains its single responsibility (LoginForm renders login UI, SignupForm renders signup UI). The variant prop simply controls presentation layer without adding business logic.
- **DRY Principle**: No code duplication introduced. The conditional rendering pattern using variant props is a standard React pattern already used in the codebase.
- **Framework Code Integrity**: ✅ **CRITICAL PASS** - No modification to shadcn/ui components. Only modifying our own components (LoginForm, SignupForm) that use shadcn/ui primitives (Card, Dialog). Uses composition pattern (conditional wrapper) rather than direct modification.
- **Simplicity**: The change is minimal - adding a single optional prop with conditional rendering logic. No new abstractions or complex patterns introduced.
- **Documentation**: Code will include inline comments explaining the variant prop behavior.

### II. Testing Discipline & Safety Nets ✅ PASS

- **Test Coverage Required**:
  - Unit tests for LoginForm with variant="card" (default behavior)
  - Unit tests for LoginForm with variant="inline" (modal behavior)
  - Unit tests for SignupForm with variant="card" (default behavior)
  - Unit tests for SignupForm with variant="inline" (modal behavior)
  - E2E tests for modal flows (login modal, signup modal)
  - E2E tests for standalone pages (/login, /signup)
- **Critical Paths**: All existing authentication flows remain covered by existing tests. New tests verify variant behavior doesn't break functionality.
- **Regression Prevention**: Existing tests will catch any breaking changes. New tests ensure variant prop works correctly.

### III. User Experience Consistency ✅ PASS

- **Terminology**: No user-facing terminology changes.
- **Interaction Patterns**: User interactions remain identical in both contexts (modal and standalone).
- **Visual Consistency**: Improves visual consistency by removing duplicate headers in modals while preserving standalone page appearance.
- **Backward Compatibility**: ✅ Default variant="card" ensures zero breaking changes for existing usage.

### IV. Performance & Resource Efficiency ✅ PASS

- **Performance Impact**: Negligible. Change only affects conditional rendering logic, no additional network requests or computations.
- **Benchmarks**: Not required - this is a pure UI refactoring with no performance implications.
- **Metrics**: No measurable performance impact expected.

### V. Observability & Debuggability ✅ PASS

- **Error Messages**: No changes to error handling or messaging.
- **Logging**: No logging changes required.
- **Debugging**: Component props are visible in React DevTools, making variant behavior easy to debug.

### Quality & Delivery Standards ✅ PASS

- **Testing Strategy**: Comprehensive unit and E2E test plan defined above.
- **Performance Goals**: No specific goals needed (no performance impact).
- **UX Changes**: Deliberate and documented - removing duplicate headers in modals while preserving standalone page behavior.
- **Documentation**: Will update component JSDoc comments to document variant prop.

### Delivery Workflow & Review Gates ✅ PASS

- **Code Review**: Changes will be minimal and easy to review.
- **Tests**: All existing tests must pass, new tests for variant behavior required.
- **Documentation**: JSDoc comments and inline documentation will be updated.
- **Decision Records**: Not required - this is a straightforward UI fix following standard React patterns.

**GATE DECISION**: ✅ **PROCEED TO PHASE 0**

All constitution principles are satisfied. No violations requiring justification.

---

### Phase 1 Re-evaluation (Post-Design)

After completing research, data model, and contract design, re-checking constitution compliance:

#### I. Code Quality & Maintainability ✅ PASS
- Design maintains single responsibility principle
- No code duplication in implementation approach
- Framework code integrity preserved (no shadcn/ui modifications)
- Solution is simple and well-documented

#### II. Testing Discipline & Safety Nets ✅ PASS
- Comprehensive test plan defined in quickstart.md
- Unit tests for both variants of both components
- E2E tests for modal and standalone contexts
- All accessibility features tested

#### III. User Experience Consistency ✅ PASS
- Improves UX by removing confusing duplicate headers
- Maintains consistency between modal and standalone contexts
- No breaking changes to user-facing behavior

#### IV. Performance & Resource Efficiency ✅ PASS
- No performance impact from design decisions
- Simple conditional rendering has negligible overhead

#### V. Observability & Debuggability ✅ PASS
- Component props visible in React DevTools
- Clear error messages preserved
- No logging changes required

**FINAL GATE DECISION**: ✅ **PROCEED TO PHASE 2 (Tasks)**

Design satisfies all constitutional requirements. Ready for task breakdown.

## Project Structure

### Documentation (this feature)

```text
specs/003-fix-modal-headers/
├── spec.md              # Feature specification
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (minimal - pattern already established)
├── data-model.md        # Phase 1 output (component interfaces)
├── quickstart.md        # Phase 1 output (implementation guide)
└── contracts/           # Phase 1 output (TypeScript interfaces)
    └── component-props.ts
```

### Source Code (repository root)

```text
src/
├── app/
│   └── (auth)/
│       └── login/
│           └── login-form.tsx       # MODIFIED: Add variant prop
├── components/
│   ├── auth/
│   │   └── signup-form.tsx          # MODIFIED: Add variant prop
│   └── shared/
│       ├── LoginModal.tsx           # MODIFIED: Pass variant="inline"
│       └── SignupModal.tsx          # MODIFIED: Pass variant="inline"
└── types/
    └── components.ts                # REVIEWED: Ensure prop types are exported

tests/
├── components/
│   ├── login-form.test.tsx          # NEW: Unit tests for variant behavior
│   └── signup-form.test.tsx         # NEW: Unit tests for variant behavior
└── e2e/
    └── auth-modals.spec.ts          # UPDATED: Verify no duplicate headers
```

**Structure Decision**: Using Next.js App Router structure with components split between app directory (route-specific) and components directory (shared). LoginForm is in app directory because it's tightly coupled to the /login route, while SignupForm is in shared components as it's used in multiple contexts. Modals are in shared components as they're used throughout the application.

## Complexity Tracking

**No violations requiring justification.**

This implementation follows standard React component patterns and adheres to all constitution principles without exceptions.

---

## Phase Completion Summary

### ✅ Phase 0: Research (Complete)

**Deliverables**:
- ✅ `research.md` - Documented conditional rendering patterns, props API design, content extraction strategy, accessibility preservation, and styling approach
- ✅ All technical unknowns resolved
- ✅ Best practices identified and documented
- ✅ Risk assessment completed

**Key Decisions**:
- Use inline conditional rendering with optional wrapper pattern
- Variant prop design: `"card" | "inline"` with default `"card"`
- Extract form and footer content into variables for DRY compliance
- Preserve all ARIA attributes in extracted content

### ✅ Phase 1: Design & Contracts (Complete)

**Deliverables**:
- ✅ `data-model.md` - Complete component interface definitions with state transitions
- ✅ `contracts/component-props.ts` - TypeScript interface contracts
- ✅ `quickstart.md` - Step-by-step implementation guide with timeline
- ✅ Agent context updated via `update-agent-context.sh copilot`

**Key Artifacts**:
- LoginFormProps and SignupFormProps interfaces with variant support
- Detailed component structure documentation
- Validation rules and accessibility attributes documented
- Comprehensive testing strategy defined

### ⏸️ Phase 2: Tasks (Pending)

**Next Step**: Run `/speckit.tasks` command to generate task breakdown for implementation.

This command will create `tasks.md` with detailed task assignments based on the design artifacts.

---

## Implementation Ready Status

All planning phases complete. The feature is ready for:

1. **Task Generation**: Generate tasks.md using `/speckit.tasks`
2. **Implementation**: Follow quickstart.md for step-by-step guidance
3. **Testing**: Execute comprehensive test plan defined in quickstart.md
4. **Review**: Submit PR with changes for code review

**Estimated Implementation Time**: 3 hours (see quickstart.md for breakdown)

**Risk Level**: Low - straightforward UI refactoring with well-defined pattern

---

## Artifacts Index

| Document | Purpose | Status |
|----------|---------|--------|
| `spec.md` | Feature requirements and user stories | ✅ Complete |
| `plan.md` | This file - technical planning and architecture | ✅ Complete |
| `research.md` | Technical research and decisions | ✅ Complete |
| `data-model.md` | Component interfaces and contracts | ✅ Complete |
| `contracts/component-props.ts` | TypeScript type definitions | ✅ Complete |
| `quickstart.md` | Implementation guide | ✅ Complete |
| `tasks.md` | Task breakdown for implementation | ⏸️ Pending `/speckit.tasks` |

---

**Plan Status**: ✅ **COMPLETE** - Ready for Phase 2 (Task Generation)  
**Last Updated**: 2025-12-06  
**Branch**: `003-fix-modal-headers`
