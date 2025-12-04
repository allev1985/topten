# Implementation Plan: Auth-Aware Landing Page

**Branch**: `001-auth-landing-page` | **Date**: 2025-12-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-auth-landing-page/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Update the root landing page (`/`) to detect authentication state server-side and render appropriate content for authenticated and non-authenticated users. The implementation converts the current client component to an async Server Component that performs server-side authentication checks using Supabase, then passes the authentication state to a new Client Component wrapper for interactive features. This ensures fast server-side rendering, prevents hydration errors, and provides a foundation for future interactive enhancements.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 16.0.5 (App Router)  
**Primary Dependencies**: 
- React 19.2.0
- Next.js 16.0.5 (App Router)
- Supabase (@supabase/ssr 0.8.0, @supabase/supabase-js 2.86.0)
- Tailwind CSS 4.x with shadcn/ui components
- Vitest 4.0.14 for unit/component testing
- React Testing Library 16.3.0
- Playwright 1.57.0 for E2E testing

**Storage**: Supabase (PostgreSQL) via Drizzle ORM - not required for this feature (auth only)  
**Testing**: Vitest + React Testing Library for component/unit tests, Playwright for E2E flows  
**Target Platform**: Web (SSR with Next.js App Router)  
**Project Type**: Web application (Next.js monorepo with App Router)  
**Performance Goals**: 
- Initial server render < 1 second on standard connections
- Auth check < 200ms average
- Time to First Byte (TTFB) optimized through server components

**Constraints**: 
- Zero hydration errors (critical for SSR/CSR boundary)
- Server-side auth check before page render
- Compatible with existing middleware session refresh
- Must pass serializable props only to client components

**Scale/Scope**: 
- Single landing page component transformation
- 70%+ test coverage for auth detection logic
- Foundation for future client-side interactivity

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Code Quality & Maintainability (NON-NEGOTIABLE) ✅
- **Single Responsibility**: Server Component handles auth detection, Client Component handles interactivity
- **DRY Compliance**: Reuses existing `createClient()` from `@/lib/supabase/server`
- **Simplicity**: Minimal transformation - only adds async/await and auth check
- **Justification**: Clear separation between server-side auth and client-side rendering, documented in code

### Testing Discipline & Safety Nets (NON-NEGOTIABLE) ✅
- **Coverage Target**: 70%+ for auth detection logic (exceeds minimum requirement)
- **Test Strategy**: 
  - Unit tests for auth state detection
  - Component tests for rendering with different auth states
  - E2E tests for full user flows (authenticated/non-authenticated)
- **Test Types**: Unit (Vitest) + Component (RTL) + E2E (Playwright)
- **Before/Alongside**: Tests written as part of implementation plan (Phase 2)

### User Experience Consistency ✅
- **Visual Consistency**: Maintains existing layout and styling
- **No Breaking Changes**: Existing landing page appearance unchanged for both states
- **Auth State UX**: Foundation for future personalized content (consistent with app patterns)

### Performance & Resource Efficiency ✅
- **Defined Targets**: 
  - Auth check < 200ms (SC-004)
  - Initial render < 1s (SC-003)
  - Server-side rendering maintained
- **Measurement**: Performance metrics tracked via Next.js built-in profiling
- **Optimization**: Server Components reduce client-side JS, auth check is async

### Observability & Debuggability ✅
- **Error Handling**: Graceful fallback to non-authenticated state on auth failures
- **Logging**: Auth errors handled gracefully (no sensitive data exposure)
- **User-Facing Errors**: Clear loading states, no hydration error messages
- **Developer Experience**: TypeScript types ensure correct prop passing

**GATE STATUS**: ✅ PASS - All constitution principles satisfied. No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

## Project Structure

### Documentation (this feature)

