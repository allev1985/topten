# Implementation Plan: Landing Page Polish & Accessibility

**Branch**: `001-landing-page-polish` | **Date**: 2025-12-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-landing-page-polish/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Polish the responsive design of the landing page across all breakpoints (mobile, tablet, desktop), enhance accessibility for keyboard navigation and assistive technologies, and implement comprehensive E2E test coverage for all critical user flows (signup, login, error handling). This feature makes **minimal surgical changes** to existing components while ensuring they meet modern accessibility and performance standards.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 16.0.5 (App Router)  
**Primary Dependencies**: 
- React 19.2.0 (client components)
- Tailwind CSS 4 (styling with @tailwindcss/postcss)
- shadcn/ui (Dialog, Button components from @radix-ui)
- Playwright 1.57.0 (E2E testing)
- Vitest 4.0.14 (unit testing)

**Storage**: N/A (frontend-only changes)  
**Testing**: 
- E2E: Playwright with existing tests in `tests/e2e/`
- Unit: Vitest + React Testing Library (if needed)
- Accessibility: Automated checks via Playwright

**Target Platform**: Modern browsers (last 2 versions Chrome, Firefox, Safari, Edge)
**Project Type**: Web application (Next.js)

**Performance Goals**:
- Largest Contentful Paint (LCP) ≤ 2.5s
- Cumulative Layout Shift (CLS) ≤ 0.1
- First Input Delay (FID) < 100ms
- Time to Interactive (TTI) ≤ 3.5s

**Constraints**:
- No horizontal scroll on viewports 375px-1440px
- Minimum touch target: 44×44px
- Focus indicators visible (≥2px outline)
- Modal scroll on small screens without breaking layout
- Maintain existing auth flow integration

**Scale/Scope**: 
- 5 React components to polish (surgical changes only)
- 7-10 new E2E test scenarios
- 3 breakpoints (mobile 375px, tablet 768px, desktop 1440px)
- ~60% test coverage target for landing page flows

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Initial Check (Before Phase 0)

#### I. Code Quality & Maintainability ✅
- **Status**: PASS
- **Justification**: Changes will be minimal and surgical to existing components. No framework code (shadcn/ui components) will be modified directly - only composition and Tailwind classes. All changes will maintain single responsibility and readability.
- **DRY Compliance**: Existing components already follow DRY. Will reuse Button, Dialog components from shadcn/ui without duplication.
- **Framework Code Integrity**: Will NOT modify `components/ui/*` (shadcn/ui generated code). Changes only to `components/shared/*` using composition.

#### II. Testing Discipline & Safety Nets ✅
- **Status**: PASS
- **Justification**: This feature is **test-focused**. All changes will be accompanied by E2E tests. Existing tests in `tests/e2e/landing-page.spec.ts` and `tests/e2e/login-modal.spec.ts` will be extended, not replaced.
- **Coverage Target**: 60% of critical landing page flows (signup, login, errors, responsive, keyboard nav)

#### III. User Experience Consistency ✅
- **Status**: PASS
- **Justification**: Changes enhance UX without breaking existing patterns. Button text and interaction patterns remain unchanged. Focus indicators and keyboard nav will be consistent with accessibility standards.

#### IV. Performance & Resource Efficiency ✅
- **Status**: PASS
- **Justification**: Performance targets are explicitly defined (LCP ≤2.5s, CLS ≤0.1, FID <100ms). Changes optimize image loading (lazy load), prevent layout shift (explicit dimensions), and improve responsiveness.
- **Measurement**: E2E tests will include performance assertions for load time and visual stability.

#### V. Observability & Debuggability ✅
- **Status**: PASS
- **Justification**: E2E tests will capture console errors/warnings. Form validation errors already surface actionable messages. No logging changes needed as this is frontend polish.

**Initial Gate**: ✅ **PASS** - Proceeded to Phase 0 Research

---

### Post-Design Check (After Phase 1)

#### I. Code Quality & Maintainability ✅
- **Status**: PASS
- **Validation**: 
  - Research confirmed existing patterns (Tailwind, Radix UI) support surgical changes
  - No new abstractions introduced
  - All changes use existing utility classes and component composition
  - Framework code integrity maintained (shadcn/ui components untouched)
- **Change Impact**: Minimal - only className additions and ARIA attribute verification

#### II. Testing Discipline & Safety Nets ✅
- **Status**: PASS
- **Validation**:
  - New test file: `tests/e2e/signup-modal.spec.ts`
  - Extended tests in: `landing-page.spec.ts`, `login-modal.spec.ts`
  - Test coverage includes: responsive (3 viewports), keyboard nav, accessibility, performance
  - Manual testing checklist documented in quickstart.md
