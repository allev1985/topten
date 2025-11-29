# Quickstart: Database Schema & Supabase Auth Configuration

**Feature**: Task 1.2 - Database Schema & Supabase Auth Configuration  
**Date**: 2025-11-29

## Overview

This guide walks through implementing the database schema and Supabase Auth configuration for YourFavs. After completing these steps, you will have:

- ✅ Supabase Auth configured with strong password requirements
- ✅ Email verification enabled for new signups
- ✅ Custom email templates for verification and password reset
- ✅ Row Level Security (RLS) policies protecting user data
- ✅ Password validation utilities for client and server use

---

## Prerequisites

1. Supabase CLI installed (`pnpm add -D supabase`)
2. Local Supabase instance running (`pnpm supabase:start`)
3. Drizzle schema already migrated

---

## Step 1: Update Supabase Auth Configuration

Edit `/supabase/config.toml`:

```toml
[auth]
# ... existing settings ...
minimum_password_length = 12
password_requirements = "lower_upper_letters_digits_symbols"

[auth.email]
# ... existing settings ...
enable_confirmations = true
```

**Note**: Email templates are configured through the Supabase dashboard or via the Supabase CLI's seed/migration system, not through config.toml directly. The templates created in Step 2 should be uploaded via the Supabase Studio UI or configured in production through the Supabase dashboard.

**Verify**: Restart Supabase to apply changes:

```bash
pnpm supabase:stop && pnpm supabase:start
```

---

## Step 2: Create Email Templates

### Create templates directory:

```bash
mkdir -p supabase/templates
```

### Create `/supabase/templates/confirmation.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verify your email</title>
  </head>
  <body
    style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;"
  >
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
      <tr>
        <td align="center" style="padding: 40px 20px;">
          <table
            role="presentation"
            style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
          >
            <!-- Header -->
            <tr>
              <td style="padding: 40px 40px 20px; text-align: center;">
                <h1
                  style="margin: 0; font-size: 24px; font-weight: 600; color: #1a1a1a;"
                >
                  YourFavs
                </h1>
              </td>
            </tr>
            <!-- Content -->
            <tr>
              <td style="padding: 20px 40px;">
                <h2
                  style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #1a1a1a;"
                >
                  Verify your email address
                </h2>
                <p
                  style="margin: 0 0 24px; font-size: 16px; line-height: 1.5; color: #4a4a4a;"
                >
                  Welcome to YourFavs! Please click the button below to verify
                  your email address and complete your registration.
                </p>
                <table
                  role="presentation"
                  style="width: 100%; border-collapse: collapse;"
                >
                  <tr>
                    <td align="center" style="padding: 20px 0;">
                      <a
                        href="{{ .ConfirmationURL }}"
                        style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; background-color: #2563eb; text-decoration: none; border-radius: 6px;"
                        >Verify Email Address</a
                      >
                    </td>
                  </tr>
                </table>
                <p
                  style="margin: 24px 0 0; font-size: 14px; line-height: 1.5; color: #6b7280;"
                >
                  If you didn't create an account with YourFavs, you can safely
                  ignore this email.
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td
                style="padding: 20px 40px 40px; text-align: center; border-top: 1px solid #e5e7eb;"
              >
                <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                  © 2025 YourFavs. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

### Create `/supabase/templates/recovery.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Reset your password</title>
  </head>
  <body
    style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;"
  >
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
      <tr>
        <td align="center" style="padding: 40px 20px;">
          <table
            role="presentation"
            style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
          >
            <!-- Header -->
            <tr>
              <td style="padding: 40px 40px 20px; text-align: center;">
                <h1
                  style="margin: 0; font-size: 24px; font-weight: 600; color: #1a1a1a;"
                >
                  YourFavs
                </h1>
              </td>
            </tr>
            <!-- Content -->
            <tr>
              <td style="padding: 20px 40px;">
                <h2
                  style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #1a1a1a;"
                >
                  Reset your password
                </h2>
                <p
                  style="margin: 0 0 24px; font-size: 16px; line-height: 1.5; color: #4a4a4a;"
                >
                  We received a request to reset your password. Click the button
                  below to choose a new password.
                </p>
                <table
                  role="presentation"
                  style="width: 100%; border-collapse: collapse;"
                >
                  <tr>
                    <td align="center" style="padding: 20px 0;">
                      <a
                        href="{{ .ConfirmationURL }}"
                        style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; background-color: #2563eb; text-decoration: none; border-radius: 6px;"
                        >Reset Password</a
                      >
                    </td>
                  </tr>
                </table>
                <p
                  style="margin: 24px 0 8px; font-size: 14px; line-height: 1.5; color: #6b7280;"
                >
                  This link will expire in 1 hour. If you didn't request a
                  password reset, you can safely ignore this email.
                </p>
                <p
                  style="margin: 0; font-size: 14px; line-height: 1.5; color: #6b7280;"
                >
                  Your password will remain unchanged until you create a new
                  one.
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td
                style="padding: 20px 40px 40px; text-align: center; border-top: 1px solid #e5e7eb;"
              >
                <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                  © 2025 YourFavs. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

