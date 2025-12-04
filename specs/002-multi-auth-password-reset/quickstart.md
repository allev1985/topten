# Quickstart: Multi-Auth Password Reset

**Feature Branch**: `002-multi-auth-password-reset`
**Date**: 2025-11-30

## Overview

This feature implements multiple authentication methods for the password reset endpoint, supporting:
1. **PKCE Code** - Primary "forgot password" flow via email link
2. **OTP Token** - Alternative email verification flow
3. **Session Auth** - Authenticated user password change

## Key Changes Summary

### 1. API Endpoint (`src/app/api/auth/password/route.ts`)

**New Authentication Flow**:
```typescript
// Priority: PKCE code → OTP token → existing session

// 1. Try PKCE code if provided
if (code) {
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  // Handle error...
}

// 2. Try OTP token if provided
else if (token_hash && type === 'email') {
  const { error } = await supabase.auth.verifyOtp({ type: 'email', token_hash });
  // Handle error...
}

// 3. Fall back to existing session
else {
  const { data: { user }, error } = await supabase.auth.getUser();
  // Handle error...
}

// After successful password update:
await supabase.auth.signOut();
```

### 2. Schema Extension (`src/schemas/auth.ts`)

Add optional fields to `passwordUpdateSchema`:
```typescript
export const passwordUpdateSchema = z.object({
  password: z.string()/* existing validation */,
  code: z.string().min(1).optional(),
  token_hash: z.string().min(1).optional(),
  type: z.literal(VERIFICATION_TYPE_EMAIL).optional(),
});
```

### 3. Server Action (`src/actions/auth-actions.ts`)

Update `passwordUpdateAction` to pass code:
```typescript
export async function passwordUpdateAction(
  _prevState: ActionState<PasswordUpdateSuccessData>,
  formData: FormData
): Promise<ActionState<PasswordUpdateSuccessData>> {
  const code = formData.get("code");
  // ... existing password validation ...
  
  body: JSON.stringify({
    password: result.data.password,
    code: typeof code === "string" && code ? code : undefined,
  }),
}
```

### 4. Form Component (`src/app/(auth)/reset-password/password-reset-form.tsx`)

Accept and pass code prop:
```typescript
interface PasswordResetFormProps {
  code?: string;
}

export function PasswordResetForm({ code }: PasswordResetFormProps) {
  // ... in form ...
  {code && <input type="hidden" name="code" value={code} />}
}
```

### 5. Page Component (`src/app/(auth)/reset-password/page.tsx`)

Pass code to form:
```typescript
<PasswordResetForm code={code} />
```

## Testing Strategy

### Integration Tests (`tests/integration/auth/password-update.test.ts`)

Add test cases for:

```typescript
describe("PKCE code authentication", () => {
  it("returns 200 for valid PKCE code");
  it("returns 401 for invalid PKCE code");
  it("returns 401 for expired PKCE code");
});

describe("OTP token authentication", () => {
  it("returns 200 for valid OTP token");
  it("returns 401 for invalid OTP token");
  it("returns 401 for expired OTP token");
});

describe("authentication priority", () => {
  it("prioritizes PKCE code over OTP token");
  it("prioritizes OTP token over session");
});

describe("sign out after reset", () => {
  it("calls signOut after successful password update");
  it("succeeds even if signOut fails");
});
```

## Flow Diagrams

### Password Reset via Email Link (PKCE)

```
User → Click reset link → /reset-password?code=xxx
                              ↓
                         PasswordResetForm (with code)
                              ↓
                         Submit form with password + code
                              ↓
                         passwordUpdateAction
                              ↓
                         PUT /api/auth/password {password, code}
                              ↓
                         exchangeCodeForSession(code)
                              ↓
                         updateUser({password})
                              ↓
                         signOut()
                              ↓
                         Redirect to /login
```

### Password Reset via OTP Token

```
User → Click reset link → /api/auth/password (direct API call)
                              ↓
                         PUT {password, token_hash, type: 'email'}
                              ↓
                         verifyOtp({type: 'email', token_hash})
                              ↓
                         updateUser({password})
                              ↓
                         signOut()
                              ↓
                         Return success
```

## Error Handling

| Scenario | Error Code | Message |
|----------|------------|---------|
| Invalid PKCE code | AUTH_ERROR | "Authentication failed" |
| Expired PKCE code | AUTH_ERROR | "Authentication link has expired. Please request a new one." |
| Invalid OTP token | AUTH_ERROR | "Authentication failed" |
| Expired OTP token | AUTH_ERROR | "Authentication link has expired. Please request a new one." |
| No authentication | AUTH_ERROR | "Authentication required" |
| Invalid password | VALIDATION_ERROR | Specific requirement not met |
| Server error | SERVER_ERROR | "An unexpected error occurred" |

## Configuration

No new configuration required. Uses existing:
- `VERIFICATION_TYPE_EMAIL` from `@/lib/config`
- `PASSWORD_REQUIREMENTS` from `@/lib/config`

## Dependencies

No new dependencies. Uses existing:
- `@supabase/ssr` (Supabase Auth client)
- `zod` (validation)
