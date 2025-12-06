# Implementation Plan: Front Page Hero Section Integration & CTA Wiring

**Branch**: `001-hero-section` | **Date**: 2025-12-06 | **Spec**: [/specs/001-hero-section/spec.md](/specs/001-hero-section/spec.md)
**Input**: Feature specification from `/specs/001-hero-section/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature enhances the landing page with a compelling hero section that communicates the product's value proposition and provides clear call-to-action buttons for user conversion. The implementation involves restructuring the LandingPageClient component to display hero text content (tagline, headline, subheading, and CTA button) in a responsive two-column layout alongside the existing HeroImageGrid component. The hero section will use a 2:3 column ratio on desktop (40% text, 60% images) and stack vertically on mobile. Modal state management is already implemented and functional; this feature focuses on layout implementation and CTA wiring to existing modals.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 16 (App Router), React 19  
**Primary Dependencies**: 
- Next.js 16.0.5 (App Router with React Server Components)
- React 19.2.0 (Client components for interactivity)
- Tailwind CSS 4.x (Utility-first styling)
- shadcn/ui components (Dialog, Button primitives)
- Lucide React (Icons - Sparkles for tagline decoration)

**Storage**: N/A (client-side layout and state management only)  
**Testing**: 
- Vitest 4.0.14 (Unit and component tests)
- React Testing Library 16.3.0 (Component testing)
- Playwright 1.57.0 (End-to-end tests)

**Target Platform**: Web browsers (responsive design: mobile 320px - desktop 1920px+)  
**Project Type**: Web application (Next.js frontend)  

**Performance Goals**: 
- First Contentful Paint < 1.5s
- Largest Contentful Paint < 2.5s
- No layout shift (CLS = 0)
- Immediate modal response to click (<100ms perceived delay)

**Constraints**: 
- Server-side rendering for SEO optimization
- Client-side interactivity for modal state management
- Responsive layout must work 320px-1920px+ without horizontal scroll
- Desktop breakpoint at 1024px (lg: in Tailwind)
- Accessibility: keyboard navigation, ARIA labels, screen reader support

**Scale/Scope**: 
- Single page component modification (LandingPageClient.tsx)
- 2-3 new component tests
- 1-2 E2E test scenarios
- No database or API changes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality & Maintainability ✅ PASS
- **Single Responsibility**: LandingPageClient component will remain focused on orchestrating landing page layout and modal state. Hero text content will be a distinct section within the component.
- **DRY Compliance**: 
  - Modal state management already exists and will be reused (no duplication)
  - Existing Header, HeroImageGrid, LoginModal, SignupModal components will be reused
  - No new duplicated logic required
- **Framework Code Integrity**: 
  - shadcn/ui Dialog components in `components/ui/dialog.tsx` will NOT be modified
  - Customization will use composition (wrapping in LoginModal/SignupModal)
  - All framework-generated code preserved
- **Maintainability**: Layout uses standard Tailwind grid utilities with clear breakpoints; no complex abstractions required

### II. Testing Discipline & Safety Nets ✅ PASS
- **Test Coverage Plan**:
  - Component tests: Hero section rendering, responsive layout, CTA button interactions
  - Integration tests: Modal opening from hero CTA, modal state isolation
  - E2E tests: Complete user flows (view hero → click CTA → modal opens → close modal)
- **Test-First Approach**: Tests will be written alongside implementation for each acceptance scenario
- **Critical Paths Covered**: 
  - User Story 1 (P1): Hero section display and responsive layout
  - User Story 2 (P2): CTA button → signup modal flow
  - User Story 3 (P3): Login button → login modal flow

### III. User Experience Consistency ✅ PASS
- **Terminology Consistency**: 
  - "Create Your First List" CTA matches product language (lists, curating)
  - "Start Curating" header button already exists with consistent messaging
  - "Log In" button maintains standard auth terminology
- **Interaction Patterns**: 
  - Button → Modal pattern already established in Header component
  - Modal close behavior consistent with existing modals
  - No breaking changes to existing UX patterns
- **Visual Consistency**: 
  - Uses existing Button component from shadcn/ui
  - Maintains existing color scheme (black/white, zinc neutrals)
  - Responsive patterns match existing mobile-first approach

### IV. Performance & Resource Efficiency ✅ PASS
- **Performance Targets Defined**: 
  - FCP < 1.5s, LCP < 2.5s, CLS = 0 (documented above)
  - Modal interaction < 100ms perceived delay
- **Baseline Established**: Current LandingPageClient renders HeroImageGrid server-side; new hero text will also be server-rendered (no JS required for initial display)
- **No Performance Regression**: 
  - Server-side rendering preserved
  - Client-side state only for modal visibility (already implemented)
  - No additional API calls or data fetching
  - Image loading already optimized via Next.js Image component

### V. Observability & Debuggability ✅ PASS
- **Development Observability**: 
  - React DevTools for component state inspection
  - Browser DevTools for layout debugging
  - Vitest UI for test execution visualization
- **Error Handling**: 
  - Modal state management already handles edge cases (rapid clicks prevented by React state updates)
  - No new error scenarios introduced (pure layout change)
- **User Feedback**: 
  - Modal visibility provides clear feedback for user actions
  - No silent failures possible (buttons either open modals or don't)

### Quality & Delivery Standards ✅ PASS
- **Feature Plan Documentation**: This plan documents testing strategy (Phase 1), performance goals (Technical Context), and UX changes (spec acceptance scenarios)
- **Testable Acceptance Criteria**: All user stories in spec have clear Given/When/Then scenarios
- **Traceability**: Each task (Phase 2) will reference user stories and principles

### Delivery Workflow & Review Gates ✅ PASS
- **Pre-merge Requirements**:
  - All tests must pass (component, integration, E2E)
  - Code review against Core Principles
  - No documentation updates required (implementation only, no API/behavior contracts change)
- **Risk Assessment**: LOW RISK
  - No schema changes
  - No public API changes
  - No major UX shifts (enhancement to existing landing page)
  - No decision record required per constitution

## Project Structure

### Documentation (this feature)

```text
specs/001-hero-section/
├── spec.md              # Feature specification (already exists)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (N/A - no research needed)
├── data-model.md        # Phase 1 output (N/A - no data model changes)
├── quickstart.md        # Phase 1 output - Developer implementation guide
├── contracts/           # Phase 1 output (N/A - no API contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── shared/
│   │   ├── LandingPageClient.tsx      # [MODIFY] Add hero section layout
│   │   ├── Header.tsx                 # [EXISTING] Already has CTA buttons
│   │   ├── HeroImageGrid.tsx          # [EXISTING] Reuse in new layout
│   │   ├── LoginModal.tsx             # [EXISTING] Reuse for login flow
│   │   └── SignupModal.tsx            # [EXISTING] Reuse for signup flow
│   └── ui/
│       ├── button.tsx                 # [EXISTING] shadcn/ui - DO NOT MODIFY
│       └── dialog.tsx                 # [EXISTING] shadcn/ui - DO NOT MODIFY
├── app/
│   └── page.tsx                       # [EXISTING] Renders LandingPageClient
└── types/
    └── components.ts                  # [EXISTING] May need type updates if any