---

## Step 3: Create Database Migration

### Create `/supabase/migrations/001_initial_auth_setup.sql`:

```sql
-- Migration: 001_initial_auth_setup.sql
-- Description: Configure RLS policies for all tables
-- Date: 2025-11-29

-- ============================================
-- Enable RLS on all tables
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_places ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Users table policies
-- ============================================

-- Allow users to select their own full profile
CREATE POLICY users_select_own ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow anyone to view public profile information
CREATE POLICY users_select_public ON users
  FOR SELECT
  TO anon, authenticated
  USING (deleted_at IS NULL);

-- Allow users to update only their own profile
CREATE POLICY users_update_own ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY users_insert_own ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================
-- Lists table policies
-- ============================================

-- Allow users to select their own lists
CREATE POLICY lists_select_own ON lists
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Allow anyone to view published lists
CREATE POLICY lists_select_published ON lists
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true AND deleted_at IS NULL);

-- Allow users to insert their own lists
CREATE POLICY lists_insert_own ON lists
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own lists
CREATE POLICY lists_update_own ON lists
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Places table policies
-- ============================================

-- Allow anyone to view places
CREATE POLICY places_select_all ON places
  FOR SELECT
  TO anon, authenticated
  USING (deleted_at IS NULL);

-- Allow authenticated users to insert places
CREATE POLICY places_insert_authenticated ON places
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update places
CREATE POLICY places_update_authenticated ON places
  FOR UPDATE
  TO authenticated
  USING (deleted_at IS NULL)
  WITH CHECK (true);

-- ============================================
-- ListPlaces table policies
-- ============================================

-- Allow viewing list_places based on list visibility
CREATE POLICY list_places_select_via_list ON list_places
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_places.list_id
      AND lists.deleted_at IS NULL
      AND (
        lists.is_published = true
        OR (auth.uid() IS NOT NULL AND lists.user_id = auth.uid())
      )
    )
    AND list_places.deleted_at IS NULL
  );

-- Allow list owners to insert into their lists
CREATE POLICY list_places_insert_owner ON list_places
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_places.list_id
      AND lists.user_id = auth.uid()
      AND lists.deleted_at IS NULL
    )
  );

-- Allow list owners to update their list_places
CREATE POLICY list_places_update_owner ON list_places
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_places.list_id
      AND lists.user_id = auth.uid()
    )
    AND list_places.deleted_at IS NULL
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_places.list_id
      AND lists.user_id = auth.uid()
    )
  );

-- Allow list owners to delete from their lists
CREATE POLICY list_places_delete_owner ON list_places
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_places.list_id
      AND lists.user_id = auth.uid()
    )
  );

-- ============================================
-- Foreign key constraint
-- Note: Only add this constraint on new deployments or after ensuring
-- all existing users.id values have corresponding auth.users entries.
-- For existing databases, run a data migration first if needed.
-- ============================================

-- Check if constraint already exists before adding
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_id_fkey'
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT users_id_fkey
    FOREIGN KEY (id) REFERENCES auth.users(id)
    ON DELETE CASCADE;
  END IF;
END $$;
```

**Apply migration**:

```bash
pnpm supabase db push
```

**Note**: If you have existing users in the database that were created outside of Supabase Auth, you may need to create corresponding entries in `auth.users` first, or remove orphaned records before applying the foreign key constraint.

---

## Step 4: Create Password Validation Utility

### Create `/src/lib/validation/password.ts`:

```typescript
/**
 * Password validation utility for YourFavs
 * Validates passwords against security requirements
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: "weak" | "medium" | "strong";
  checks: {
    minLength: boolean;
    hasLowercase: boolean;
    hasUppercase: boolean;
    hasDigit: boolean;
    hasSymbol: boolean;
  };
}

const MIN_PASSWORD_LENGTH = 12;

export function validatePassword(password: string): PasswordValidationResult {
  const checks = {
    minLength: password.length >= MIN_PASSWORD_LENGTH,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasDigit: /\d/.test(password),
    hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password),
  };

  const errors: string[] = [];

  if (!checks.minLength) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (!checks.hasLowercase) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!checks.hasUppercase) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!checks.hasDigit) {
    errors.push("Password must contain at least one number");
  }
  if (!checks.hasSymbol) {
    errors.push("Password must contain at least one special character");
  }

  const passedChecks = Object.values(checks).filter(Boolean).length;
  const isValid = errors.length === 0;

  let strength: "weak" | "medium" | "strong";
  if (passedChecks <= 2) {
    strength = "weak";
  } else if (passedChecks <= 4) {
    strength = "medium";
  } else {
    strength = "strong";
  }

  return {
    isValid,
    errors,
    strength,
    checks,
  };
}

/**
 * Get password requirements as display strings
 */
export function getPasswordRequirements(): string[] {
  return [
    `At least ${MIN_PASSWORD_LENGTH} characters`,
    "At least one lowercase letter",
    "At least one uppercase letter",
    "At least one number",
    "At least one special character (!@#$%^&*...)",
  ];
}
```

