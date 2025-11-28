# Data Model: Supabase Configuration & Environment Setup

**Feature Branch**: `001-supabase-auth-setup`
**Date**: 2025-11-28
**Status**: Complete

## Overview

This feature establishes TypeScript types for authentication objects. These are not database entities but TypeScript interfaces that provide type safety for Supabase authentication responses.

## Entities

### AuthUser

Represents an authenticated user from Supabase Auth.

**Source**: Re-exported from `@supabase/supabase-js` (originally `User` from `@supabase/auth-js`)

**Key Properties** (from Supabase):
| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique identifier (UUID) |
| `email` | `string \| undefined` | User's email address |
| `email_confirmed_at` | `string \| undefined` | Timestamp of email verification |
| `phone` | `string \| undefined` | User's phone number |
| `created_at` | `string` | Account creation timestamp |
| `updated_at` | `string` | Last update timestamp |
| `app_metadata` | `object` | Application metadata (provider info) |
| `user_metadata` | `object` | User-editable metadata |

**Usage Context**: Server Components, API Routes, Middleware

---

### AuthSession

Represents an active authentication session.

**Source**: Re-exported from `@supabase/supabase-js` (originally `Session` from `@supabase/auth-js`)

**Key Properties** (from Supabase):
| Property | Type | Description |
|----------|------|-------------|
| `access_token` | `string` | JWT access token |
| `refresh_token` | `string` | Token for refreshing the session |
| `expires_in` | `number` | Seconds until access token expires |
| `expires_at` | `number \| undefined` | Unix timestamp of expiration |
| `token_type` | `string` | Token type (typically "bearer") |
| `user` | `AuthUser` | Associated user object |

**Usage Context**: Session management, token refresh in middleware

---

### AuthError

Application-specific error type for authentication failures.

**Source**: Defined in `/src/types/auth.ts`

**Properties**:
| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `code` | `string` | Yes | Error code (e.g., `invalid_credentials`, `session_expired`) |
| `message` | `string` | Yes | Human-readable error message |
| `status` | `number \| undefined` | No | HTTP status code if applicable |

**Usage Context**: Error handling across authentication flows

---

### AuthState

Discriminated union type for authentication state.

**Source**: Defined in `/src/types/auth.ts`

**Variants**:
```typescript
type AuthState =
  | { status: 'authenticated'; user: AuthUser; session: AuthSession }
  | { status: 'unauthenticated'; user: null; session: null }
  | { status: 'loading'; user: null; session: null };
```

**Usage Context**: UI state management, conditional rendering

---

## Environment Configuration Entity

### EnvConfig

Runtime configuration validated at startup.

**Source**: `/src/lib/env.ts` (exists)

**Properties**:
| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `string` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `string` | Yes | Supabase anonymous API key |
| `SUPABASE_SERVICE_ROLE_KEY` | `string` | Yes | Supabase service role key (server-side only) |
| `DATABASE_URL` | `string` | Yes | PostgreSQL connection string |
| `GOOGLE_PLACES_API_KEY` | `string \| undefined` | No | Google Places API key |

**Validation Rules**:
- Required fields must be present and non-empty
- `NEXT_PUBLIC_SUPABASE_URL` must be a valid URL format

---

## Type Definitions

### /src/types/auth.ts

```typescript
/**
 * Authentication types for YourFavs application.
 * Re-exports Supabase types with application-specific extensions.
 */

// Re-export Supabase auth types
export type { User as AuthUser, Session as AuthSession } from "@supabase/supabase-js";

/**
 * Application-specific authentication error type.
 */
export interface AuthError {
  /** Error code for programmatic handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** HTTP status code if applicable */
  status?: number;
}

/**
 * Discriminated union for authentication state.
 * Useful for UI state management and conditional rendering.
 */
export type AuthState =
  | {
      status: "authenticated";
      user: AuthUser;
      session: AuthSession;
    }
  | { status: "unauthenticated"; user: null; session: null }
  | { status: "loading"; user: null; session: null };

/**
 * Result type for authentication operations.
 */
export type AuthResult<T> =
  | { success: true; data: T }
  | { success: false; error: AuthError };
```

---

## Relationships

```
┌─────────────┐
│  AuthUser   │◄─────┐
└─────────────┘      │ contains
                     │
┌─────────────┐      │
│ AuthSession │──────┘
└─────────────┘

┌─────────────┐
│  AuthState  │ references AuthUser & AuthSession
└─────────────┘

┌─────────────┐
│  EnvConfig  │ configures Supabase client creation
└─────────────┘
```

## Migration Notes

No database migrations required - this feature defines TypeScript types only.