- **Testing Strategy**: Playwright E2E tests with Performance API assertions

#### III. User Experience Consistency ✅
- **Status**: PASS
- **Validation**:
  - WAI-ARIA Dialog pattern already implemented by Radix UI (no breaking changes)
  - Focus indicators follow WCAG 2.2 standards (consistent 2px ring)
  - Keyboard interactions match industry standards (Tab, Enter, Space, Escape)
  - No changes to button text, navigation flow, or visual hierarchy
- **UX Impact**: Enhanced (better accessibility, clearer focus states, responsive improvements)

#### IV. Performance & Resource Efficiency ✅
- **Status**: PASS
- **Validation**:
  - Performance targets confirmed in research (LCP, CLS, FID via Performance API)
  - Existing image loading strategy is optimal (priority for above-fold, lazy for below-fold)
  - No performance-impacting changes (only CSS utility classes)
  - E2E tests include performance regression checks
- **Performance Impact**: Neutral to positive (better responsive layout may improve LCP)

#### V. Observability & Debuggability ✅
- **Status**: PASS
- **Validation**:
  - E2E tests include console error/warning checks
  - Playwright Test UI provides step-by-step debugging
  - Lighthouse integration available for manual audits
  - Test failures will surface actionable viewport/accessibility issues
- **Observability**: Sufficient for feature scope (no backend changes)

**Post-Design Gate**: ✅ **PASS** - Design aligns with all Constitution principles

---

### Quality & Delivery Standards Compliance

✅ **Testing Strategy**: Documented in quickstart.md with specific test scenarios  
✅ **Performance Goals**: Defined in Technical Context and validated in research.md  
✅ **UX Changes**: Deliberate enhancements (accessibility, responsiveness) - no breaking changes  
✅ **Traceability**: All tasks map to user stories in spec.md (FR-001 through FR-045)

---

### Summary

**Both Pre and Post-Design Gates: ✅ PASS**

This feature fully complies with the TopTen Constitution:
- Code changes are minimal and surgical
- Testing is comprehensive (60% coverage target)
- UX consistency maintained with accessibility enhancements
- Performance targets are measurable and testable
- Observability adequate for frontend-only changes

**No complexity justifications required** - All changes use existing patterns and tools.

**Ready for Phase 2**: Task breakdown can proceed with `/speckit.tasks` command.

## Project Structure

### Documentation (this feature)

```text
specs/001-landing-page-polish/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (responsive design patterns, accessibility standards)
├── data-model.md        # Phase 1 output (N/A - no data model changes)
├── quickstart.md        # Phase 1 output (developer guide for running/testing changes)
├── contracts/           # Phase 1 output (N/A - no API contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── shared/           # Components to modify (surgical changes only)
│   │   ├── LandingPageClient.tsx   # Add responsive utility classes
│   │   ├── Header.tsx              # Ensure 44×44px touch targets
│   │   ├── HeroImageGrid.tsx       # No changes expected
│   │   ├── LoginModal.tsx          # Verify keyboard navigation
│   │   └── SignupModal.tsx         # Verify keyboard navigation  
│   └── ui/               # shadcn/ui components (DO NOT MODIFY)
│       ├── button.tsx    # Generated by shadcn - composition only
│       └── dialog.tsx    # Generated by shadcn - composition only
│
├── app/
│   ├── globals.css       # Potential focus indicator styles
│   └── page.tsx          # Landing page route (uses LandingPageClient)
│
└── types/
    └── components.ts     # Existing types (no changes needed)

tests/
├── e2e/                  # Playwright E2E tests
│   ├── landing-page.spec.ts         # Extend with new responsive/a11y tests
│   ├── login-modal.spec.ts          # Extend with error scenarios
│   └── signup-modal.spec.ts         # NEW: Complete signup flow tests
│
└── (unit tests if needed - not expected for this feature)

playwright.config.ts      # Existing config (may add viewport presets)
```

**Structure Decision**: Standard Next.js App Router web application. All changes are confined to existing component files (`src/components/shared/*`) and E2E tests (`tests/e2e/*`). No new files except one new test file (`signup-modal.spec.ts`) and documentation artifacts in `specs/001-landing-page-polish/`.

## Complexity Tracking

**No violations** - This feature aligns with all Constitution principles and introduces no complexity that requires justification.

---

## Implementation Plan Status

