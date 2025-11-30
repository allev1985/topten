# Authentication Sequence Diagrams

This document contains focused sequence diagrams for the three main authentication flows in the YourFaves application.

## 1. Sign Up Flow

```mermaid
sequenceDiagram
    participant User
    participant WebApp as Web Application
    participant Supabase

    User->>WebApp: Navigate to /signup
    WebApp-->>User: Display signup form

    User->>WebApp: Submit signup form (email, password)
    WebApp->>WebApp: POST /api/auth/signup
    WebApp->>Supabase: signUp(email, password)

    alt New User
        Supabase->>Supabase: Create unverified user record
        Supabase->>User: Send verification email
        Supabase-->>WebApp: Success (no session)
    else Existing User (enumeration protection)
        Supabase->>User: Send "account exists" notification
        Supabase-->>WebApp: Success (no session)
    end

    WebApp-->>WebApp: API responds 201 Created
    WebApp-->>User: Generic message: "Check your email to verify"
    WebApp-->>User: Redirect to /verify-email

    Note over User,Supabase: Email Verification Step

    User->>User: Check email & click verification link
    User->>WebApp: GET /api/auth/verify?code=xxx
    WebApp->>Supabase: verifyOtp(code, type: 'email')
    Supabase->>Supabase: Mark email as verified
    Supabase-->>WebApp: Return session tokens
    WebApp->>WebApp: Set session cookie (HTTP-only)
    WebApp-->>User: Redirect to /dashboard (logged in)
```

## 2. Login Flow

```mermaid
sequenceDiagram
    participant User
    participant WebApp as Web Application
    participant Supabase

    User->>WebApp: Navigate to /login
    WebApp-->>User: Display login form

    User->>WebApp: Submit login form (email, password)
    WebApp->>WebApp: POST /api/auth/login
    WebApp->>Supabase: signInWithPassword(email, password)

    alt Valid Credentials
        Supabase->>Supabase: Validate credentials
        Supabase-->>WebApp: Return session (access + refresh tokens)
        WebApp->>WebApp: API sets session cookie (HTTP-only, Secure, SameSite)
        WebApp-->>WebApp: API responds 200 OK with session
        WebApp-->>User: Redirect to /dashboard (or redirectTo param)

        User->>WebApp: GET /dashboard
        WebApp->>WebApp: Middleware checks session cookie
        WebApp->>Supabase: Validate session token
        Supabase-->>WebApp: Session valid
        WebApp-->>User: Display protected dashboard page
    else Invalid Credentials
        Supabase-->>WebApp: Authentication error
        WebApp-->>WebApp: API responds 401 Unauthorized
        WebApp-->>User: Display error message
    end
```

## 3. Forgot Password Flow

```mermaid
sequenceDiagram
    participant User
    participant WebApp as Web Application
    participant Supabase

    User->>WebApp: Navigate to /forgot-password
    WebApp-->>User: Display email input form

    User->>WebApp: Submit email address
    WebApp->>WebApp: POST /api/auth/password/reset
    WebApp->>Supabase: resetPasswordForEmail(email)

    alt Email Exists (enumeration protection)
        Supabase->>Supabase: Generate reset code
        Supabase->>User: Send password reset email with link
        Supabase-->>WebApp: Success
    else Email Not Found (enumeration protection)
        Supabase-->>WebApp: Success (no email sent)
    end

    WebApp-->>WebApp: API responds 200 OK
    WebApp-->>User: Generic message: "If account exists, check your email"

    Note over User,Supabase: Password Reset Step

    User->>User: Check email & click reset link
    User->>WebApp: GET /reset-password?code=xxx
    WebApp-->>User: Display new password form

    User->>WebApp: Submit new password
    WebApp->>WebApp: PUT /api/auth/password
    WebApp->>Supabase: updateUser(password) with reset code

    alt Valid Code
        Supabase->>Supabase: Validate reset code
        Supabase->>Supabase: Update password hash
        Supabase->>Supabase: Invalidate reset code
        Supabase-->>WebApp: Success
        WebApp-->>WebApp: API responds 200 OK
        WebApp-->>User: Display success & redirect to /login
    else Invalid/Expired Code
        Supabase-->>WebApp: Error: Invalid code
        WebApp-->>WebApp: API responds 400 Bad Request
        WebApp-->>User: Display error message
    end
```

## API Architecture

The Web Application implements a **RESTful API layer** that acts as an intermediary between the frontend pages and Supabase Auth. This architecture provides:

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/auth/signup` | Register new user account |
| `GET` | `/api/auth/verify` | Verify email with code from link |
| `POST` | `/api/auth/login` | Authenticate user and create session |
| `POST` | `/api/auth/logout` | End user session |
| `POST` | `/api/auth/refresh` | Refresh expiring session |
| `POST` | `/api/auth/password/reset` | Request password reset email |
| `PUT` | `/api/auth/password` | Update user password |
| `GET` | `/api/auth/session` | Get current session status |

### Benefits of API Layer
- **Abstraction** - Frontend doesn't directly depend on Supabase client
- **Security** - Sensitive operations handled server-side
- **Validation** - Centralized input validation and sanitization
- **Logging** - Audit logging for all authentication events
- **Flexibility** - Easier to switch auth providers in the future

## Key Security Features

### User Enumeration Protection
Both the **Sign Up** and **Forgot Password** flows implement user enumeration protection by returning the same generic success message regardless of whether the email exists in the system. This prevents attackers from discovering valid email addresses.

**Implementation:**
- `/api/auth/signup` always returns `201 Created` with generic message
- `/api/auth/password/reset` always returns `200 OK` with generic message
- Emails sent selectively based on actual account status

### Session Management
- Sessions are stored in **HTTP-only cookies** to prevent XSS attacks
- Cookies use **Secure** flag (HTTPS only in production)
- **SameSite=Lax** prevents CSRF attacks
- Session tokens include both **access tokens** (short-lived) and **refresh tokens** (long-lived)
- Cookies set by `/api/auth/login` and `/api/auth/verify` endpoints

### Middleware Protection
The Web Application's middleware automatically:
- Validates session on every request to `/dashboard/*` routes
- Refreshes expiring sessions automatically via `/api/auth/refresh`
- Redirects unauthenticated users to login with `redirectTo` parameter
- Stores session state in secure cookies

### Email Verification Requirement
New users cannot access protected routes until they verify their email address via the `/api/auth/verify` endpoint. This ensures:
- Email ownership validation
- Reduces spam/bot registrations
- Enables account recovery options
