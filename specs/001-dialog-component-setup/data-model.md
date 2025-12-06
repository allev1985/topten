# Data Model: Dialog Component Setup

**Feature**: 001-dialog-component-setup  
**Date**: 2025-12-04  
**Status**: N/A

## Overview

This feature does not introduce database entities or data models. It provides UI infrastructure (Dialog component) and configuration (Next.js image domains) only.

## Database Impact

**None** - This is a pure UI/configuration feature with no database changes.

## Component State Model

The Dialog component manages local React state for open/close behavior:

```typescript
interface DialogState {
  open: boolean; // Whether dialog is currently displayed
  trigger?: HTMLElement; // Reference to trigger element (for focus return)
}
```

**State Management**:

- Uncontrolled: Dialog manages its own state internally
- Controlled: Parent component manages `open` state via props

**No persistence**: Dialog state is ephemeral (lost on page navigation/refresh)

## Type Definitions

The Dialog component uses TypeScript interfaces from Radix UI:

```typescript
import * as DialogPrimitive from "@radix-ui/react-dialog";

// Component prop types (from Radix UI)
type DialogProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>;
type DialogContentProps = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
>;
type DialogTriggerProps = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Trigger
>;
// ... etc
```

**No custom types defined** - Reuses Radix UI type definitions.

## Data Flow

```
User Interaction
       ↓
Trigger Click/Keyboard
       ↓
Dialog State Update (open: true)
       ↓
Radix UI Portal Rendering
       ↓
Dialog Content Displayed
       ↓
User Action (submit/cancel/ESC)
       ↓
Dialog State Update (open: false)
       ↓
Focus Return to Trigger
```

**No API calls** - Dialog is pure client-side component.

## Related Data Models

When used in TopTen application context, dialogs will interact with existing data models:

- **List deletion**: Dialog confirms deletion of `List` entity (see `001-database-schema`)
- **Place editing**: Dialog contains form for editing `Place` entity
- **Category selection**: Dialog shows `Category` options

**Note**: This feature provides the dialog infrastructure; specific dialogs for list/place/category operations will be implemented in separate features.

## Next.js Image Configuration

The Next.js image configuration does not define data models but configures allowed external domains:

```typescript
// next.config.ts
images: {
  remotePatterns: [
    { protocol: "https", hostname: "placehold.co", pathname: "/**" },
  ];
}
```

**No runtime data**: Configuration is static at build time.

---

## Summary

This feature is **data-model-free**. For component API surface and usage patterns, see:

- **Component API**: `contracts/dialog-component-api.md`
- **Usage Guide**: `quickstart.md`
