# Quickstart Guide: Supabase Configuration & Environment Setup

**Feature Branch**: `001-supabase-auth-setup`
**Date**: 2025-11-28

## Overview

This guide explains how to use the Supabase authentication utilities in the YourFavs application.

## Prerequisites

1. **Environment Variables**: Ensure your `.env.local` file contains:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   DATABASE_URL=your-database-url
   ```

2. **Dependencies**: Already installed via `pnpm install`:
   - `@supabase/ssr` (v0.8.0+)
   - `@supabase/supabase-js` (v2.86.0+)

## Quick Start

### 1. Import Auth Types

```typescript
import type { AuthUser, AuthSession, AuthError, AuthState } from "@/types/auth";
```

### 2. Using the Browser Client (Client Components)

```typescript
"use client";

import { createClient } from "@/lib/supabase/client";

export function LoginButton() {
  const supabase = createClient();

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "user@example.com",
      password: "password",
    });

    if (error) {
      console.error("Login failed:", error.message);
      return;
    }

    console.log("Logged in as:", data.user?.email);
  };

  return <button onClick={handleLogin}>Login</button>;
}
```

### 3. Using the Server Client (Server Components)

```typescript
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div>
      <h1>Welcome, {user.email}</h1>
    </div>
  );
}
```

### 4. Setting Up Middleware (Session Refresh)

Create or update `middleware.ts` in your project root:

```typescript
import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

### 5. Using Auth State Types

```typescript
import type { AuthState } from "@/types/auth";

// Example: Track auth state in a component
const [authState, setAuthState] = useState<AuthState>({
  status: "loading",
  user: null,
  session: null,
});

// After checking auth status:
if (user && session) {
  setAuthState({ status: "authenticated", user, session });
} else {
  setAuthState({ status: "unauthenticated", user: null, session: null });
}
```

## Common Patterns

### Checking if User is Authenticated (Server)

```typescript
import { createClient } from "@/lib/supabase/server";

export async function isAuthenticated(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user !== null;
}
```

### Getting Current User (Server)

```typescript
import { createClient } from "@/lib/supabase/server";
import type { AuthUser } from "@/types/auth";

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
```

### Handling Auth Errors

```typescript
import type { AuthError } from "@/types/auth";

function handleAuthError(error: AuthError) {
  switch (error.code) {
    case "invalid_credentials":
      return "Invalid email or password";
    case "session_expired":
      return "Your session has expired. Please log in again.";
    default:
      return error.message;
  }
}
```

## File Structure

```
src/
├── lib/
│   ├── env.ts                    # Environment validation
│   └── supabase/
│       ├── client.ts             # Browser client
│       ├── server.ts             # Server client
│       └── middleware.ts         # Middleware helper
└── types/
    └── auth.ts                   # Auth TypeScript types

middleware.ts                     # Next.js middleware (uses updateSession)
```

## Troubleshooting

### "Missing required environment variable" Error

1. Check your `.env.local` file exists
2. Verify all required variables are set
3. Restart your development server (`pnpm dev`)

### Session Not Persisting

1. Ensure middleware is set up in `middleware.ts`
2. Check that the matcher pattern includes your routes
3. Verify cookies are not being blocked by browser settings

### TypeScript Errors with Auth Types

1. Import types from `@/types/auth` (not directly from Supabase)
2. Ensure your `tsconfig.json` includes the path alias: `"@/*": ["./src/*"]`

## Testing

Run unit tests to verify setup:

```bash
pnpm test tests/unit/lib/supabase/
pnpm test tests/unit/lib/env.test.ts
```

Run with coverage:

```bash
pnpm test:coverage
```

## Next Steps

After completing this setup, you can:

1. **Task 1.2**: Implement Login/Logout API routes
2. **Task 1.3**: Create Session Management utilities
3. **Task 1.4**: Build Protected Route components
