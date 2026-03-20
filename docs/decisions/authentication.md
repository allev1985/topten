# Authentication

This document describes the authentication architecture used in the myfaves application.

> **Document history**
> - **Pre-2025-12-07** — Three-layer architecture with Supabase API routes (see archived sections below)
> - **2025-12-07** — Migrated to Auth Service pattern (Supabase, service-based, no HTTP routes for auth)
> - **2026-03-20** — Migrated from Supabase Auth to **BetterAuth** (MIT) with standard PostgreSQL

---

## Current Architecture (as of 2026-03-20)

### Why we moved away from Supabase

Supabase bundled auth, database, and hosting into a single managed service. This created coupling that made it difficult to:

- Own the data layer fully (RLS policies were required as a second security model alongside application-level checks)
- Run a minimal local environment without Docker images that mimic Supabase's full stack
- Switch email providers or customise token flows without working within Supabase's constraints
- Use standard PostgreSQL tooling against the auth schema (it was hidden behind Supabase's `auth.*` schema)

BetterAuth (MIT licensed) gives us full control over the auth layer while keeping a clean, service-based architecture.

### Overview

```
React Components (Client/Server)
        ↓
Server Actions (src/actions/auth-actions.ts)
        ↓
Auth Service (src/lib/auth/service.ts)   ← structured logging + error mapping
        ↓
BetterAuth (src/lib/auth/auth.ts)        ← session, token, email verification
        ↓
Drizzle ORM → PostgreSQL
```

**BetterAuth route handler** (`/api/auth/[...all]`) exposes all auth endpoints
(sign-in, sign-up, sign-out, forgot-password, reset-password, verify-email) as
a single catch-all API route managed by BetterAuth.

### Session Management

BetterAuth manages sessions entirely:

- **Session storage** — `sessions` table in PostgreSQL, token is an opaque UUID
- **Cookie** — `better-auth.session_token` (HTTP-only, Secure, SameSite=Lax)
- **Session refresh** — handled automatically by BetterAuth on each request through the API handler
- **Expiry** — configurable; defaults to 7 days

Next.js responsibilities:
- **Proxy (middleware)** — checks cookie presence for fast routing gate; uses edge-compatible cookie read only
- **Server actions / pages** — call `auth.api.getSession({ headers })` for full DB-backed session verification
- **nextCookies() plugin** — bridges BetterAuth's cookie management with Next.js's cookie APIs in server actions and server components

### Database Tables

BetterAuth owns four tables, all managed via Drizzle migrations:

| Table | Purpose |
|-------|---------|
| `users` | User identity + app profile fields (`vanitySlug`, `bio`, `deletedAt`) |
| `sessions` | Active sessions keyed by opaque token |
| `accounts` | Credential store (email/password hash, future OAuth) |
| `verifications` | Email verification and password reset tokens |

Application tables (`lists`, `places`, `list_places`) reference `users.id` (text) with application-level ownership checks replacing the old RLS policies.

### Security Model

**No Row Level Security** — RLS policies have been removed. Authorization is enforced at the application layer:
- Middleware checks cookie presence (edge-compatible routing gate)
- Server actions and pages call `auth.api.getSession()` for actual session verification
- Repository queries filter by `userId` from the verified session — this is the true authorization boundary

**Password policy** — enforced in both the Zod schema (`src/schemas/auth.ts`) and BetterAuth's `emailAndPassword` plugin:
- Minimum 12 characters
- Must contain uppercase, lowercase, number, and special character (Zod layer)

**Enumeration protection** — signup and password reset always return a generic success response regardless of whether the email exists.

**Open redirect prevention** — `redirectTo` parameters are validated by `src/lib/utils/validation/redirect.ts` before use.

### Authentication Flows

#### Sign Up

```
User submits signup form
  → signupAction() validates with Zod
  → auth service signup() calls auth.api.signUpEmail()
  → BetterAuth creates user record (databaseHooks generates vanitySlug)
  → BetterAuth sends verification email via sendEmail()
  → User redirected to /verify-email (enumeration protection — always)
  → User clicks link → GET /api/auth/verify-email?token=xxx
  → BetterAuth verifies token, sets emailVerified=true, creates session
  → User redirected to /dashboard
```

#### Login

```
User submits login form
  → loginAction() validates with Zod
  → auth service login() calls auth.api.signInEmail()
  → BetterAuth validates credentials, creates session, sets cookie
  → Redirect to /dashboard (or redirectTo param)
```

#### Password Reset

```
User submits forgot-password form
  → passwordResetRequestAction() calls auth service requestPasswordReset()
  → auth service calls auth.api.requestPasswordReset({ redirectTo: "/reset-password" })
  → BetterAuth stores one-time token in verifications table
  → BetterAuth sends email with link:
      {baseURL}/api/auth/reset-password/{token}?callbackURL=/reset-password

User clicks email link
  → GET /api/auth/reset-password/{token}  (BetterAuth catch-all handler)
  → BetterAuth looks up token in verifications table, checks expiry
  → If invalid/expired → redirects to /reset-password?error=INVALID_TOKEN
  → If valid           → redirects to /reset-password?token={token}

User submits new password on /reset-password page
  → passwordUpdateAction() calls auth service updatePassword()
  → auth service calls auth.api.resetPassword({ newPassword, token })
  → User redirected to /login
```

The intermediate hop through `/api/auth/reset-password/:token` is intentional — it is BetterAuth's token validation gate. The raw verification token from the email is validated and consumed before the reset page renders, so the page only ever receives a pre-validated token. Linking the email directly to `/reset-password` would require the page to perform its own token lookup, which would bypass BetterAuth's built-in expiry and single-use enforcement.

#### Authenticated Password Change

```
User submits change-password form (settings page)
  → passwordChangeAction() calls requireAuth() to verify session
  → auth service changePassword() calls auth.api.changePassword({ currentPassword, newPassword })
  → BetterAuth verifies currentPassword before updating
  → Other sessions revoked
```

### Route Protection

Middleware (`src/proxy.ts`) checks for the `better-auth.session_token` cookie:
- **Present** → allow request through; individual pages verify session fully
- **Absent** → redirect to `/login?redirectTo=<original-path>`

Protected routes: `/dashboard`, `/settings`
Public routes: `/`, `/login`, `/signup`, `/verify-email`, `/forgot-password`, `/reset-password`, `/auth`

### Local Development

```bash
pnpm dev:start   # Start postgres (5432) + Mailhog SMTP (1025)
pnpm dev:email   # Open Mailhog web UI — all emails land here
pnpm db:migrate  # Apply migrations (run once after dev:start)
pnpm dev         # Start Next.js dev server
```

Environment:

```
AUTH_SECRET=<openssl rand -base64 32>
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/topten
SMTP_HOST=localhost
SMTP_PORT=1025
```

---

## Historical: Auth Service Pattern (2025-12-07 → 2026-03-20)

The application previously used Supabase Auth with a service-based architecture:

```
UI Components → Server Actions → Auth Service → Supabase SDK → Supabase (Postgres + Auth)
```

Supabase managed session tokens, email verification (OTP + PKCE), and password resets.
RLS policies on all tables enforced data access at the database level.
The `auth.users` table (Supabase-managed) was joined with the application `users` table
via a trigger that auto-created profile rows on signup.

This was replaced because of the reasons outlined at the top of this document.

---

## Historical: Three-Layer API Route Architecture (pre-2025-12-07)

The original implementation used HTTP API routes for all auth operations:

| Route | Status |
|-------|--------|
| `POST /api/auth/signup` | Removed 2025-12-07 |
| `POST /api/auth/login` | Removed 2025-12-07 |
| `POST /api/auth/logout` | Removed 2025-12-07 |
| `POST /api/auth/refresh` | Removed 2025-12-07 |
| `POST /api/auth/password/reset` | Removed 2025-12-07 |
| `PUT /api/auth/password` | Removed 2025-12-07 |
| `GET /api/auth/session` | Removed 2025-12-07 |
| `GET /api/auth/verify` | Removed 2026-03-20 (replaced by BetterAuth's handler) |

Migrated to service-based architecture for performance (no HTTP overhead), type safety, and simplicity.
