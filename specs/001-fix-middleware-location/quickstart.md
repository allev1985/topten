# Developer Quickstart: Middleware Location Fix

**Feature**: 001-fix-middleware-location  
**Date**: 2025-12-07  
**Audience**: Developers working on authentication and routing

## What Changed

The Next.js middleware file has been relocated from the project root to the `src/` directory to ensure proper invocation by the Next.js framework.

**Before**:
```
./middleware.ts          ← Wrong location for src-based projects
src/
  ├── app/
  ├── lib/
  └── components/
```

**After**:
```
next.config.ts           ← Config stays at root
src/
  ├── middleware.ts      ← Correct location
  ├── app/
  ├── lib/
  └── components/
```

## Why This Matters

### The Problem
When using Next.js with a `src/` directory, the framework only recognizes middleware at `src/middleware.ts`. Having middleware at the root caused it to be silently ignored, leaving protected routes (like `/dashboard`) unprotected.

### The Solution
Moving `middleware.ts` to `src/middleware.ts` ensures:
- ✅ Middleware is properly invoked for all requests
- ✅ Protected routes require authentication
- ✅ Unauthenticated users are redirected to login
- ✅ Sessions are automatically refreshed

## How Authentication Works

### Protected Routes
Routes that require authentication (defined in `src/lib/config/index.ts`):
- `/dashboard` and all sub-routes
- `/settings` and all sub-routes

### Public Routes
Routes accessible without authentication:
- `/` (homepage)
- `/login`, `/signup`
- `/verify-email`, `/forgot-password`, `/reset-password`
- `/auth` (callback routes)

### Middleware Flow

```
User requests /dashboard
         ↓
Middleware checks: Is this a public route?
         ↓ No
Check Supabase session
         ↓
Session valid? → Yes → Allow access
         ↓ No
Redirect to /login?redirectTo=/dashboard
```

## Testing Locally

### 1. Verify Middleware is Active

**Test unauthenticated access**:
```bash
# Start dev server
npm run dev

# Open browser in incognito mode
# Navigate to: http://localhost:3000/dashboard
# Expected: Redirect to /login?redirectTo=/dashboard
```

**Test authenticated access**:
```bash
# Log in with valid credentials
# Navigate to: http://localhost:3000/dashboard
# Expected: Dashboard loads without redirect
```

### 2. Run Test Suite

**Unit tests** (helper functions):
```bash
npm test -- tests/unit/lib/auth/helpers/middleware.test.ts
npm test -- tests/unit/lib/supabase/middleware.test.ts
```

**Integration tests** (middleware behavior):
```bash
npm test -- tests/integration/middleware/auth-middleware.test.ts
```

**E2E tests** (full auth flow):
```bash
npm run test:e2e
```

### 3. Verify Build

```bash
npm run build
# Look for: "Compiled middleware" or edge function output
# Should complete without warnings
```

## Troubleshooting

### Issue: Routes still unprotected after move

**Check**:
1. Middleware file is at `src/middleware.ts` (not root)
2. No typos in filename (must be exactly `middleware.ts`)
3. Clear `.next` folder and rebuild: `rm -rf .next && npm run dev`

### Issue: TypeScript import errors

**Check**:
- `tsconfig.json` has correct path mapping: `"@/*": ["./src/*"]`
- All imports use `@/` prefix consistently
- Run `npm run typecheck` to verify

### Issue: Tests failing after move

**Check**:
- Integration tests import from correct path
- Mock setups don't hard-code old middleware location
- Run full suite: `npm test`

## Developer Notes

### Adding New Protected Routes

Edit `src/lib/config/index.ts`:
```typescript
export const PROTECTED_ROUTES = [
  "/dashboard", 
  "/settings",
  "/admin",  // ← Add new protected route
] as const;
```

### Adding New Public Routes

Edit `src/lib/config/index.ts`:
```typescript
export const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/about",  // ← Add new public route
] as const;
```

### Customizing Redirect Behavior

The redirect logic is in `src/lib/auth/helpers/middleware.ts`:
```typescript
export function createLoginRedirect(
  request: NextRequest,
  originalPath: string
): NextResponse {
  const loginUrl = new URL("/login", request.url);
  const validatedRedirect = getValidatedRedirect(originalPath);
  loginUrl.searchParams.set("redirectTo", validatedRedirect);
  return NextResponse.redirect(loginUrl);
}
```

### Session Refresh

Automatic session refresh is handled by `updateSession()` from `src/lib/supabase/middleware.ts`. This runs for both protected and public routes to maintain session validity.

## File Structure Reference

```
src/
├── middleware.ts                           # Main middleware (moved here)
├── app/                                    # Next.js pages
│   ├── (auth)/                            # Public auth pages
│   │   ├── login/
│   │   └── signup/
│   ├── dashboard/                         # Protected
│   └── settings/                          # Protected
├── lib/
│   ├── auth/
│   │   └── helpers/
│   │       └── middleware.ts              # Helper functions
│   ├── supabase/
│   │   └── middleware.ts                  # Session update
│   ├── config/
│   │   └── index.ts                       # Route config
│   └── utils/
│       └── validation/
│           └── redirect.ts                # RedirectTo validation
└── components/

tests/
├── integration/
│   └── middleware/
│       └── auth-middleware.test.ts        # Integration tests
└── unit/
    └── lib/
        ├── auth/helpers/
        │   └── middleware.test.ts         # Unit tests
        └── supabase/
            └── middleware.test.ts         # Unit tests
```

## Next Steps

1. ✅ Middleware relocated to correct location
2. ✅ Tests updated and passing
3. ✅ Local verification complete
4. 🔄 Deploy to preview environment
5. 🔄 Verify in preview
6. 🔄 Merge to main

## Related Documentation

- [Feature Specification](./spec.md)
- [Implementation Plan](./plan.md)
- [Research Findings](./research.md)
- [Next.js Middleware Docs](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Supabase SSR Auth](https://supabase.com/docs/guides/auth/server-side/nextjs)

## Questions?

For questions or issues related to this change:
1. Check the [research.md](./research.md) for detailed technical decisions
2. Review existing middleware tests for usage examples
3. Refer to the [TopTen Constitution](../../.specify/memory/constitution.md) for code standards
