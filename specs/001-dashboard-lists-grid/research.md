# Research: Dashboard Lists and Grids

**Feature**: Dashboard Lists and Grids  
**Phase**: 0 - Outline & Research  
**Date**: 2025-12-07

## Overview

This document consolidates research findings and decisions for implementing the dashboard lists grid feature. All technical uncertainties have been resolved through analysis of existing codebase patterns, shadcn/ui documentation, and Next.js best practices.

## Research Tasks Completed

### 1. shadcn/ui Badge Component Integration

**Decision**: Install Badge component via shadcn CLI  
**Rationale**: 
- Project already uses shadcn/ui with "new-york" style (confirmed in components.json)
- Badge component is standard shadcn/ui component, not currently installed
- Installation via CLI ensures consistency with existing components
- Component needed for "Published" vs "Draft" status display

**Installation Command**:
```bash
npx shadcn@latest add badge
```

**Alternatives Considered**:
- Custom badge component: Rejected - violates DRY and Framework Code Integrity principles
- Span with Tailwind classes only: Rejected - less semantic, harder to maintain

**Implementation Notes**:
- Use `variant` prop for visual distinction (default for Published, secondary/outline for Draft)
- Badge component will NOT be modified after installation per constitution

---

### 2. shadcn/ui DropdownMenu Component Integration

