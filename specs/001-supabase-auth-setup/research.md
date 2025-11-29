# Research: Supabase Configuration & Environment Setup

**Feature Branch**: `001-supabase-auth-setup`
**Date**: 2025-11-28
**Status**: Complete

## Research Areas

### 1. Supabase SSR Middleware Pattern

**Question**: How should the middleware helper create and configure Supabase clients for Next.js middleware?

**Decision**: Use `createServerClient` from `@supabase/ssr` with `getAll` and `setAll` cookie methods that work with Next.js `NextRequest` and `NextResponse` objects.

**Rationale**:

- The `@supabase/ssr` v0.8.0 documentation explicitly states that `getAll` and `setAll` are the recommended approach (deprecated `get`, `set`, `remove` pattern has edge case issues)
- Middleware must be able to both read cookies from the request and set cookies on the response
- This pattern allows session refresh without requiring page reload

**Alternatives Considered**:

1. Using deprecated `get`, `set`, `remove` methods - Rejected: Not recommended, difficult to use correctly, doesn't cover edge cases
2. Using browser client in middleware - Rejected: Browser client cannot access cookies in middleware context

**Implementation Pattern**:

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session
  await supabase.auth.getUser();

  return supabaseResponse;
}
```

---

### 2. TypeScript Auth Types

**Question**: What TypeScript types should be defined for authentication responses?

**Decision**: Re-export and extend types from `@supabase/supabase-js` for `User`, `Session`, and `AuthError`, creating application-specific wrappers for consistent typing.

**Rationale**:

- `@supabase/supabase-js` already exports `AuthUser` and `AuthSession` types from `@supabase/auth-js`
- Creating wrapper types allows for application-specific extensions if needed
- Re-exporting provides a single import point for auth types

**Types to Define**:

1. **AuthUser**: Re-export from `@supabase/supabase-js` with alias
2. **AuthSession**: Re-export from `@supabase/supabase-js` with alias
3. **AuthError**: Create application-specific error type for consistent error handling
4. **AuthState**: Union type for authentication state (`authenticated`, `unauthenticated`, `loading`)

**Alternatives Considered**:

1. Defining completely custom types - Rejected: Would require manual synchronization with Supabase types
2. Using Supabase types directly everywhere - Rejected: No central import point, harder to extend

---

### 3. Environment Validation Best Practices

**Question**: How should environment validation work for Supabase configuration?

**Decision**: The existing `validateEnv()` function in `/src/lib/env.ts` follows best practices. Enhance with:

- Empty string validation (treat empty as missing)
- URL format validation for `NEXT_PUBLIC_SUPABASE_URL`

**Rationale**:

- Current implementation uses lazy-loading pattern (validates on first access)
- Error messages are clear and actionable
- Adding empty string checks addresses edge case from spec

**Current Implementation Review**:

- ✅ Required env vars throw with clear messages
- ✅ Optional env vars return undefined
- ✅ Lazy-loaded singleton pattern prevents repeated validation
- ⚠️ Missing: Empty string validation
- ⚠️ Missing: URL format validation (optional, can be deferred)

**Enhancements Needed**:

```typescript
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    // Add empty string check
    throw new Error(
      `Missing required environment variable: ${key}. ` +
        `Please check your .env.local file or environment configuration.`
    );
  }
  return value;
}

// Optional: URL validation for Supabase URL
function validateSupabaseUrl(url: string): string {
  try {
    new URL(url);
  } catch {
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL: "${url}". ` +
        `Please provide a valid URL.`
    );
  }
  return url;
}
```

---

### 4. Testing Strategy for Supabase Clients

**Question**: How should Supabase clients be unit tested given they depend on external services?

**Decision**: Mock the `@supabase/ssr` module functions and environment variables to test client creation logic without external dependencies.

**Rationale**:

- Unit tests should not depend on external services
- Mocking allows testing of error conditions and edge cases
- Focus tests on correct configuration passing and error handling

**Testing Patterns**:

1. **Client creation tests**: Mock `createBrowserClient`/`createServerClient` and verify correct env vars are passed
2. **Environment validation tests**: Set/unset env vars to test validation logic
3. **Middleware helper tests**: Mock request/response objects to test cookie handling

**Coverage Target**: >65% as specified in FR-010

**Test Structure**:

```
tests/unit/
├── lib/
│   ├── env.test.ts              # Environment validation tests
│   └── supabase/
│       ├── client.test.ts       # Browser client tests
│       ├── server.test.ts       # Server client tests
│       └── middleware.test.ts   # Middleware helper tests
```

---

### 5. Cookie Handling in Next.js Middleware

**Question**: How do cookies work differently in Next.js middleware vs Server Components?

**Decision**: Middleware has direct access to `NextRequest.cookies` and can set cookies on `NextResponse`, while Server Components use `cookies()` from `next/headers`.

**Rationale**:

- Middleware runs before the request reaches the page/component
- Server Components run during render phase
- Cookie access patterns are fundamentally different

**Key Differences**:
| Context | Read Cookies | Write Cookies |
|---------|--------------|---------------|
| Middleware | `request.cookies.getAll()` | `response.cookies.set()` |
| Server Component | `(await cookies()).getAll()` | `(await cookies()).set()` (may silently fail) |
| Browser Client | Via browser's cookie API | Via browser's cookie API |

---

## Summary of Decisions

| Area               | Decision                                               | Impact                           |
| ------------------ | ------------------------------------------------------ | -------------------------------- |
| Middleware Pattern | Use `getAll`/`setAll` with `createServerClient`        | Reliable session refresh         |
| TypeScript Types   | Re-export + extend Supabase types                      | Type safety, single import point |
| Env Validation     | Enhance existing with empty string check               | Better error handling            |
| Testing            | Mock Supabase modules, test config passing             | >65% coverage achievable         |
| Cookie Handling    | Different patterns for middleware vs Server Components | Clear separation of concerns     |

## Open Questions

None - all research questions resolved.
