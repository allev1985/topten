# Data Model: Auth-Aware Landing Page

**Feature**: 001-auth-landing-page  
**Date**: 2025-12-04  
**Status**: Complete

## Overview

This document defines the data structures and interfaces used for authentication state management in the landing page feature. The model is intentionally minimal, focusing on type safety and serialization compatibility between Server and Client Components.

---

## Core Entities

### 1. Authentication State

**Purpose**: Represents whether a user is currently authenticated

**Type**: `boolean` (primitive)

**Characteristics**:
- Serializable (required for Server → Client Component props)
- Derived from Supabase `User` object server-side
- Single source of truth for rendering decisions
- Stateless (computed on each page load)

**Transformation Logic**:
```typescript
// Server Component
const { data: { user } } = await supabase.auth.getUser();
const isAuthenticated = !!user; // boolean conversion
```

**Rationale**:
- Simplest possible data type that meets requirements
- Prevents serialization issues with complex objects
- No need for user details in initial landing page render
- Future features can fetch user data separately if needed

---

## Component Interfaces

### 2. LandingPageClient Props

**Interface Definition**:
```typescript
/**
 * Props for the LandingPageClient component
 * 
 * This interface defines the data contract between the Server Component (page.tsx)
 * and the Client Component (LandingPageClient.tsx)
 */
interface LandingPageClientProps {
  /**
   * Whether the current user is authenticated
   * 
   * - true: User has valid session, show authenticated content/navigation
   * - false: User is guest, show signup/login options
   * 
   * Derived server-side from Supabase auth.getUser() result
   */
  isAuthenticated: boolean;
}
```

**Usage Example**:
```typescript
// Server Component (src/app/page.tsx)
export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAuthenticated = !!user;
  
  return <LandingPageClient isAuthenticated={isAuthenticated} />;
}

// Client Component (src/components/shared/LandingPageClient.tsx)
'use client';

export default function LandingPageClient({ isAuthenticated }: LandingPageClientProps) {
  return (
    <div>
      {isAuthenticated ? (
        <nav>{/* Authenticated navigation */}</nav>
      ) : (
        <nav>{/* Guest navigation with login/signup */}</nav>
      )}
      {/* Shared content */}
    </div>
  );
}
```

**Validation Rules**:
- `isAuthenticated` is required (not optional)
- Must be a boolean (TypeScript enforces this)
- No runtime validation needed (TypeScript compile-time check)

---

## Data Flow

### Server-Side Flow

```
1. User requests `/`
   ↓
2. Middleware refreshes session (if needed)
   ↓
3. Server Component (page.tsx) executes:
   - Calls createClient() from @/lib/supabase/server
   - Calls supabase.auth.getUser()
   - Receives User object or null
   ↓
4. Transform to boolean:
   - isAuthenticated = !!user
   ↓
5. Pass to Client Component:
   - <LandingPageClient isAuthenticated={isAuthenticated} />
   ↓
6. Server renders with auth-appropriate content
   ↓
7. HTML sent to client (no hydration mismatch)
```

### Error Handling Flow

```
1. Auth check fails (network error, invalid token, etc.)
   ↓
2. getUser() returns { data: { user: null }, error: Error }
   ↓
3. Graceful fallback:
   - isAuthenticated = !!null = false
   ↓
4. Render as non-authenticated user
   ↓
5. User sees guest experience (fail-closed security)
```

**Rationale for Error Handling**:
- Fail-closed: When in doubt, treat as unauthenticated
- Better UX than error page for transient auth issues
- User can still access login/signup if needed
- Logging can track auth errors separately

---

## State Transitions

### User Authentication States

```
┌─────────────────────┐
│  Non-Authenticated  │ ← Initial state for new visitors
│ isAuthenticated=false│
└─────────────────────┘
          │
          │ User logs in via /login
          ↓
┌─────────────────────┐
│   Authenticated     │
│ isAuthenticated=true│
└─────────────────────┘
          │
          │ User logs out
          ↓
┌─────────────────────┐
│  Non-Authenticated  │
│ isAuthenticated=false│
└─────────────────────┘
```

**Note**: These transitions happen outside the landing page component. The landing page simply reflects the current state on each page load.

---

## Extended Types (Future Consideration)