**Decision**: Install DropdownMenu component via shadcn CLI  
**Rationale**:
- Required for three-dot menu button (FR-012)
- Not currently installed in project
- Standard shadcn/ui component ensures accessibility and consistency
- Menu content implementation deferred to separate feature (issue #4)

**Installation Command**:
```bash
npx shadcn@latest add dropdown-menu
```

**Alternatives Considered**:
- Custom menu component: Rejected - complex accessibility requirements
- Button only without dropdown: Rejected - doesn't meet future requirements

**Implementation Notes**:
- Initial implementation uses DropdownMenuTrigger with Button
- DropdownMenuContent left empty with TODO comment for issue #4
- Event propagation stopped on trigger to prevent card click (FR-014)

---

### 3. Next.js Image Component Best Practices

**Decision**: Use Next.js Image component with external image loader configuration  
**Rationale**:
- Next.js Image component provides automatic optimization (FR-020)
- Handles responsive images and lazy loading
- Built-in error handling for failed loads
- Requires configuration for external placeholder service (placehold.co)

**Configuration Required** (next.config.ts):
```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'placehold.co',
    },
  ],
}
```

**Alternatives Considered**:
- Standard HTML img tag: Rejected - no optimization, manual responsive handling
- Third-party image component: Rejected - unnecessary dependency

**Implementation Notes**:
- Use `fill` layout for responsive card images
- Apply `object-cover` for consistent aspect ratio
- Provide alt text via list title (FR-016)
- Image dimensions: aspect ratio 16:9 or 4:3 for card hero images

---

### 4. Responsive Grid Layout Pattern

**Decision**: Use CSS Grid with Tailwind responsive utilities  
**Rationale**:
- Tailwind provides built-in responsive grid utilities
- Matches existing project patterns (confirmed in DashboardContent, DashboardSidebar)
- No additional dependencies required
- Clean, declarative syntax

**Implementation**:
```typescript
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
```

**Breakpoints** (Tailwind default, confirmed acceptable per spec assumptions):
- Mobile: `<768px` - 1 column (grid-cols-1)
- Tablet: `768px-1023px` - 2 columns (md:grid-cols-2)
- Desktop: `≥1024px` - 3 columns (lg:grid-cols-3)

**Alternatives Considered**:
- Flexbox with wrapping: Rejected - grid provides better control and alignment
- CSS Grid with custom media queries: Rejected - Tailwind utilities sufficient
- Third-party grid library: Rejected - unnecessary complexity

**Implementation Notes**:
- Use `gap-6` (24px) for consistent spacing
- Container uses full width within DashboardContent
- Responsive breakpoints align with existing dashboard layout

---

### 5. Text Truncation for Long Titles

**Decision**: Use Tailwind `line-clamp-2` utility  
**Rationale**:
- Tailwind provides built-in line-clamp utilities (CSS line-clamp)
- Meets requirement for 2-line truncation with ellipsis (FR-009)
- No JavaScript required - pure CSS solution
- Widely supported in modern browsers

**Implementation**:
```typescript
className="line-clamp-2 text-lg font-semibold"
```

**Alternatives Considered**:
- JavaScript-based truncation: Rejected - unnecessary complexity, performance overhead
- Single-line truncation with `truncate`: Rejected - doesn't meet 2-line requirement
- Custom CSS with -webkit-line-clamp: Rejected - Tailwind utility preferred

**Implementation Notes**:
- Works with any text content
- Automatically adds ellipsis when text exceeds 2 lines
- Gracefully degrades in older browsers to overflow hidden

---

### 6. Place Count Pluralization Logic

**Decision**: Implement simple conditional logic in component  
**Rationale**:
- Straightforward requirement: "place" vs "places" (FR-011)
- No need for i18n library for this single use case
- TypeScript provides type safety

**Implementation**:
```typescript
const placeText = placeCount === 1 ? 'place' : 'places';
```

**Alternatives Considered**:
- i18n library (e.g., react-intl): Rejected - overkill for single pluralization
- Separate utility function: Rejected - too simple to extract
- Template string with conditional: Accepted - inline for clarity

**Implementation Notes**:
- Handle edge case: 0 places displays "0 places" (plural)
- Validation at data layer prevents negative counts (assumption from spec)

---

### 7. Click Handler Event Propagation

**Decision**: Use `event.stopPropagation()` on menu button click  
**Rationale**:
- Prevents menu button clicks from triggering card click (FR-14)
- Standard React event handling pattern
- No additional libraries needed

**Implementation**:
```typescript
const handleMenuClick = (e: React.MouseEvent) => {
  e.stopPropagation();
  // Future: open dropdown menu
};
```

**Alternatives Considered**:
- Pointer-events CSS: Rejected - prevents button interaction entirely
- Event delegation with target checking: Rejected - more complex, less explicit
- Separate click zones: Rejected - poor UX, accessibility concerns

**Implementation Notes**:
- Apply to DropdownMenuTrigger's onClick
- Card onClick logs list ID (FR-015)
- Clean separation of concerns

---

### 8. Mock Data Structure

**Decision**: Create typed mock data matching database schema  
**Rationale**:
- Provides realistic data for development and testing
- Type-safe with TypeScript interfaces
- Easy to replace with real data in future
- Supports all required attributes (FR-001 through FR-020)

**Data Structure**:
```typescript
interface MockList {
  id: string;
  title: string;
  heroImageUrl: string;
  isPublished: boolean;
  placeCount: number;
}
```

**Mock Data Requirements**:
- 5 lists minimum (FR-018)
- Mix of published and draft status
- Various place counts (0, 1, multiple)
- Long titles to test truncation
- Placeholder images from placehold.co (FR-019)

**Alternatives Considered**:
- Fetch from database: Rejected - not in scope for initial implementation
- JSON file: Rejected - TypeScript file provides type safety
- Faker library: Rejected - unnecessary dependency for 5 static items

**Implementation Notes**:
- Store in `src/lib/mocks/lists.ts`
- Export as named constant `mockLists`
- Include comments indicating temporary nature

---

### 9. Accessibility Considerations

**Decision**: Implement semantic HTML with ARIA where needed  
**Rationale**:
- WCAG 2.1 AA compliance required (SC-008)
- Screen reader support for list metadata (SC-006)
- Semantic HTML improves accessibility by default

**Implementation Checklist**:
- ✅ Use `<h3>` for list titles (FR-017)
- ✅ Provide alt text for images using list title (FR-016)
- ✅ Include accessible labels for status badges
- ✅ Ensure keyboard navigation for card and menu button
- ✅ Sufficient color contrast for status badges
- ✅ Focus indicators on interactive elements

**Testing Tools**:
- Playwright accessibility testing in E2E tests
- Manual testing with screen reader (NVDA/JAWS/VoiceOver)
- Browser DevTools accessibility audit

**Alternatives Considered**:
- ARIA-only approach: Rejected - semantic HTML preferred when possible
- Skip accessibility in initial implementation: Rejected - violates constitution

**Implementation Notes**:
- Badge text includes status for screen readers
- Card wraps in button or uses role="button" with keyboard handlers
- Menu button has aria-label="Options for [list title]"

---

### 10. Testing Strategy

**Decision**: Multi-layer testing approach with Vitest and Playwright  
**Rationale**:
- Project already configured with Vitest and Playwright
- Component tests ensure individual component correctness
- Integration tests verify component interaction
- E2E tests validate responsive behavior and accessibility
- Meets ≥65% coverage requirement (SC-007)

**Test Plan**:

#### Unit Tests (Vitest + React Testing Library)
**ListCard Component**:
- Renders all required elements (image, title, badge, count, menu)
- Displays correct badge variant for published/draft status
- Truncates long titles
- Handles singular/plural place count
- Calls onClick handler with list ID
- Stops propagation on menu button click
- Renders with missing/default hero image

**ListGrid Component**:
- Renders all list cards from data
- Applies correct grid classes
- Handles empty lists array
- Passes click handlers correctly

#### E2E Tests (Playwright)
- Responsive grid at mobile/tablet/desktop breakpoints
- Card click logs to console
- Menu button doesn't trigger card click
- Images load correctly
- Accessibility audit passes (WCAG 2.1 AA)
- Keyboard navigation works

**Coverage Target**: ≥65% for new components (SC-007)

**Alternatives Considered**:
- Unit tests only: Rejected - doesn't verify responsive behavior
- E2E tests only: Rejected - slow, doesn't provide fine-grained coverage
- Visual regression testing: Deferred - not in initial scope

**Implementation Notes**:
- Tests co-located in `tests/` directory mirroring source structure
- Mock console.log for card click verification
- Use Playwright's `setViewportSize` for responsive testing

---

## Technology Decisions Summary

| Technology | Decision | Justification |
|------------|----------|---------------|
| Badge Component | shadcn/ui Badge via CLI | Consistency, no custom implementation needed |
| Dropdown Menu | shadcn/ui DropdownMenu via CLI | Accessibility, future-ready for issue #4 |
| Image Handling | Next.js Image component | Built-in optimization, error handling |
| Grid Layout | CSS Grid + Tailwind utilities | Simple, responsive, no dependencies |
| Text Truncation | Tailwind line-clamp-2 | Pure CSS, widely supported |
| Event Handling | stopPropagation() | Standard React pattern |
| Mock Data | TypeScript file with types | Type-safe, easy to replace |
| Testing | Vitest + RTL + Playwright | Existing setup, multi-layer coverage |

## Dependencies Summary

### New Dependencies to Install
- shadcn/ui Badge component (via CLI)
- shadcn/ui DropdownMenu component (via CLI)

### Existing Dependencies (Already Available)
- Next.js (16.0.5) with Image component
- React (19.2.0)
- Tailwind CSS (4)
- lucide-react (0.555.0) for icons
- shadcn/ui Card component (already installed)
- shadcn/ui Button component (already installed)
- Vitest + React Testing Library (configured)
- Playwright (configured)

### Configuration Changes Required
- `next.config.ts`: Add placehold.co to `remotePatterns` for Image component

## Best Practices Established

1. **Component Composition**: Wrap shadcn/ui components, don't modify them
2. **Responsive Design**: Use Tailwind breakpoint utilities consistently
3. **Type Safety**: Define TypeScript interfaces for all data structures
4. **Accessibility**: Semantic HTML first, ARIA when needed
5. **Testing**: Test user behavior, not implementation details
6. **Mock Data**: Typed, realistic, easy to replace with real data
7. **Event Handling**: Explicit propagation control for nested interactive elements
8. **Performance**: Use Next.js optimizations (Image component, React 19)

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Placeholder service (placehold.co) unavailable | Images fail to load | Next.js Image handles errors gracefully with fallback |
| Long list titles break layout | Visual design issues | line-clamp-2 ensures consistent height |
| Large number of lists impacts performance | Slow render, poor UX | Out of scope for initial implementation; pagination planned for future |
| Accessibility violations | Non-compliance, poor UX | E2E accessibility tests, manual screen reader testing |
| Browser compatibility | Features broken in older browsers | Target modern browsers, graceful degradation for line-clamp |

## Open Questions Resolved

All technical uncertainties identified in the Technical Context section have been resolved:
- ✅ Badge component approach determined
- ✅ Dropdown menu component selected
- ✅ Image optimization strategy defined
- ✅ Responsive grid pattern established
- ✅ Text truncation method chosen
- ✅ Event handling approach clarified
- ✅ Testing strategy comprehensive
- ✅ Mock data structure defined

## Next Steps

Proceed to **Phase 1: Design & Contracts**
- Create data-model.md defining List entity and relationships
- Generate API contracts (if needed for future database integration)
- Create quickstart.md for developer onboarding
- Update agent context files with new technology decisions