```text
specs/001-auth-landing-page/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output - Next.js SSR/CSR patterns, Supabase auth best practices
├── data-model.md        # Phase 1 output - Auth state interface definition
├── quickstart.md        # Phase 1 output - How to add auth-aware components
├── contracts/           # Phase 1 output - Component prop interfaces
│   └── landing-page.ts  # TypeScript interface for LandingPageClient props
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   └── page.tsx                            # [MODIFIED] Server Component with auth check
├── components/
│   └── shared/
│       └── LandingPageClient.tsx           # [NEW] Client Component wrapper
└── lib/
    └── supabase/
        └── server.ts                       # [EXISTING] Used by page.tsx for auth

tests/
├── unit/
│   └── auth/
│       └── landing-page-auth.test.ts       # [NEW] Auth detection unit tests
├── component/
│   └── landing-page/
│       └── LandingPageClient.test.tsx      # [NEW] Component rendering tests
└── e2e/
    └── landing-page/
        ├── authenticated.spec.ts            # [NEW] E2E test for authenticated users
        └── non-authenticated.spec.ts        # [NEW] E2E test for guests
```

**Structure Decision**: Follows existing Next.js App Router conventions. Server Component (`page.tsx`) handles auth check at the page level, passing serializable boolean to Client Component for rendering. This maintains the app's established separation between server-side data fetching and client-side interactivity. Test structure mirrors existing patterns with unit, component, and e2e separation.

## Complexity Tracking

**NO VIOLATIONS** - This feature introduces no complexity that violates the Constitution. All design choices align with established Next.js patterns and project conventions.

---

## Phase Execution Summary

### Phase 0: Outline & Research ✅ COMPLETE

**Status**: Complete  
**Output**: `research.md`

**Research Questions Resolved**:
1. ✅ Next.js App Router Server Component authentication patterns
2. ✅ Preventing hydration errors in SSR/CSR boundaries  
3. ✅ Supabase auth best practices for Server Components
4. ✅ Testing strategy for server component authentication
5. ✅ Performance optimization for auth checks

**Key Decisions**:
- Use async Server Components with Supabase SSR client
- Pass `isAuthenticated: boolean` prop to prevent hydration errors
- Use `getUser()` for secure server-side auth validation
- Multi-layer testing: Unit + Component + E2E
- Leverage Server Components for <200ms auth check performance

**All NEEDS CLARIFICATION items resolved** ✓

---

### Phase 1: Design & Contracts ✅ COMPLETE

**Status**: Complete  
**Outputs**: 
- ✅ `data-model.md` - Auth state interface definition
- ✅ `contracts/landing-page.ts` - TypeScript component interfaces
- ✅ `quickstart.md` - Developer implementation guide
- ✅ Agent context updated (`.github/agents/copilot-instructions.md`)

**Key Artifacts**:

1. **Data Model** (`data-model.md`):
   - Core entity: `isAuthenticated: boolean`
   - Component interface: `LandingPageClientProps`
   - Data flow: Server → Client with serializable props
   - Error handling: Fail-closed security pattern

2. **Contracts** (`contracts/landing-page.ts`):
   - `LandingPageClientProps` interface
   - `AuthCheckResult` internal type
   - `AuthCheckError` error type
   - Type guards and constants
   - Comprehensive TypeScript documentation

3. **Quickstart Guide** (`quickstart.md`):
   - Implementation steps with code examples
   - Error handling patterns
   - Testing guide (unit, component, E2E)
   - Common pitfalls and solutions
   - Performance best practices
   - Debugging tips

4. **Agent Context Update**:
   - Added TypeScript 5.x with Next.js 16.0.5 to tech stack
   - Added Supabase auth patterns
   - Updated project type to Web Application (Next.js monorepo)

---

### Post-Design Constitution Check ✅ PASS

**Re-evaluation after Phase 1 design artifacts:**

#### Code Quality & Maintainability ✅
- **DRY**: Reuses `createClient()`, no duplication introduced
- **Single Responsibility**: Clear separation (Server = auth, Client = render)
- **Simplicity**: Minimal changes, boolean prop pattern
- **Documentation**: Comprehensive (research, data model, quickstart, contracts)