tests/
├── component/
│   └── landing-page/
│       ├── landing-page-client.test.tsx         # [MODIFY] Add hero section tests
│       ├── landing-page-responsive.test.tsx     # [MODIFY] Add layout breakpoint tests
│       ├── landing-page-accessibility.test.tsx  # [MODIFY] Add hero a11y tests
│       └── hero-image-grid.test.tsx             # [EXISTING] Keep as-is
├── integration/
│   └── landing-page/
│       └── navigation.test.tsx                  # [MODIFY] Add hero CTA → modal tests
└── e2e/
    └── landing-page.spec.ts                     # [MODIFY] Add hero section E2E scenarios
```

**Structure Decision**: This is a web application using Next.js App Router. The feature modifies a single client component (`LandingPageClient.tsx`) to restructure its layout, adding hero text content alongside the existing HeroImageGrid. All modal components and state management already exist and will be reused. Testing follows the existing pattern: component tests for rendering/layout, integration tests for component interactions, and E2E tests for complete user flows.

## Complexity Tracking

**No violations identified.** All Constitution Check gates passed without requiring complexity justification.

This feature is a straightforward layout enhancement that:
- Reuses all existing components (Header, HeroImageGrid, modals)
- Uses standard Tailwind CSS grid utilities
- Requires no new abstractions or patterns
- Maintains the existing modal state management approach
- Follows established testing patterns

---

## Phase 0: Research & Discovery

**Status**: ✅ SKIPPED - No research required

**Rationale**: This feature uses existing, well-understood technologies and patterns:
- Tailwind CSS grid layout is standard and well-documented
- Modal state management already implemented
- Responsive breakpoints follow established Next.js/Tailwind patterns
- No new libraries, frameworks, or architectural decisions required

All technical questions resolved by examining existing codebase:
- Layout approach: Tailwind CSS grid utilities (confirmed in HeroImageGrid)
- State management: React useState hooks (confirmed in LandingPageClient)
- Modal integration: Existing Header callbacks pattern (confirmed in Header.tsx)
- Testing patterns: Vitest + RTL + Playwright (confirmed in tests/ directory)

**Deliverables**: N/A

---

## Phase 1: Design & Architecture

### Component Architecture

**LandingPageClient Component Structure**:
```tsx
LandingPageClient (Client Component)
├── Header (props: onLogin, onSignup)
├── LoginModal (props: isOpen, onClose, redirectTo)
├── SignupModal (props: isOpen, onClose)
└── main
    └── Hero Section Container (max-width constrained, centered)
        ├── Grid Container (2 cols mobile, 5 cols desktop)
        │   ├── Hero Text Column (col-span-full mobile, col-span-2 desktop)
        │   │   ├── Tagline (with Sparkles icon)
        │   │   ├── Headline (h1)
        │   │   ├── Subheading (muted text)
        │   │   └── CTA Button → openSignupModal()
        │   └── Hero Image Column (col-span-full mobile, col-span-3 desktop)
        │       └── HeroImageGrid
