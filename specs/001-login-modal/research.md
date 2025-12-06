# Phase 0: Research & Architecture Decisions

## Login Modal Panel Component

**Date**: 2025-12-05  
**Feature Branch**: `001-login-modal`

---

## Research Tasks Resolved

### 1. Modal Component Reusability Pattern

**Decision**: Use composition pattern with Dialog wrapper around existing LoginForm

**Rationale**:

- LoginForm is already a complete, tested component with all authentication logic
- shadcn/ui Dialog component cannot be modified (Framework Code Integrity principle)
- Composition allows LoginForm to be reused in both standalone page and modal contexts
- Minimal code changes required - only prop additions for context awareness

**Implementation Approach**:

```typescript
// LoginModal wraps LoginForm within Dialog
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <LoginForm
      redirectTo={redirectTo}
      onSuccess={() => setIsOpen(false)}  // NEW: callback for modal closure
    />
  </DialogContent>
</Dialog>
```

**Alternatives Considered**:

1. **Duplicate LoginForm logic in modal** - Rejected: Violates DRY principle, doubles maintenance burden
2. **Refactor LoginForm to handle modal internally** - Rejected: Violates single responsibility, couples form to presentation context
3. **Create base form with two wrappers** - Rejected: Over-engineered for current need, adds unnecessary complexity

---

### 2. State Management for Modal Open/Close

**Decision**: Lift modal state to LandingPageClient component

**Rationale**:

- Header needs to trigger modal open via onLogin callback
- LandingPageClient is already the parent of Header and natural location for shared state
- Follows React best practices for state lifting to lowest common ancestor
- Keeps state management simple and traceable
- No global state management needed for single modal use case

**State Flow**:

```
LandingPageClient [owns: isLoginModalOpen, setIsLoginModalOpen]
  ├─→ Header [receives: onLogin={() => setIsLoginModalOpen(true)}]
  └─→ LoginModal [receives: isOpen={isLoginModalOpen}, onClose={...}]
```

**Alternatives Considered**:

1. **URL-based state (searchParams)** - Rejected: Unnecessary complexity, causes URL changes user didn't request
2. **Global state (Context/Redux)** - Rejected: Overkill for single modal, violates simplicity principle
3. **Modal state in Header** - Rejected: Header shouldn't own modal it doesn't render (wrong architectural level)

---

### 3. LoginForm Context Awareness

**Decision**: Add optional `onSuccess` callback prop to LoginForm

**Rationale**:

- LoginForm currently redirects after successful auth using router.push()
- Modal needs to close before redirect happens for smooth UX
- Optional callback maintains backward compatibility with standalone page
- Minimal change to existing component (single optional prop)

**Modified LoginForm signature**:

```typescript
export interface LoginFormProps {
  redirectTo?: string;
  defaultEmail?: string;
  onSuccess?: (data: { redirectTo: string }) => void; // NEW: optional
}
```

**Implementation**:

```typescript
// In LoginForm useEffect
useEffect(() => {
  if (state.isSuccess && state.data?.redirectTo) {
    if (onSuccess) {
      onSuccess(state.data); // Let modal close first
    } else {
      router.push(state.data.redirectTo); // Direct navigation for standalone
    }
  }
}, [state.isSuccess, state.data, router, onSuccess]);
```

**Alternatives Considered**:

1. **Separate ModalLoginForm component** - Rejected: Code duplication, violates DRY
2. **Mode prop ('standalone' | 'modal')** - Rejected: Exposes implementation detail, less flexible than callback
3. **Prevent redirect in modal entirely** - Rejected: Breaks expected post-login behavior

---

### 4. Accessibility & Focus Management

**Decision**: Leverage Radix UI Dialog's built-in accessibility features

**Rationale**:

- Radix UI Dialog (used by shadcn/ui) provides WCAG-compliant focus management out of the box
- Handles focus trap, Escape key, outside click, and focus return automatically
- Includes proper ARIA attributes and roles
- No custom focus management code needed, reducing bugs and complexity

**Built-in Features Utilized**:

- Focus trap within modal while open
- Focus return to trigger element on close
- Escape key handler
- Outside click handler (optional, can be disabled)
- aria-labelledby and aria-describedby for screen readers
- Portal rendering for proper z-index stacking