The current implementation uses a simple boolean, but future enhancements might include:

### Possible Future Extensions (NOT in current scope)

```typescript
// Example: Extended auth state (NOT IMPLEMENTED)
interface ExtendedAuthState {
  isAuthenticated: boolean;
  hasCompletedProfile?: boolean;
  userRole?: 'creator' | 'viewer';
  subscriptionTier?: 'free' | 'pro';
}
```

**Why Not Implemented Now**:
- YAGNI (You Aren't Gonna Need It) principle
- Current requirements only need boolean
- Future features can extend when needed
- Keeps initial implementation simple

---

## Type Safety

### TypeScript Configuration

Uses existing project TypeScript configuration:
- Strict mode enabled (`tsconfig.json`)
- Type checking enforced at compile time
- Props must match interface exactly

### Runtime Safety

No runtime prop validation needed because:
- TypeScript ensures type correctness at compile time
- Boolean is a primitive (no parsing/validation needed)
- Server Component controls prop generation (trusted source)

### Testing Impact

Type safety simplifies testing:
```typescript
// Component test
const { container } = render(
  <LandingPageClient isAuthenticated={true} />
);
// TypeScript error if prop is wrong type

// Unit test
const isAuthenticated = !!mockUser; // Type: boolean
expect(typeof isAuthenticated).toBe('boolean');
```

---

## Relationship to Existing Data Models

### Integration with Supabase User Model

```typescript
// Supabase User type (from @supabase/supabase-js)
interface User {
  id: string;
  email?: string;
  // ... many other fields
}

// Our transformation
type AuthState = boolean; // Simplified from User | null → boolean
```

**Why This Separation**:
- Landing page doesn't need full user details
- Prevents over-fetching data
- Reduces serialization complexity
- Future components can fetch User object if needed

### No Database Schema Changes

This feature does NOT require:
- New database tables
- Schema migrations
- Drizzle ORM changes

All data comes from existing Supabase auth system.

---

## Performance Characteristics

### Memory Footprint
- Boolean: 1 bit (in practice, 1 byte in JavaScript)
- No complex objects to serialize/deserialize
- Minimal memory impact

### Computation Cost
- Boolean conversion: `!!user` is O(1)
- No additional processing needed
- Near-zero performance overhead

---

## Validation & Constraints

### Server-Side Constraints
- Must call `getUser()` (not `getSession()`) for security
- Must handle `null` user gracefully
- Must pass serializable value to client

### Client-Side Constraints
- Must accept boolean prop
- Must not modify auth state client-side
- Must render consistently based on prop (no hydration errors)

---

## Summary Table

| Entity | Type | Source | Purpose | Serializable? |
|--------|------|--------|---------|---------------|
| **isAuthenticated** | `boolean` | Server: `!!user` | Auth state indicator | ✅ Yes |
| **User** (internal) | `User \| null` | Supabase `getUser()` | Raw auth data | ❌ No (not passed to client) |

---

## Decision Records

### DR-001: Use Boolean Instead of User Object

**Context**: Need to pass auth state from Server to Client Component

**Decision**: Pass `isAuthenticated: boolean` instead of `user: User | null`

**Rationale**:
- Serialization: Boolean is always serializable, User object is complex
- Privacy: Avoids exposing user details to client unnecessarily
- Simplicity: Client only needs to know authenticated/not authenticated
- Performance: Smaller data transfer, faster serialization

**Status**: Accepted

---

### DR-002: No Caching of Auth State

**Context**: Could cache auth state to improve performance

**Decision**: Do NOT cache auth state; compute on each request

**Rationale**:
- Security: Ensures always-fresh auth status
- Simplicity: No cache invalidation logic needed
- Performance: Auth check is already fast (<200ms)
- Correctness: Prevents stale auth state bugs

**Status**: Accepted

---

## Appendix: Type Definitions

```typescript
// File: src/components/shared/LandingPageClient.tsx

/**
 * Props interface for LandingPageClient component
 * 
 * @interface LandingPageClientProps
 * @property {boolean} isAuthenticated - Whether user has valid session
 */
export interface LandingPageClientProps {
  /** 
   * Authentication status of current user
   * Computed server-side from Supabase auth.getUser() result
   */
  isAuthenticated: boolean;
}
```

**Data Model Complete** ✅