```

### Layout Specifications

**Desktop Layout (≥1024px)**:
```
┌─────────────────────────────────────────────────────┐
│  [40% Text Column]    │  [60% Image Grid Column]    │
│  ┌─────────────────┐  │  ┌─────────────────────┐   │
│  │ ✨ Tagline      │  │  │                     │   │
│  │                 │  │  │   HeroImageGrid     │   │
│  │ Headline        │  │  │                     │   │
│  │                 │  │  │   (4 images)        │   │
│  │ Subheading      │  │  │                     │   │
│  │                 │  │  └─────────────────────┘   │
│  │ [CTA Button]    │  │                            │
│  └─────────────────┘  │                            │
└─────────────────────────────────────────────────────┘
```

**Mobile Layout (<1024px)**:
```
┌─────────────────────────────┐
│  ✨ Tagline                  │
│                             │
│  Headline                   │
│                             │
│  Subheading                 │
│                             │
│  [CTA Button]               │
│                             │
├─────────────────────────────┤
│                             │
│  HeroImageGrid              │
│  (4 images, stacked)        │
│                             │
└─────────────────────────────┘
```

### Styling Specifications

**Tailwind Classes Reference**:

Hero Section Container:
- `max-w-7xl` - Maximum width constraint
- `mx-auto` - Center horizontally
- `px-4 md:px-8` - Responsive horizontal padding
- `py-12 md:py-16` - Responsive vertical padding

Grid Container:
- `grid` - CSS Grid layout
- `grid-cols-1 lg:grid-cols-5` - 1 column mobile, 5 columns desktop
- `gap-8 lg:gap-12` - Responsive gap between columns
- `items-center` - Vertical alignment

Text Column:
- `col-span-1 lg:col-span-2` - 1 column mobile, 2 columns desktop
- `space-y-6` - Vertical spacing between elements
- `flex flex-col justify-center` - Vertical centering

Tagline:
- `flex items-center gap-2` - Horizontal layout with icon
- `text-sm font-medium text-zinc-600 dark:text-zinc-400` - Small muted text
- `Sparkles` icon size: `h-4 w-4`

Headline (h1):
- `text-4xl md:text-5xl lg:text-6xl` - Responsive large text
- `font-bold tracking-tight` - Bold, tight letter spacing
- `text-black dark:text-white` - High contrast

Subheading:
- `text-lg md:text-xl` - Responsive medium text
- `text-zinc-600 dark:text-zinc-400` - Muted color
- `max-w-prose` - Constrain line length for readability

CTA Button:
- Use `Button` component with `variant="default"` and `size="lg"`
- Text: "Create Your First List"

Image Column:
- `col-span-1 lg:col-span-3` - 1 column mobile, 3 columns desktop

### State Management

**No changes required** - Modal state already managed in LandingPageClient:
- `isLoginModalOpen` / `setIsLoginModalOpen`
- `isSignupModalOpen` / `setIsSignupModalOpen`
- `openSignupModal` function already exists

### Testing Strategy

**Component Tests** (`landing-page-client.test.tsx`):
- ✅ Hero section renders all text elements (tagline, headline, subheading)
- ✅ Sparkles icon displays with tagline
- ✅ CTA button renders with correct text
- ✅ Clicking hero CTA button calls openSignupModal
- ✅ Semantic HTML structure (h1 for headline, proper heading hierarchy)

**Responsive Tests** (`landing-page-responsive.test.tsx`):
- ✅ Desktop viewport (≥1024px): Two-column layout with 2:3 ratio
- ✅ Mobile viewport (<1024px): Stacked vertical layout
- ✅ No horizontal scroll at any viewport size (320px - 1920px)
- ✅ Content wraps gracefully at all breakpoints

**Accessibility Tests** (`landing-page-accessibility.test.tsx`):
- ✅ Proper heading hierarchy (h1 for main headline)
- ✅ CTA button is keyboard-focusable
- ✅ CTA button has accessible name
- ✅ Color contrast meets WCAG AA standards
- ✅ Screen reader can navigate content in logical order

**Integration Tests** (`navigation.test.tsx`):
- ✅ Hero CTA button opens signup modal
- ✅ Header "Start Curating" button opens signup modal
- ✅ Header "Log In" button opens login modal
- ✅ Only one modal visible at a time
- ✅ Closing modal returns to landing page

**E2E Tests** (`landing-page.spec.ts`):
- ✅ Complete flow: View hero → Click CTA → Modal opens → Close modal
- ✅ Visual regression: Hero section matches snapshot
- ✅ Mobile flow: Text stacks above images
- ✅ Desktop flow: Side-by-side layout

### Files to Modify

1. **src/components/shared/LandingPageClient.tsx**
   - Remove existing YourFavs title and tagline (lines 41-48)
   - Replace `main` content with new hero section layout
   - Keep Header, modals, and state management unchanged

2. **tests/component/landing-page/landing-page-client.test.tsx**
   - Update existing tests to match new hero content
   - Add new tests for hero section rendering
   - Add tests for CTA button interaction

3. **tests/component/landing-page/landing-page-responsive.test.tsx**
   - Add tests for desktop two-column layout
   - Add tests for mobile stacked layout
   - Add viewport-specific rendering tests

4. **tests/component/landing-page/landing-page-accessibility.test.tsx**
   - Add heading hierarchy tests
   - Add CTA button accessibility tests
   - Verify color contrast for new text elements

5. **tests/integration/landing-page/navigation.test.tsx**
   - Add test for hero CTA → signup modal flow
   - Verify modal state isolation

6. **tests/e2e/landing-page.spec.ts**
   - Add E2E scenarios for hero section user stories
   - Add visual regression tests if applicable

### Dependencies

**Existing Dependencies** (no new installations required):
- `lucide-react` - Already installed, will use `Sparkles` icon
- `@/components/ui/button` - Already exists (shadcn/ui)
- `@/components/shared/HeroImageGrid` - Already exists

### Performance Considerations

- Hero text is server-rendered (no client-side JS for initial display)
- CTA button requires client interactivity (already a client component)
- No additional images or assets (Sparkles icon from lucide-react)
- No layout shift: Grid layout established immediately on render
- No new network requests

### Accessibility Requirements

- Use semantic HTML (`h1` for headline, `button` for CTA)
- Ensure proper heading hierarchy (h1 → no skipped levels)
- Maintain keyboard navigation support (Button component already supports)
- Provide sufficient color contrast (using existing zinc-600/400 for muted text)
- Ensure focus visible on interactive elements

**Deliverables**:
- ✅ quickstart.md - Developer implementation guide
- ✅ Component architecture documented above
- ✅ Testing strategy defined above

---

## Phase 2: Implementation Planning

**Status**: ⏸️ PENDING - This phase is completed by `/speckit.tasks` command

The `/speckit.tasks` command will generate `tasks.md` with:
- Atomic, sequenced implementation tasks
- Test creation tasks for each user story
- Task dependencies and prerequisites
- Acceptance criteria for each task
- Estimated complexity/effort

**Next Step**: Run `/speckit.tasks` to generate the detailed task breakdown in `specs/001-hero-section/tasks.md`

---

## Appendix: Decision Log

### Why 2:3 Column Ratio?
**Decision**: Use `col-span-2` for text and `col-span-3` for images (40%:60% ratio)  
**Rationale**: 
- Gives prominence to visual content (images) while maintaining sufficient space for text
- Matches common landing page patterns (text-light, image-heavy)
- Prevents text column from being too wide (maintains readability)
- 40% width ≈ 450-500px on 1200px viewport (optimal reading width)

**Alternatives Considered**:
- 50:50 split - Rejected: Text column too wide, poor reading experience
- 1:2 ratio (33:66) - Rejected: Text column too narrow for comfortable reading

### Why Sparkles Icon?
**Decision**: Use `Sparkles` from lucide-react for tagline decoration  
**Rationale**:
- Conveys sense of discovery, curation, special finds
- Lightweight (already in dependency bundle)
- Matches playful, friendly brand tone
- Small size (h-4 w-4) doesn't distract from text

**Alternatives Considered**:
- `Star` icon - Rejected: Too generic, suggests ratings
- `MapPin` icon - Rejected: Already used in header logo
- No icon - Rejected: Tagline needs visual anchor/interest

### Why Stack Vertically on Mobile?
**Decision**: Text above images on mobile (< 1024px)  
**Rationale**:
- Content hierarchy: Value proposition first, then visual proof
- Prevents squished text columns
- Matches natural reading flow (top to bottom)
- Consistent with mobile-first design patterns

**Alternatives Considered**:
- Side-by-side even on mobile - Rejected: Text unreadable in narrow column
- Images above text - Rejected: User should understand product before seeing images

### Why No New Component Extraction?
**Decision**: Keep hero section inline in LandingPageClient  
**Rationale**:
- Single use case (landing page only)
- Tightly coupled to modal state management
- No reusability requirement identified
- Extracting would add unnecessary file navigation overhead
- Violates YAGNI principle (constitution: avoid unnecessary abstraction)

**Alternatives Considered**:
- Create `HeroSection.tsx` component - Rejected: No reuse case, adds complexity
- Create `HeroTextContent.tsx` - Rejected: Over-abstraction for static content

---

## Constitution Re-check (Post-Design)

### I. Code Quality & Maintainability ✅ PASS
- Design uses standard Tailwind grid utilities (no custom CSS)
- No new components created (avoids unnecessary abstraction)
- Reuses all existing components and patterns
- Clear semantic HTML structure

### II. Testing Discipline & Safety Nets ✅ PASS
- Comprehensive testing strategy defined (component, integration, E2E)
- Tests cover all acceptance scenarios from spec
- Test patterns match existing codebase conventions

### III. User Experience Consistency ✅ PASS
- Terminology consistent with product language
- Visual design matches existing color scheme and typography
- Interaction patterns match established Header → Modal flow

### IV. Performance & Resource Efficiency ✅ PASS
- Server-rendered hero text (no JS overhead)
- No new network requests
- No layout shift (grid established on render)
- No new dependencies

### V. Observability & Debuggability ✅ PASS
- Standard React component structure (easy to inspect)
- No complex state management (simple boolean flags)
- Clear error paths (modal opens or doesn't)

**Final Assessment**: ✅ ALL GATES PASSED - Ready for implementation

---

## Summary

This implementation plan provides a complete blueprint for adding the hero section to the landing page. The design:

1. **Reuses existing infrastructure** - No new components, state patterns, or dependencies
2. **Follows established patterns** - Matches existing layout, styling, and testing approaches
3. **Meets all requirements** - Addresses every functional requirement and success criterion from spec
4. **Maintains quality standards** - Passes all Constitution gates
5. **Low risk** - Pure layout change with comprehensive test coverage

**Next Steps**:
1. Generate quickstart.md with implementation code samples
2. Run `/speckit.tasks` to create detailed task breakdown
3. Begin implementation following task sequence
