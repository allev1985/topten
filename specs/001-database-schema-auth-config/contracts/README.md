# API Contracts: Database Schema & Supabase Auth Configuration

**Feature**: Task 1.2 - Database Schema & Supabase Auth Configuration  
**Date**: 2025-11-29

## Overview

This task focuses on database configuration and does not introduce new API endpoints. The authentication API endpoints will be defined in subsequent tasks:

- **Task 2.1**: `/api/auth/signup` and `/api/auth/verify` endpoints
- **Task 2.2**: `/api/auth/login` and `/api/auth/logout` endpoints
- **Task 2.3**: `/api/auth/password/reset` and `/api/auth/password` endpoints
- **Task 2.4**: `/api/auth/refresh` and `/api/auth/session` endpoints

## Configuration Contracts

This task establishes the following configuration contracts:

### Supabase Auth Configuration

| Setting                   | Value                                | Description                 |
| ------------------------- | ------------------------------------ | --------------------------- |
| `minimum_password_length` | 12                                   | Minimum characters required |
| `password_requirements`   | `lower_upper_letters_digits_symbols` | Complexity level            |
| `enable_confirmations`    | true                                 | Email verification required |

### RLS Policy Contract

| Table       | Policy                        | Description                           |
| ----------- | ----------------------------- | ------------------------------------- |
| users       | `users_select_own`            | User can select own profile           |
| users       | `users_select_public`         | Anyone can view non-deleted profiles  |
| users       | `users_update_own`            | User can update own profile           |
| users       | `users_insert_own`            | User can create own profile           |
| lists       | `lists_select_own`            | User can select own lists             |
| lists       | `lists_select_published`      | Anyone can view published lists       |
| lists       | `lists_insert_own`            | User can create own lists             |
| lists       | `lists_update_own`            | User can update own lists             |
| places      | `places_select_all`           | Anyone can view places                |
| places      | `places_insert_authenticated` | Authenticated users can add places    |
| places      | `places_update_authenticated` | Authenticated users can update places |
| list_places | `list_places_select_via_list` | Based on list visibility              |
| list_places | `list_places_insert_owner`    | List owner can add places             |
| list_places | `list_places_update_owner`    | List owner can update                 |
| list_places | `list_places_delete_owner`    | List owner can remove                 |

## Password Validation Contract

### Interface

```typescript
interface PasswordValidationResult {
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
```

### Function Signature

```typescript
function validatePassword(password: string): PasswordValidationResult;
function getPasswordRequirements(): string[];
```

## Related Documentation

- [Data Model](./data-model.md) - Full RLS policy definitions
- [Research](./research.md) - Design decisions and rationale
- [Quickstart](./quickstart.md) - Implementation guide