**Custom Additions Required**:

- Ensure DialogTitle is present for screen reader announcements
- Maintain focus on first input after modal opens (form auto-focuses by default)
- Proper button labeling in Header ("Log In")

**Alternatives Considered**:

1. **Custom focus trap implementation** - Rejected: Reinventing the wheel, higher bug risk
2. **react-focus-lock library** - Rejected: Radix already provides this
3. **No focus management** - Rejected: Fails accessibility requirements (WCAG 2.1 AA)

---

### 5. Modal Form State Reset

**Decision**: Reset form state on modal close via Dialog's onOpenChange callback

**Rationale**:

- Users expect fresh state when reopening modal after dismissal
- Prevents showing stale error messages or input values
- Radix Dialog's controlled state makes this straightforward
- Form state is ephemeral; no "draft" concept needed for login

**Implementation**:

```typescript
<Dialog
  open={isLoginModalOpen}
  onOpenChange={(open) => {
    setIsLoginModalOpen(open);
    if (!open) {
      // Form state resets automatically when LoginForm unmounts
      // No explicit reset action needed due to React's lifecycle
    }
  }}
>
```

**Alternatives Considered**:

1. **Preserve form state across modal close/open** - Rejected: Unexpected UX, stale errors confusing
2. **Explicit form.reset() call** - Rejected: Unnecessary, unmount/remount handles this
3. **Only reset on successful login** - Rejected: Partial state persistence is confusing

---

### 6. Testing Strategy

**Decision**: Multi-layer testing approach matching existing patterns

**Test Coverage Plan**:

1. **Unit Tests** (Vitest + React Testing Library)
   - LoginModal component in isolation
   - Props handling (isOpen, onClose)
   - Render LoginForm within Dialog
   - Accessibility attributes

2. **Component Integration Tests** (Vitest + React Testing Library)
   - Header button triggers modal open
   - LandingPageClient state management
   - Modal close on successful login
   - Modal close on user dismissal (Escape, outside click)

3. **Authentication Integration Tests** (Vitest + React Testing Library)
   - Login flow via modal
   - Error handling within modal
   - Form validation in modal context

4. **E2E Tests** (Playwright)
   - Complete user journey: land on page → click Log In → enter credentials → redirect
   - Keyboard navigation (Tab, Enter, Escape)
   - Screen reader announcements (if applicable)

**Coverage Target**: 65% minimum (matching project standards)

**Rationale**:

- Follows existing test organization in `tests/` directory
- Leverages same tools already configured (Vitest, RTL, Playwright)
- Separates concerns (unit → component → integration → E2E)
- Tests behavior, not implementation details

**Alternatives Considered**:

1. **E2E only** - Rejected: Slow feedback loop, doesn't catch unit-level bugs early
2. **Unit tests only** - Rejected: Misses integration issues (state flow, callbacks)
3. **Manual testing** - Rejected: Not sustainable, fails constitution testing discipline

---

### 7. Performance Optimization

**Decision**: No optimization needed beyond framework defaults

**Rationale**:

- LoginForm and Dialog components are already lightweight
- No heavy computation or large data sets
- Radix UI Dialog uses CSS transitions (GPU-accelerated)
- Next.js code splitting handles component loading efficiently
- Performance targets (<500ms open, <100ms interactive) easily met with current approach

**Monitoring Points**:

- Modal open response time (user clicks Log In → modal visible)
- Form interaction responsiveness
- No layout shift on modal open/close

**Future Optimizations** (if needed):

- Dynamic import for LoginModal (if bundle size becomes concern)
- Memoization of callback functions (unlikely needed with current simplicity)

**Alternatives Considered**:

1. **Eager optimization (dynamic imports)** - Rejected: Premature optimization, adds complexity
2. **Server-side rendering modal** - Rejected: Not applicable, modal is interactive/client-side by nature
3. **Virtualization** - Rejected: Not relevant for single form with few fields

---

## Technology Stack Confirmation