---

## Step 5: Create Unit Tests

### Create `/tests/unit/lib/validation/password.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  validatePassword,
  getPasswordRequirements,
} from "@/lib/validation/password";

describe("validatePassword", () => {
  describe("valid passwords", () => {
    it("should accept a password meeting all requirements", () => {
      const result = validatePassword("SecurePass123!");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.strength).toBe("strong");
    });

    it("should accept complex passwords", () => {
      const result = validatePassword("MyP@ssw0rd!2024");
      expect(result.isValid).toBe(true);
      expect(result.checks.minLength).toBe(true);
      expect(result.checks.hasLowercase).toBe(true);
      expect(result.checks.hasUppercase).toBe(true);
      expect(result.checks.hasDigit).toBe(true);
      expect(result.checks.hasSymbol).toBe(true);
    });
  });

  describe("invalid passwords", () => {
    it("should reject passwords shorter than 12 characters", () => {
      const result = validatePassword("Short1!");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must be at least 12 characters"
      );
      expect(result.checks.minLength).toBe(false);
    });

    it("should reject passwords without lowercase letters", () => {
      const result = validatePassword("ALLUPPERCASE123!");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain at least one lowercase letter"
      );
      expect(result.checks.hasLowercase).toBe(false);
    });

    it("should reject passwords without uppercase letters", () => {
      const result = validatePassword("alllowercase123!");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain at least one uppercase letter"
      );
      expect(result.checks.hasUppercase).toBe(false);
    });

    it("should reject passwords without digits", () => {
      const result = validatePassword("NoDigitsHere!@#");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain at least one number"
      );
      expect(result.checks.hasDigit).toBe(false);
    });

    it("should reject passwords without symbols", () => {
      const result = validatePassword("NoSymbols12345");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain at least one special character"
      );
      expect(result.checks.hasSymbol).toBe(false);
    });

    it("should return multiple errors for passwords failing multiple checks", () => {
      const result = validatePassword("short");
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe("strength calculation", () => {
    it("should return weak for 2 or fewer passed checks", () => {
      const result = validatePassword("ab");
      expect(result.strength).toBe("weak");
    });

    it("should return medium for 3-4 passed checks", () => {
      const result = validatePassword("abcdefghijkl");
      expect(result.strength).toBe("medium");
    });

    it("should return strong for all 5 checks passed", () => {
      const result = validatePassword("SecurePass123!");
      expect(result.strength).toBe("strong");
    });
  });

  describe("edge cases", () => {
    it("should handle empty string", () => {
      const result = validatePassword("");
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBe(5);
    });

    it("should handle exactly 12 characters", () => {
      const result = validatePassword("Abcdefghij1!");
      expect(result.isValid).toBe(true);
      expect(result.checks.minLength).toBe(true);
    });

    it("should accept various special characters", () => {
      const specialChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";
      for (const char of specialChars) {
        const result = validatePassword(`SecurePass1${char}`);
        expect(result.checks.hasSymbol).toBe(true);
      }
    });
  });
});

describe("getPasswordRequirements", () => {
  it("should return 5 requirements", () => {
    const requirements = getPasswordRequirements();
    expect(requirements).toHaveLength(5);
  });

  it("should include minimum length requirement", () => {
    const requirements = getPasswordRequirements();
    expect(requirements.some((r) => r.includes("12"))).toBe(true);
  });
});
```

---

## Step 6: Run Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run only password validation tests
pnpm test tests/unit/lib/validation/password.test.ts
```

---

## Verification Checklist

- [ ] Supabase local instance restarted with new config
- [ ] Password requirements enforced (try signing up with weak password)
- [ ] Email verification required (check Inbucket at http://localhost:54324)
- [ ] Email templates display correctly
- [ ] RLS policies block unauthorized access
- [ ] Password validation utility tests pass
- [ ] Coverage > 65% for validation code

---

## Common Issues

### Issue: Email templates not loading

**Solution**: Ensure the content_path in config.toml is relative to the supabase directory.

### Issue: RLS policies blocking all access

**Solution**: Verify `auth.uid()` returns the expected value. Check JWT claims.

### Issue: Password validation not matching Supabase

**Solution**: Ensure both client-side validation and Supabase config use the same requirements.

---

## Next Steps

After completing this task:

1. **Task 2.1**: Implement signup and email verification endpoints
2. **Task 2.2**: Implement login and logout endpoints
3. **Task 3.1**: Create authentication middleware

See `/docs/decisions/authentication.md` for the full implementation roadmap.