### ✅ Phase 0: Outline & Research - COMPLETE
**Artifacts Created**:
- `research.md` - Comprehensive research on responsive design, accessibility standards, performance measurement, and testing approaches
- All unknowns from Technical Context resolved
- Technology decisions documented and ratified

**Key Decisions**:
- Tailwind default breakpoints (mobile-first approach)
- 44×44px minimum touch targets (WCAG 2.1)
- Radix UI Dialog pattern (WAI-ARIA compliant)
- Performance API measurement in Playwright
- Focus indicators via Tailwind `focus-visible` utilities

---

### ✅ Phase 1: Design & Contracts - COMPLETE
**Artifacts Created**:
- `data-model.md` - Documented no data model changes (frontend-only)
- `contracts/README.md` - Documented no API contracts (UI polish only)
- `quickstart.md` - Developer guide with setup, testing, and validation checklists
- Updated `.github/agents/copilot-instructions.md` via `update-agent-context.sh`

**Key Outputs**:
- Component change strategy (surgical, minimal)
- E2E test structure defined
- Manual and automated testing approaches documented
- Performance validation approach specified
- Constitution re-check completed (all gates PASS)

---

### ⏸️ Phase 2: Task Breakdown - NOT STARTED
**Next Command**: `/speckit.tasks`

This command will generate `tasks.md` with:
- Detailed task breakdown (component changes, test additions)
- Dependencies between tasks
- Estimated effort for each task
- Assignment to development phases
- Traceability to functional requirements (FR-001 through FR-045)

**Do NOT proceed with implementation** until Phase 2 tasks are generated and reviewed.

---

## Deliverables Summary

### Documentation Generated
✅ `specs/001-landing-page-polish/plan.md` (this file)
✅ `specs/001-landing-page-polish/research.md`
✅ `specs/001-landing-page-polish/data-model.md`
✅ `specs/001-landing-page-polish/quickstart.md`
✅ `specs/001-landing-page-polish/contracts/README.md`
⏸️ `specs/001-landing-page-polish/tasks.md` (awaiting `/speckit.tasks`)

### Agent Context Updated
✅ `.github/agents/copilot-instructions.md` - Added TypeScript/Next.js context

### Branch
✅ `001-landing-page-polish` (confirmed in setup)

---

## Key Takeaways for Implementation

### What to Change (Minimal Surgical Changes Only)
1. **LandingPageClient.tsx** - Add responsive utility classes for spacing
2. **Header.tsx** - Ensure button sizes meet 44×44px touch targets
3. **LoginModal.tsx & SignupModal.tsx** - Verify keyboard nav and max-height
4. **globals.css** - Add focus indicator styles if needed
5. **E2E Tests** - Add comprehensive test coverage

### What NOT to Change
❌ `components/ui/*` (shadcn/ui generated code)
❌ Component logic or state management
❌ Authentication flow or API calls
❌ Image sources or content

### Success Criteria
- ✅ No horizontal scroll on 375px-1440px viewports
- ✅ All buttons ≥ 44×44px touch targets
- ✅ Focus indicators visible (≥2px outline)
- ✅ Keyboard navigation works (Tab, Enter, Escape)
- ✅ LCP ≤ 2.5s, CLS ≤ 0.1, FID < 100ms
- ✅ E2E test coverage ≥ 60% of landing page flows
- ✅ Lighthouse Accessibility score ≥ 95

---

## Phase 2 Readiness Checklist

Before running `/speckit.tasks`, verify:
- [x] Phase 0 research completed
- [x] Phase 1 design completed
- [x] Constitution check passed (pre and post)
- [x] All artifacts generated
- [x] Agent context updated
- [x] Branch confirmed (`001-landing-page-polish`)
- [x] No blocking questions or unknowns

**Status**: ✅ **READY FOR PHASE 2**

---

## Command History

```bash
# Phase 0 & 1 (this session)
.specify/scripts/bash/setup-plan.sh --json
# → Generated plan.md template
# → Created research.md (Phase 0)
# → Created data-model.md (Phase 1)
# → Created quickstart.md (Phase 1)
# → Created contracts/README.md (Phase 1)

.specify/scripts/bash/update-agent-context.sh copilot
# → Updated .github/agents/copilot-instructions.md

# Next step (Phase 2)
/speckit.tasks
# → Will generate tasks.md with detailed task breakdown
```

---

**Plan Status**: ✅ **COMPLETE** - Phases 0 and 1 finished successfully  
**Next Action**: Run `/speckit.tasks` command to begin Phase 2 task breakdown
