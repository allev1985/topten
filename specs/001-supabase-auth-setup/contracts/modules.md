# API Contracts: Supabase Configuration & Environment Setup

**Feature Branch**: `001-supabase-auth-setup`
**Date**: 2025-11-28
**Status**: Complete

## Overview

This feature does not expose REST/GraphQL API endpoints. Instead, it provides internal TypeScript module contracts for authentication utilities.

## Module Contracts

### 1. Browser Client Module

**Path**: `/src/lib/supabase/client.ts`

**Exports**:

```typescript
/**
 * Creates a Supabase client for browser-side operations.
 * Must only be called from client components.
 *
 * @returns SupabaseClient instance configured for browser use
 * @throws Error if environment variables are not configured
 */
export function createClient(): SupabaseClient;
```

**Usage Context**: Client Components (`"use client"`)

---

### 2. Server Client Module

**Path**: `/src/lib/supabase/server.ts`

**Exports**:

```typescript
/**
 * Creates a Supabase client for server-side operations.
 * Manages authentication cookies via next/headers.
 *
 * @returns Promise<SupabaseClient> configured for server use with cookie management
 * @throws Error if environment variables are not configured
 */
export async function createClient(): Promise<SupabaseClient>;
```

**Usage Context**: Server Components, Route Handlers, Server Actions

---

### 3. Middleware Helper Module

**Path**: `/src/lib/supabase/middleware.ts`

**Exports**:

```typescript
/**
 * Updates the user session by refreshing tokens if needed.
 * Must be called from Next.js middleware.
 *
 * @param request - The incoming Next.js request
 * @returns NextResponse with updated cookies
 */
export async function updateSession(
  request: NextRequest
): Promise<NextResponse>;
```

**Usage Context**: Next.js Middleware (`middleware.ts`)

---

### 4. Auth Types Module

**Path**: `/src/types/auth.ts`

**Exports**:

```typescript
// Re-exported from @supabase/supabase-js
export type { User as AuthUser, Session as AuthSession };

// Application-specific types
export interface AuthError {
  code: string;
  message: string;
  status?: number;
}

export type AuthState =
  | { status: "authenticated"; user: AuthUser; session: AuthSession }
  | { status: "unauthenticated"; user: null; session: null }
  | { status: "loading"; user: null; session: null };

export type AuthResult<T> =
  | { success: true; data: T }
  | { success: false; error: AuthError };
```

**Usage Context**: Type annotations throughout the application

---

### 5. Environment Validation Module

**Path**: `/src/lib/env.ts`

**Exports**:

```typescript
/**
 * Configuration type for validated environment variables.
 */
export type EnvConfig = {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  DATABASE_URL: string;
  GOOGLE_PLACES_API_KEY?: string;
};

/**
 * Validates all required environment variables.
 * @throws Error with actionable message if any required variable is missing or empty
 * @returns EnvConfig with validated values
 */
export function validateEnv(): EnvConfig;

/**
 * Returns validated environment configuration (lazy-loaded singleton).
 * First call validates; subsequent calls return cached value.
 * @throws Error if any required variable is missing or empty
 * @returns EnvConfig with validated values
 */
export function getEnv(): EnvConfig;
```

**Usage Context**: Application startup, Supabase client initialization

---

## Error Contracts

### Environment Validation Errors

| Condition                 | Error Message                                                                                                   |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Missing required variable | `Missing required environment variable: {KEY}. Please check your .env.local file or environment configuration.` |
| Empty required variable   | `Missing required environment variable: {KEY}. Please check your .env.local file or environment configuration.` |

### Auth Error Codes

| Code                   | Description                                     | HTTP Status |
| ---------------------- | ----------------------------------------------- | ----------- |
| `invalid_credentials`  | Email/password combination invalid              | 401         |
| `session_expired`      | Session has expired, requires re-authentication | 401         |
| `session_not_found`    | No session exists                               | 401         |
| `token_refresh_failed` | Failed to refresh access token                  | 401         |
| `email_not_verified`   | Email verification required                     | 403         |

---

## Integration Points

### Middleware Integration

```typescript
// middleware.ts (Next.js middleware entry point)
import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Match all paths except static files and API routes
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

### Server Component Integration

```typescript
// Example Server Component usage
import { createClient } from "@/lib/supabase/server";
import type { AuthUser } from "@/types/auth";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // user is typed as AuthUser | null
  if (!user) {
    redirect("/login");
  }

  return <div>Welcome, {user.email}</div>;
}
```

### Client Component Integration

```typescript
// Example Client Component usage
"use client";

import { createClient } from "@/lib/supabase/client";
import type { AuthState } from "@/types/auth";

export function AuthButton() {
  const [authState, setAuthState] = useState<AuthState>({
    status: "loading",
    user: null,
    session: null,
  });

  // ... implementation
}
```