| Technology                  | Version | Purpose                     | Status        |
| --------------------------- | ------- | --------------------------- | ------------- |
| TypeScript                  | 5.x     | Type safety                 | ✅ In use     |
| Next.js                     | 16.0.5  | Framework                   | ✅ In use     |
| React                       | 19.2.0  | UI library                  | ✅ In use     |
| Radix UI Dialog             | 1.1.15  | Accessible dialog primitive | ✅ Installed  |
| shadcn/ui                   | Latest  | UI components               | ✅ In use     |
| Tailwind CSS                | 4.x     | Styling                     | ✅ In use     |
| Vitest                      | 4.0.14  | Unit testing                | ✅ Configured |
| React Testing Library       | 16.3.0  | Component testing           | ✅ Configured |
| Playwright                  | 1.57.0  | E2E testing                 | ✅ Configured |
| @testing-library/user-event | 14.6.1  | User interaction simulation | ✅ Installed  |

**New Dependencies**: NONE required - all necessary tools already in place

---

## Best Practices Applied

### React Patterns

- **Composition over inheritance**: LoginModal composes Dialog + LoginForm
- **Controlled components**: Modal state managed by parent
- **Props drilling avoided**: State lifted to appropriate level (LandingPageClient)
- **Single Responsibility**: Each component has one clear purpose

### Next.js App Router

- **Client Components**: Modal requires client-side interactivity ("use client")
- **Server Components**: No change needed; auth actions already server-side
- **Routing**: No new routes; modal overlays existing landing page

### Accessibility (WCAG 2.1 AA)

- **Focus management**: Radix Dialog handles trap and return
- **Keyboard navigation**: Tab, Enter, Escape all functional
- **Screen readers**: Proper ARIA labels, roles, and announcements
- **Color contrast**: Maintained via existing Tailwind theme
- **Visible focus indicators**: Browser defaults + Tailwind focus styles

### TypeScript

- **Strict mode**: Enabled in tsconfig.json
- **Explicit types**: All props interfaces defined
- **No `any` types**: Use proper typing for callbacks
- **Type inference**: Let TypeScript infer where obvious

### Testing

- **Arrange-Act-Assert**: Clear test structure
- **User-centric**: Test behavior, not implementation
- **Isolation**: Mock dependencies appropriately
- **Coverage**: Target 65% minimum

---

## Risk Assessment

| Risk                           | Likelihood | Impact | Mitigation                                                                  |
| ------------------------------ | ---------- | ------ | --------------------------------------------------------------------------- |
| Breaking standalone login page | Low        | High   | Keep LoginForm backward compatible with optional props; comprehensive tests |
| Focus management bugs          | Low        | Medium | Use Radix Dialog's proven implementation; accessibility tests               |
| State synchronization issues   | Low        | Medium | Simple state lifting pattern; integration tests verify flow                 |
| Performance regression         | Very Low   | Low    | Lightweight components; monitor bundle size                                 |
| Accessibility violations       | Low        | High   | Use Radix primitives; test with screen readers                              |
| Test coverage gaps             | Low        | Medium | Explicit coverage targets; review in code review                            |

---

## Open Questions & Assumptions

### Assumptions (Validated)

✅ **Assumption**: Users have JavaScript enabled  
✅ **Assumption**: Modal is only auth entry point from landing page (no OAuth in modal initially)  
✅ **Assumption**: Form reset on close is acceptable UX  
✅ **Assumption**: Post-login redirect behavior matches standalone page

### Open Questions (Resolved)

✅ **Q**: Should modal support sign-up flow too?  
**A**: Out of scope for this feature; focus on login only per spec

✅ **Q**: Should modal be reusable for other forms?  
**A**: No. LoginModal is specific to login. Future modals can follow same pattern.

✅ **Q**: How to handle "Remember me" checkbox in modal context?  
**A**: No change needed; checkbox behavior is identical in modal vs. standalone

---

## Summary

All research tasks have been completed with clear architectural decisions documented. The implementation approach prioritizes:

1. **Simplicity**: Minimal changes, composition over modification
2. **Reusability**: LoginForm works in both contexts via optional callback
3. **Maintainability**: Single source of truth for auth logic
4. **Accessibility**: Leverage proven Radix UI primitives
5. **Testability**: Clear component boundaries enable isolated testing

**Ready to proceed to Phase 1: Design & Contracts**
