# Authentication & Session Management — Security Architecture Review

**Branch:** `security/auth-review`
**Date:** 2026-03-20
**Scope:** Sign-in / login flows, MFA, session lifecycle, password reset, route protection
**Reviewer role:** Senior AppSec engineer — Zero Trust / OWASP focus

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Authentication Flows](#2-authentication-flows)
3. [Session Lifecycle](#3-session-lifecycle)
4. [Route Protection Model](#4-route-protection-model)
5. [Input Validation & Error Handling](#5-input-validation--error-handling)
6. [Positive Security Findings](#6-positive-security-findings)
7. [Critical Areas of Concern](#7-critical-areas-of-concern)
8. [STRIDE Threat Summary](#8-stride-threat-summary)

---

## 1. Architecture Overview

The application uses **BetterAuth v1.5.5** as the auth framework, backed by PostgreSQL via Drizzle ORM. The auth layer follows a service-based architecture — no auth logic is co-located with UI components or exposed over HTTP routes beyond BetterAuth's own catch-all handler.

```
Browser
  │
  ├─ GET /dashboard/* ──→ proxy.ts (Edge)
  │                           │ cookie presence check
  │                           ↓
  │                       Next.js page (Server Component)
  │                           │ auth.api.getSession() — full DB verify
  │
  ├─ POST /api/auth/[...all] ──→ BetterAuth handler (route.ts)
  │                               (session creation, OTP endpoints)
  │
  └─ Server Actions ──→ src/actions/auth-actions.ts
                             │ Zod validation
                             ↓
                        src/lib/auth/service.ts
                             │ thin wrapper + structured logging
                             ↓
                        auth.api.* (BetterAuth)
                             │
                             ↓
                        PostgreSQL (users, sessions, verifications, accounts, twoFactors)
```

### Key files

| File | Role |
|---|---|
| `src/lib/auth/auth.ts` | BetterAuth instance — single source of truth |
| `src/lib/auth/service.ts` | Service wrapper: logging, error mapping, auth.api calls |
| `src/lib/auth/errors.ts` | Error class and BetterAuth error detection functions |
| `src/actions/auth-actions.ts` | Server actions — form submission handlers |
| `src/proxy.ts` | Edge middleware — fast cookie-presence gate |
| `src/lib/auth/helpers/middleware.ts` | Route classification helpers for proxy |
| `src/lib/utils/validation/redirect.ts` | Open-redirect prevention |
| `src/schemas/auth.ts` | Zod validation schemas for all auth forms |
| `next.config.ts` | Next.js configuration — no security headers defined |

### Database tables

| Table | Purpose |
|---|---|
| `users` | User identity, `emailVerified`, `twoFactorEnabled`, `vanitySlug`, `deletedAt` |
| `sessions` | Active sessions: `token` (unique), `expiresAt`, `userId`, `ipAddress`, `userAgent` |
| `accounts` | Credential records — `password` hash managed by BetterAuth |
| `verifications` | Time-limited tokens for email verification, password reset, and OTPs |
| `twoFactors` | Required by BetterAuth's twoFactor plugin schema (secret/backupCodes unused for email OTP) |

---

## 2. Authentication Flows

### 2.1 Standard Login (Email + Password)

```
User submits login form
  → loginAction() validates with loginSchema (Zod)
  → login() service calls auth.api.signInEmail()
  → BetterAuth checks credentials + emailVerified flag
    ├─ Email not verified → EMAIL_NOT_CONFIRMED error
    ├─ Invalid credentials → INVALID_CREDENTIALS error
    └─ Valid + twoFactorEnabled=true
         → BetterAuth sets short-lived two-factor cookie
         → returns { twoFactorRedirect: true }
         → loginAction() redirects to /verify-mfa?redirectTo=<validated>
```

### 2.2 MFA Verification (Email OTP)

```
/verify-mfa page loads
  → page calls sendMFACodeAction() on mount
  → sendMFACode() service calls auth.api.sendTwoFactorOTP()
  → BetterAuth generates OTP, stores in verifications table (10-minute TTL)
  → OTP delivered to user's email via sendEmail()

User submits 6-digit code
  → verifyMFAAction() validates /^\d{6}$/ format
  → verifyMFACode() service calls auth.api.verifyTwoFactorOTP()
  → BetterAuth validates code against verifications table
  → On success: full session cookie set, two-factor cookie cleared
  → Redirect to validated redirectTo or /dashboard
```

### 2.3 Signup

```
User submits signup form
  → signupAction() validates with signupSchema (Zod)
  → Checks vanitySlug availability (isSlugAvailable)
  → signup() service calls auth.api.signUpEmail()
  → databaseHooks.user.create.before runs:
      - generates vanitySlug from name/email
      - forces twoFactorEnabled: true
  → BetterAuth creates user (emailVerified=false), sends verification email
  → Best-effort: updateSlug() overrides auto-generated slug with user's choice
  → Always redirects to /verify-email (enumeration protection — even on error)
```

### 2.4 Email Verification

```
User clicks link in verification email
  → GET /api/auth/verify-email?token=<token>
  → BetterAuth validates token from verifications table (24-hour TTL)
  → Sets emailVerified=true on user record
  → autoSignInAfterVerification: true — session created immediately
  → User is logged in, redirected to /dashboard
```

### 2.5 Password Reset

```
User submits forgot-password form
  → passwordResetRequestAction() validates email
  → resetPassword() service calls auth.api.requestPasswordReset()
  → BetterAuth sends reset email if account exists (always returns success — enumeration protection)
  → Email contains link to /reset-password?token=<token> (1-hour TTL per email text)

User submits new password
  → passwordUpdateAction() validates password strength
  → updatePassword() service calls auth.api.resetPassword({ newPassword, token })
  → BetterAuth validates token, hashes new password, stores it
  → User redirected to /login
```

### 2.6 Password Change (Authenticated)

```
User submits change-password form (settings page)
  → passwordChangeAction() calls requireAuth() → session verified
  → Validates password strength via passwordUpdateSchema
  → changePassword() service calls auth.api.changePassword({
      currentPassword, newPassword, revokeOtherSessions: true
    })
  → BetterAuth verifies current password, updates hash, revokes other sessions
  → Current session remains active (token NOT rotated)
```

### 2.7 Logout

```
User triggers sign-out
  → signOutAction() calls logout() service
  → auth.api.signOut() revokes session record in DB, clears session cookie
  → Redirect to /
```

---

## 3. Session Lifecycle

### Token properties

BetterAuth issues session tokens using `crypto.randomUUID()`. The session record in PostgreSQL stores:

- `token` — unique opaque identifier
- `expiresAt` — absolute expiry (BetterAuth default: 7 days)
- `userId` — foreign key with cascade delete
- `ipAddress`, `userAgent` — stored at creation, not re-validated per request
- `createdAt`, `updatedAt`

The session cookie is set by BetterAuth's `nextCookies()` plugin. The application configures a `sessionExpiryThresholdMs` of 5 minutes in client config, but there is **no sliding-window refresh** implemented.

### Cookie security properties

BetterAuth's `nextCookies()` plugin applies the following to the session cookie:

- `HttpOnly` — not accessible to JavaScript
- `Secure` — sent only over HTTPS
- `SameSite=Lax` — protects against most CSRF vectors

Cookie path, domain scope, and `__Host-` prefix are not explicitly configured in application code; defaults depend on the BetterAuth version in use.

### Session verification model

The proxy (`src/proxy.ts`) checks for cookie **presence** only — it cannot make database calls on the Edge Runtime. Full cryptographic session verification (`auth.api.getSession()`) is performed at the page/server-action level.

---

## 4. Route Protection Model

### Protected routes

`/dashboard`, `/settings` — checked by proxy; pages perform full DB verification.

### Public routes

`/`, `/login`, `/signup`, `/verify-email`, `/verify-mfa`, `/forgot-password`, `/reset-password`, `/auth`

### Redirect validation

`isValidRedirect()` (`src/lib/utils/validation/redirect.ts`) enforces:
1. Relative paths only — must start with `/`, must not start with `//`
2. No null byte injection (`\0`, `\x00`)
3. No protocol handlers (`:` before first `/` in path)
4. Single-decode validation — double-encoded URLs are rejected
5. Invalid-encoding inputs are rejected

This is a well-implemented defence against open-redirect attacks.

---

## 5. Input Validation & Error Handling

### Validation

All auth form inputs are validated with Zod schemas before reaching the service layer:

- **Email** — trimmed, lowercased, format validated
- **Password (new/signup)** — 12-char minimum, uppercase + lowercase + digit + special character
- **Password (login)** — presence only (no strength validation — intentional)
- **MFA code** — `/^\d{6}$/` regex enforced before service call
- **Redirect URL** — `isValidRedirect()` checked before use in any redirect

### Error mapping

`src/lib/auth/errors.ts` maps BetterAuth errors to typed `AuthServiceErrorCode` values. Detection is performed by string matching against `.message` (see [Critical Issue #5](#critical-issue-5-fragile-error-detection-via-string-matching)).

### Enumeration protection

- Login: generic `"Invalid email or password"` for both wrong password and unrecognised email
- Signup: always redirects to `/verify-email` even if signup fails
- Password reset: always returns success regardless of email existence

---

## 6. Positive Security Findings

These controls are correctly implemented and should be preserved.

| Control | Location | Assessment |
|---|---|---|
| Mandatory MFA for new users | `auth.ts:122` — `twoFactorEnabled: true` in `databaseHooks` | Correct for new signups |
| Email verification before login | `auth.ts:60` — `requireEmailVerification: true` | Prevents unverified account access |
| Password strength enforcement | `schemas/auth.ts` — Zod regex chain | 12-char + 4 character-class requirement is strong |
| Open-redirect prevention | `redirect.ts` — multi-layer allowlist validation | Comprehensive; handles encoding edge cases |
| Enumeration protection | `service.ts:301-333`, `auth-actions.ts:138-139` | Consistent across login, signup, and password reset |
| Structured logging with masked PII | `service.ts` — `maskEmail()` throughout | No raw emails in logs |
| `revokeOtherSessions` on password change | `service.ts:396` | Terminates concurrent attacker sessions |
| Soft deletes | `users.deletedAt` column | Audit trail preserved |
| Parameterised DB queries | Drizzle ORM throughout | SQL injection mitigated |
| Server-side–only Google Places key | `config/index.ts` — no `NEXT_PUBLIC_` prefix | Correct |
| UUID-based session IDs | `auth.ts:44` — `crypto.randomUUID()` | Cryptographically random |
| `requireAuth()` in settings action | `auth-actions.ts:386` | Session verified before privileged operation |

---

## 7. Critical Areas of Concern

The following five issues are ranked by the combination of **exploitability** and **blast radius**. Each has a concrete recommended fix.

---

### Critical Issue #1 — No HTTP Security Headers

**Severity:** CRITICAL
**OWASP:** A05 Security Misconfiguration
**CWE:** CWE-693 (Protection Mechanism Failure)

**What can go wrong:**

`next.config.ts` defines no `headers()` function. Every HTTP response is served without:

- `Content-Security-Policy` — no browser-level containment of XSS
- `Strict-Transport-Security` — no HTTPS enforcement, susceptible to SSL-strip
- `X-Frame-Options` — application can be embedded in iframes (clickjacking)
- `X-Content-Type-Options` — MIME-type sniffing attacks possible
- `Referrer-Policy` — full URL (including tokens in query strings) can leak in Referer headers
- `Permissions-Policy` — no restriction on camera, microphone, geolocation APIs

The absence of CSP is the most severe gap. If any reflected or stored XSS vulnerability exists — including in any third-party script loaded by Next.js — an attacker can inject a script that exfiltrates the session cookie or performs authenticated actions on behalf of the user. Because the session cookie is `HttpOnly`, direct JavaScript access is blocked; however, a script can still make authenticated server action requests from the victim's browser without needing the raw cookie value.

Additionally, password reset tokens are passed as query parameters in the reset URL (`/reset-password?token=...`). Without `Referrer-Policy: no-referrer` or `strict-origin-when-cross-origin`, this token can leak in the `Referer` header to any third-party resource loaded on the reset page.

**Recommended fix:**

Add a `headers()` block to `next.config.ts`:

```typescript
async headers() {
  return [
    {
      source: "/(.*)",
      headers: [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
        // CSP requires audit of all inline scripts/styles first — see note below
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self'",
            "style-src 'self' 'unsafe-inline'", // tighten after nonce audit
            "img-src 'self' https://maps.googleapis.com https://lh3.googleusercontent.com https://streetviewpixels-pa.googleapis.com data:",
            "connect-src 'self'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "object-src 'none'",
          ].join("; "),
        },
      ],
    },
  ];
},
```

> **Note on CSP:** audit all pages for `'unsafe-inline'` script usage before enabling a strict `script-src`. Use `Content-Security-Policy-Report-Only` first to identify violations without breaking functionality.

---

### Critical Issue #2 — No Application-Level Rate Limiting on Any Auth Endpoint

**Severity:** CRITICAL
**OWASP:** A07 Identification and Authentication Failures
**CWE:** CWE-307 (Improper Restriction of Excessive Authentication Attempts)

**What can go wrong:**

There is no rate limiting implemented at the application level on any of the following endpoints:

- **Login** (`loginAction`) — password can be guessed indefinitely. An attacker can automate credential stuffing or brute-force attacks from a single IP or distributed addresses without hitting any application-enforced limit.
- **Password reset** (`passwordResetRequestAction`) — an attacker can submit thousands of reset requests for any email address, flooding the victim's inbox and consuming SMTP quota.
- **MFA code verification** (`verifyMFAAction`) — while BetterAuth exposes a `TOO_MANY_MFA_ATTEMPTS` error, the threshold and window are not configurable in this codebase and are undocumented in BetterAuth's public documentation. The application has no fallback control if BetterAuth's internal limit is absent or misconfigured.

A 6-digit OTP has a keyspace of 1,000,000 codes. With a 10-minute validity window and no throttle, an attacker can submit roughly 16 guesses per second — exhausting the entire keyspace in under 18 hours.

**Recommended fix:**

Implement rate limiting at the Next.js middleware layer using an in-process or Redis-backed store. A lightweight option compatible with the Edge Runtime is `@upstash/ratelimit` backed by Redis:

```typescript
// proxy.ts additions
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "15 m"), // 10 attempts per 15 minutes per IP
});

// In the proxy handler, before forwarding POST /api/auth/* and server action routes:
const ip = request.ip ?? "anonymous";
const { success } = await ratelimit.limit(`login:${ip}`);
if (!success) return new NextResponse("Too Many Requests", { status: 429 });
```

Separate limits should apply per endpoint type:

| Endpoint | Suggested limit |
|---|---|
| Login | 10 attempts / 15 min / IP |
| Password reset request | 3 requests / hour / IP |
| MFA code verification | 5 attempts / 10 min / two-factor cookie identifier |

---

### Critical Issue #3 — Active Session Token Not Rotated on Password Change

**Severity:** HIGH
**OWASP:** A07 Identification and Authentication Failures
**CWE:** CWE-384 (Session Fixation)

**What can go wrong:**

`changePassword()` (`service.ts:395-398`) calls BetterAuth with `revokeOtherSessions: true`:

```typescript
await auth.api.changePassword({
  body: { currentPassword, newPassword, revokeOtherSessions: true },
  headers: h,
});
```

This terminates all *other* active sessions. However, the **current session token is not rotated** — the same token remains active and valid after the password change completes.

The standard attack scenario:

1. Attacker obtains a valid session token (via XSS, network interception, log exposure, or shared device)
2. Victim notices suspicious activity and changes their password
3. Victim expects that changing the password terminates all access
4. Attacker's stolen token is still valid — `revokeOtherSessions` did not include the current session

This is a direct violation of OWASP A07: session tokens must be rotated on any privilege or authentication state change.

**Recommended fix:**

After a successful password change, explicitly invalidate the current session and issue a new one. Since BetterAuth does not expose a direct "rotate session" API, the correct sequence is:

1. Call `auth.api.changePassword({ revokeOtherSessions: true })` — revokes others
2. Call `auth.api.signOut()` — revokes current session and clears cookie
3. Immediately re-authenticate the user silently (or redirect to login with a `?sessionExpired=passwordChange` hint)

Alternatively, pass a BetterAuth option to revoke ALL sessions including the current one, then force re-login. This introduces a small UX friction that should be communicated to the user ("Your password has been changed. Please log in again.").

---

### Critical Issue #4 — MFA Enforcement Has a Silent Bypass for Pre-Existing Users

**Severity:** HIGH
**OWASP:** A07 Identification and Authentication Failures, A04 Insecure Design
**CWE:** CWE-306 (Missing Authentication for Critical Function)

**What can go wrong:**

MFA enforcement is applied exclusively via `databaseHooks.user.create.before` (`auth.ts:122`):

```typescript
return { data: { ...user, vanitySlug, twoFactorEnabled: true } };
```

This sets `twoFactorEnabled: true` only at the moment of account creation. **Any user account that existed before this hook was introduced** — including all accounts migrated from Supabase — will have `twoFactorEnabled: false` in the database unless a migration explicitly backfilled this column.

The MFA challenge is gated on BetterAuth's `twoFactor` plugin intercepting the sign-in response. If `twoFactorEnabled` is `false` for a given user, BetterAuth does not set the two-factor cookie and does not return `{ twoFactorRedirect: true }`. The application's login flow interprets this as a successful non-MFA login and creates a full session without any MFA verification.

**Additionally:** there is no server-side check in any protected page or server action that verifies whether the session was established through MFA. A session created without MFA is indistinguishable from one created with MFA at the session-token level.

This means the "mandatory MFA for all users" design intent is not enforced in practice for the existing user cohort.

**Recommended fix:**

1. **Immediate:** Write a database migration to backfill `twoFactorEnabled = true` for all existing users where `twoFactorEnabled = false` and `emailVerified = true`:

```sql
UPDATE users
SET    two_factor_enabled = true,
       updated_at         = NOW()
WHERE  two_factor_enabled = false
  AND  email_verified     = true
  AND  deleted_at         IS NULL;
```

2. **Defensive:** Add an explicit check in the login service. After `signInEmail()` succeeds without a `twoFactorRedirect`, verify that the user's `twoFactorEnabled` flag is `false`. If it is `true` but no MFA redirect occurred, treat it as a security anomaly and reject the login:

```typescript
// In service.ts login(), after auth.api.signInEmail() returns a user:
if (result.user?.twoFactorEnabled && !twoFactorRedirect) {
  log.error({ method: "login", userId: result.user.id }, "MFA bypass detected");
  throw authServiceError("Authentication failed");
}
```

3. **Verification:** Add an integration test that asserts a user with `twoFactorEnabled: true` cannot complete login without passing the MFA step.

---

### Critical Issue #5 — Fragile Error Detection via String Matching

**Severity:** HIGH
**OWASP:** A04 Insecure Design
**CWE:** CWE-390 (Detection of Error Condition Without Action)

**What can go wrong:**

All BetterAuth error classification in `src/lib/auth/errors.ts` relies on substring matches against the error's `.message` string:

```typescript
// errors.ts
export function isInvalidMFACodeError(err: unknown): boolean {
  return err instanceof Error && err.message.toUpperCase().includes("INVALID_CODE");
}

export function isMFACodeExpiredError(err: unknown): boolean {
  return err instanceof Error && err.message.toUpperCase().includes("OTP_HAS_EXPIRED");
}

export function isTooManyMFAAttemptsError(err: unknown): boolean {
  return err instanceof Error && err.message.toUpperCase().includes("TOO_MANY_ATTEMPTS");
}
```

The consequences of silent misclassification are security-relevant:

- **`isTooManyMFAAttemptsError` fails:** MFA brute-force detection is missed. The error falls through to `authServiceError("Failed to verify code")` — which does **not** terminate the two-factor cookie or block the session. An attacker could continue submitting codes.
- **`isMFACodeExpiredError` fails:** Expired codes are accepted as generic errors rather than triggering a re-authentication prompt, potentially confusing users into retry loops.
- **`isInvalidMFASessionError` has three branches** (including an `err.body.code` check) because BetterAuth uses inconsistent error representations — evidence that the error interface is unstable.

BetterAuth does not currently expose a stable, typed error code enum in its public TypeScript interface for server-side API calls. This means the string-matching approach is the only available option today, but it creates a latent fragility.

**Recommended fixes:**

1. **Pin the BetterAuth minor version** in `package.json` using an exact version or tilde (`~1.5.5`) rather than a caret (`^1.5.5`), so that patch releases are reviewed manually before being applied:

```json
"better-auth": "~1.5.5"
```

2. **Add a CI test** that imports the actual BetterAuth error values and asserts the detection functions match them. This converts a silent runtime failure into a build-time failure when BetterAuth updates error messages.

3. **Add a fallback safety net** in `verifyMFACode()` (`service.ts:250-255`): when `TOO_MANY_MFA_ATTEMPTS` is not detected but an unexpected error occurs, default to invalidating the two-factor cookie session rather than returning a recoverable error:

```typescript
// In verifyMFACode() catch block, as a final fallback before authServiceError:
log.warn({ method: "verifyMFACode", err }, "Unclassified MFA error — treating as session termination");
throw new AuthServiceError(
  "INVALID_MFA_SESSION",
  "Verification failed. Please log in again.",
  error
);
```

4. **Track BetterAuth's error interface** — open a GitHub watch/issue on the BetterAuth repository to be notified when a typed error code system is introduced, then migrate immediately.

---

## 8. STRIDE Threat Summary

| Threat | Component | Category | Severity | Control Present | Gap |
|---|---|---|---|---|---|
| Session token theft via XSS | All pages | Tampering / Info Disclosure | CRITICAL | `HttpOnly` cookie | No CSP — scripts can make authenticated requests |
| Password brute force | `loginAction` | Elevation of Privilege | CRITICAL | None at app level | No rate limiting |
| MFA code brute force | `verifyMFAAction` | Elevation of Privilege | HIGH | BetterAuth internal (undocumented) | No app-level throttle; undetectable if BetterAuth limit silent |
| Session persistence after password change | `changePassword` | Spoofing | HIGH | `revokeOtherSessions: true` (others only) | Current session not rotated |
| MFA bypass for legacy users | `loginAction` | Elevation of Privilege | HIGH | `twoFactorEnabled: true` for new users | Not backfilled; no server-side verification |
| Error state misclassification | `errors.ts` | Information Disclosure / DoS | HIGH | Typed `AuthServiceErrorCode` | String-match detection brittle |
| Clickjacking login form | `/login`, `/signup` | Tampering | MEDIUM | None | No `X-Frame-Options` or `frame-ancestors` CSP |
| Password reset token in Referer header | `/reset-password?token=...` | Information Disclosure | MEDIUM | None | No `Referrer-Policy` header |
| Account enumeration via timing | `loginAction` | Information Disclosure | MEDIUM | Generic error message | No artificial constant-time delay |
| Replay of expired session cookie | `proxy.ts` | Spoofing | LOW | Pages do full DB verify | Edge layer passes expired cookie through |
| `placehold.co` image domain in production | `next.config.ts:28` | Info Disclosure | LOW | TODO comment present | Dev-only domain active in production builds |

---

*This document should be revisited after each of the five critical issues above is resolved, and kept current whenever the BetterAuth version or auth configuration changes.*
