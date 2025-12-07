# Research: Fix Middleware Location and Route Protection

**Feature**: 001-fix-middleware-location  
**Date**: 2025-12-07  
**Status**: Complete

## Overview

This document consolidates research findings for relocating Next.js middleware from the project root to the `src/` directory to ensure proper invocation and route protection.

## Research Questions Addressed

### 1. Next.js Middleware Location Requirements

**Question**: Where must middleware.ts be located when using a `src/` directory structure?

**Decision**: Middleware must be located at `src/middleware.ts` when using a src-based project structure.

**Rationale**: 
- Next.js documentation explicitly states: "The middleware file should be placed in the root of your project. If you're using a `src` directory, it should be placed inside `src`."
- When Next.js detects a `src/` directory, it looks for middleware at `src/middleware.ts`, not at the root level
- This is a framework convention, not a configuration option
- The current location at root `./middleware.ts` is only correct for projects without a `src/` directory

**Alternatives considered**:
- **Keep middleware at root**: Rejected - Framework will not invoke it in src-based projects
- **Use middleware.js instead of middleware.ts**: Rejected - TypeScript is the project standard
- **Configure custom middleware location**: Rejected - Next.js doesn't support custom middleware paths

**References**:
- Next.js Middleware Documentation: https://nextjs.org/docs/app/building-your-application/routing/middleware
- Next.js Project Structure: https://nextjs.org/docs/getting-started/project-structure

---

### 2. Next.js Configuration File Location

**Question**: Should next.config.ts move with middleware.ts?

**Decision**: next.config.ts must remain at the project root.

**Rationale**:
- Configuration files (next.config.ts, package.json, tsconfig.json) always stay at project root
- Only application code moves into `src/`
- This is a universal Next.js convention regardless of whether using `src/` directory

**Alternatives considered**:
- **Move next.config.ts to src/**: Rejected - Framework requirement, not supported by Next.js

---

### 3. Modern Next.js Middleware Patterns

**Question**: Is the current middleware implementation using deprecated patterns?

**Decision**: Current implementation uses modern patterns and requires no updates.

**Rationale**:
- Uses `@supabase/ssr` v0.8.0 with `createServerClient` - latest SSR package
- Cookie handling via `cookies.getAll()` and `cookies.setAll()` - current Next.js 13+ pattern
- NextResponse API is current and stable
- Session refresh pattern using `supabase.auth.getUser()` is the recommended approach
- Matcher configuration excluding static assets is best practice

**Current implementation strengths**:
- ✅ Uses `@supabase/ssr` (not deprecated `@supabase/auth-helpers-nextjs`)
- ✅ Proper cookie handling for App Router
- ✅ Fail-closed security (redirects on errors)
- ✅ Session refresh built-in
- ✅ Validated redirectTo parameter (open redirect protection)

**Alternatives considered**:
- **Refactor to newer patterns**: Rejected - Current implementation already uses latest patterns
- **Add middleware caching**: Rejected - Authentication checks should not be cached
- **Use Edge Runtime explicitly**: Not needed - Middleware runs on Edge Runtime by default

**References**:
- Supabase SSR Documentation: https://supabase.com/docs/guides/auth/server-side/nextjs
- Next.js Middleware Runtime: https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes

---

### 4. Import Path Resolution After Move

**Question**: Will TypeScript path aliases continue to work after moving middleware?

**Decision**: No changes needed - path aliases work the same from `src/middleware.ts`.

**Rationale**:
- TypeScript `paths` in tsconfig.json are configured with `"@/*": ["./src/*"]`
- This works from any file within `src/` directory
- All existing imports (`@/lib/auth/helpers/middleware`, `@/lib/supabase/middleware`, `@/lib/config`) will continue to resolve correctly

**Current imports that will continue working**:
```typescript
import { createServerClient } from "@supabase/ssr";  // node_modules
import { isProtectedRoute, isPublicRoute, ... } from "@/lib/auth/helpers/middleware";  // path alias
import { updateSession } from "@/lib/supabase/middleware";  // path alias
```

**Alternatives considered**:
- **Switch to relative imports**: Rejected - Path aliases are more maintainable and consistent with project style
- **Update tsconfig paths**: Not needed - Current configuration already correct

---

### 5. Test File Updates Required

**Question**: Which test files need updates after moving middleware.ts?

**Decision**: Only integration tests importing from root middleware need updates.

**Rationale**:
- Unit tests for helper functions (`tests/unit/lib/auth/helpers/middleware.test.ts`) don't import root middleware - no changes needed
- Unit tests for session handling (`tests/unit/lib/supabase/middleware.test.ts`) don't import root middleware - no changes needed
- Integration tests (`tests/integration/middleware/auth-middleware.test.ts`) may import or reference the middleware file - need to verify and update if needed

**Action items**:
1. Check integration test imports
2. Update any imports from `@/middleware` to reference new location (if applicable)
3. Verify mock setups don't hard-code old path
4. Run full test suite to catch any missed references

---

### 6. Deployment and Runtime Verification

**Question**: How to verify middleware is being invoked after the move?

**Decision**: Multi-layered verification approach combining local testing, logs, and behavioral tests.

**Verification strategy**:

**Level 1 - Local Development**:
- Access `/dashboard` without authentication → should redirect to `/login?redirectTo=/dashboard`
- Log in and access `/dashboard` → should load without redirect
- Check Next.js build output for middleware compilation confirmation

**Level 2 - Test Suite**:
- Run existing integration tests: `npm test -- tests/integration/middleware/auth-middleware.test.ts`
- Run E2E tests: `npm run test:e2e` (if applicable)
- All tests must pass

**Level 3 - Build Verification**:
- Run `npm run build` - should compile middleware without errors
- Check build output for middleware edge function compilation
- Verify no warnings about missing middleware

**Level 4 - Production Readiness**:
- Deploy to preview environment (Vercel preview deployment)
- Test authentication flow in preview
- Check Vercel function logs for middleware execution

**Monitoring**:
- Existing `console.error("Auth middleware error:", error)` will surface issues
- Monitor for unexpected redirects or auth bypass

---

## Summary of Findings

| Research Area | Outcome | Impact on Implementation |
|---------------|---------|--------------------------|
| Middleware Location | Must be at `src/middleware.ts` | File relocation required |
| Config File Location | Remains at root | No change to next.config.ts |
| Code Modernization | Already using modern patterns | No code updates needed |
| Import Paths | Path aliases work from src/ | No import changes needed |
| Test Updates | Only integration tests affected | Minimal test updates |
| Verification | Multi-level testing strategy | Comprehensive validation plan |

## Implementation Impact

**Files to modify**:
- Move `./middleware.ts` → `src/middleware.ts` (file relocation)
- Update test imports in `tests/integration/middleware/auth-middleware.test.ts` (if needed)

**Files unchanged**:
- `next.config.ts` (stays at root)
- `src/lib/auth/helpers/middleware.ts` (helper functions)
- `src/lib/supabase/middleware.ts` (session logic)
- `src/lib/config/index.ts` (route configuration)
- All unit test files (no changes needed)

**Total changes**: 1 file relocation, potentially 1 test file update

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Middleware not invoked after move | Low | High | Multi-level verification strategy |
| Test failures due to import changes | Low | Medium | Run full test suite before merge |
| Deployment issues | Very Low | High | Verify in preview environment first |
| Breaking existing auth flows | Very Low | Critical | Comprehensive E2E testing |

## References

1. [Next.js Middleware Documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware)
2. [Next.js Project Structure](https://nextjs.org/docs/getting-started/project-structure)
3. [Supabase SSR for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
4. [Next.js Edge Runtime](https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes)
