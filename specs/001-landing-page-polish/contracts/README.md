# API Contracts

**Phase**: 1 - Design & Contracts  
**Date**: 2025-12-06  
**Status**: N/A - No API Contracts

## Overview

This feature involves **frontend UI polish only**. There are no API changes, new endpoints, or contract modifications required.

---

## Existing API Endpoints (Unchanged)

The landing page interacts with existing authentication endpoints via Supabase Auth, but does not introduce new contracts:

### Authentication (Existing - No Changes)

**POST `/auth/v1/signup`** (Supabase)
- Used by: SignupForm component
- No changes to request/response structure

**POST `/auth/v1/token?grant_type=password`** (Supabase)
- Used by: LoginForm component  
- No changes to request/response structure

---

## Component Contracts (Internal - TypeScript Interfaces)

While there are no API contracts, the following TypeScript interfaces define component contracts. These remain **unchanged**:

### LoginModalProps (Existing)
```typescript
interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string;
}
```

### SignupModalProps (Existing)
```typescript
interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}
```

### HeaderProps (Existing)
```typescript
interface HeaderProps {
  onLogin: () => void;
  onSignup: () => void;
}
```

### ImageConfig (Existing)
```typescript
interface ImageConfig {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  priority: boolean;
  gridClasses: string;
}
```

---

## Summary

**No API contracts** are created or modified for this feature. All work is client-side UI polish and testing.

**Phase 1 Status**: ✅ **COMPLETE** (No contracts needed) - Proceed to quickstart