#### Testing Discipline ✅
- **Coverage Strategy**: Documented in research.md and quickstart.md
- **Test Types**: Unit (Vitest) + Component (RTL) + E2E (Playwright)
- **Test Examples**: Provided in quickstart guide
- **70% Coverage Target**: Achievable with documented test strategy

#### User Experience Consistency ✅
- **No Breaking Changes**: Visual appearance unchanged
- **Auth State Handling**: Follows existing app patterns
- **Error States**: Graceful fallback to guest view

#### Performance & Resource Efficiency ✅
- **Targets Defined**: <200ms auth, <1s initial render
- **Measurement Plan**: Next.js built-in profiling
- **Optimization Strategy**: Server Components reduce client JS

#### Observability & Debuggability ✅
- **Error Handling**: Documented fail-closed pattern
- **Logging**: Development mode auth status logging
- **Type Safety**: TypeScript contracts prevent runtime errors
- **Debugging Guide**: Included in quickstart.md

**FINAL GATE STATUS**: ✅ PASS - All principles satisfied post-design

---

## Next Steps (Phase 2)

**Phase 2 is NOT executed by this command.** Use `/speckit.tasks` to generate implementation tasks.

Expected Phase 2 outputs:
- `tasks.md` - Detailed implementation task breakdown
- Task categories: Implementation, Testing, Documentation
- Each task linked to user stories and constitution principles

---

## Appendix: Generated Artifacts

### File Manifest

```text
specs/001-auth-landing-page/
├── spec.md                    # [EXISTING] Feature specification
├── plan.md                    # [THIS FILE] Implementation plan
├── research.md                # [PHASE 0] Research findings
├── data-model.md              # [PHASE 1] Data structures
├── quickstart.md              # [PHASE 1] Developer guide
└── contracts/
    └── landing-page.ts        # [PHASE 1] TypeScript interfaces
```

### Agent Context Updates

- **File**: `.github/agents/copilot-instructions.md`
- **Changes**:
  - Added: TypeScript 5.x with Next.js 16.0.5 (App Router)
  - Added: Supabase (PostgreSQL) via Drizzle ORM
  - Updated: Project type to Web application

### Branch Information

- **Branch**: `001-auth-landing-page`
- **Base**: Current development branch
- **Status**: Ready for Phase 2 (task generation)

---

## Implementation Readiness Checklist

- ✅ Feature specification reviewed
- ✅ Constitution principles verified (pre-design)
- ✅ Research completed (all unknowns resolved)
- ✅ Data model defined
- ✅ TypeScript contracts created
- ✅ Developer quickstart guide written
- ✅ Agent context updated
- ✅ Constitution principles verified (post-design)
- ⏳ Tasks breakdown (Phase 2 - use `/speckit.tasks`)
- ⏳ Implementation (Phase 3 - manual)
- ⏳ Testing (Phase 3 - manual)
- ⏳ Review & merge (Phase 4 - manual)

**Planning Phase Complete** ✅

---

## Command Output Summary

**Command**: `/speckit.plan` for feature `001-auth-landing-page`

**Branch**: `001-auth-landing-page`

**Artifacts Generated**:
1. ✅ `plan.md` - This implementation plan
2. ✅ `research.md` - Technical research findings
3. ✅ `data-model.md` - Data structure definitions
4. ✅ `contracts/landing-page.ts` - TypeScript interfaces
5. ✅ `quickstart.md` - Developer implementation guide

**Agent Context Updated**: ✅ GitHub Copilot instructions

**Constitution Gates**: ✅ All passed (pre and post-design)

**Ready for Phase 2**: ✅ Yes - Run `/speckit.tasks` to generate implementation tasks

---

**Planning Complete - End of `/speckit.plan` Command Output**
