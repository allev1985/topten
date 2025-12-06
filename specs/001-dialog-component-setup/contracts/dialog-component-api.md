# Dialog Component API Contract

**Feature**: 001-dialog-component-setup  
**Date**: 2025-12-04  
**Version**: 1.0.0

## Overview

This document defines the API surface for the shadcn/ui Dialog component installed into TopTen. The Dialog component provides accessible modal overlay functionality for user confirmations, forms, and detailed content viewing.

---

## Component Exports

The Dialog component exports the following sub-components:

```typescript
export {
  Dialog,              // Root wrapper component
  DialogPortal,        // Portal for rendering outside DOM hierarchy
  DialogOverlay,       // Backdrop overlay (included in DialogContent)
  DialogClose,         // Close button component
  DialogTrigger,       // Trigger element wrapper
  DialogContent,       // Main content container (includes overlay + close)
  DialogHeader,        // Semantic header wrapper
  DialogFooter,        // Semantic footer wrapper
  DialogTitle,         // Accessible title component (required)
  DialogDescription,   // Accessible description component (recommended)
}
```

**Import Path**: `@/components/ui/dialog`

---

## Component Prop Interfaces

### `Dialog` (Root Component)

```typescript
interface DialogProps {
  open?: boolean;                    // Controlled open state
  defaultOpen?: boolean;             // Uncontrolled default state
  onOpenChange?: (open: boolean) => void;  // State change callback
  modal?: boolean;                   // Whether to render as modal (default: true)
}
```

**Usage**:
- **Uncontrolled**: Omit `open` prop, Dialog manages state internally
- **Controlled**: Provide `open` and `onOpenChange` for external state management

**Example**:
```tsx
// Uncontrolled
<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>...</DialogContent>
</Dialog>

// Controlled
const [open, setOpen] = useState(false);
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>...</DialogContent>
</Dialog>
```

---

### `DialogTrigger`

```typescript
interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;  // Use child element as trigger (default: false)
}
```

**Best Practice**: Use `asChild` when trigger is a custom component (e.g., Button)

**Example**:
```tsx
import { Button } from "@/components/ui/button";

<DialogTrigger asChild>
  <Button variant="outline">Delete List</Button>
</DialogTrigger>
```

---

### `DialogContent`

```typescript
interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;  // ESC key handler
  onPointerDownOutside?: (event: PointerDownOutsideEvent) => void;  // Overlay click
  onInteractOutside?: (event: InteractOutsideEvent) => void;  // Any outside interaction
}
```

**Default Behavior**:
- ESC key closes dialog
- Clicking overlay closes dialog
- Focus trapped within dialog

**Preventing Default Close**:
```tsx
<DialogContent 
  onEscapeKeyDown={(e) => e.preventDefault()}
  onPointerDownOutside={(e) => e.preventDefault()}
>
  {/* Dialog cannot be closed via ESC or overlay click */}
</DialogContent>
```

---

### `DialogHeader`, `DialogFooter`

```typescript
interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
}

type DialogFooterProps = DialogHeaderProps;  // Same interface
```

**Purpose**: Semantic wrappers for dialog layout sections

**Styling**:
- `DialogHeader`: Flex column with bottom spacing
- `DialogFooter`: Flex row (reversed on mobile), right-aligned on desktop

**Example**:
```tsx
<DialogContent>
  <DialogHeader>
    <DialogTitle>Confirm Deletion</DialogTitle>
    <DialogDescription>This action cannot be undone.</DialogDescription>
  </DialogHeader>
  
  {/* Main content here */}
  
  <DialogFooter>
    <Button variant="outline">Cancel</Button>
    <Button variant="destructive">Delete</Button>
  </DialogFooter>
</DialogContent>
```

---

### `DialogTitle`

```typescript
interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  className?: string;
  children: React.ReactNode;
}
```

**Required**: Every dialog MUST include `DialogTitle` for accessibility (`aria-labelledby`)

**Rendered As**: `<h2>` element by default

**Example**:
```tsx
<DialogTitle>Are you absolutely sure?</DialogTitle>
```

---

### `DialogDescription`

```typescript
interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  className?: string;
  children: React.ReactNode;
}
```

**Recommended**: Provide description for context (used for `aria-describedby`)

**Rendered As**: `<p>` element

**Example**:
```tsx
<DialogDescription>
  This will permanently delete your list and all associated places.
  This action cannot be undone.
</DialogDescription>
```

---

### `DialogClose`

```typescript
interface DialogCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  className?: string;
}
```

**Purpose**: Programmatic close trigger (alternative to overlay/ESC)

**Example**:
```tsx
<DialogFooter>
  <DialogClose asChild>
    <Button variant="outline">Cancel</Button>
  </DialogClose>
  <Button variant="destructive" onClick={handleDelete}>
    Delete
  </Button>
</DialogFooter>
```

---

## Accessibility Features

### Automatic ARIA Attributes

Radix UI automatically applies:

```html
<div role="dialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-desc">
  <h2 id="dialog-title">Title</h2>
  <p id="dialog-desc">Description</p>
</div>
```

### Keyboard Interactions

| Key | Action |
|-----|--------|
| **ESC** | Closes dialog, returns focus to trigger |
| **Tab** | Cycles focus forward through focusable elements |
| **Shift+Tab** | Cycles focus backward through focusable elements |
| **Enter** | Activates focused button/link |
| **Space** | Activates focused button |

### Focus Management

1. **On Open**: Focus moves to first focusable element or dialog container
2. **Trap**: Tab navigation confined to dialog (cannot tab outside)
3. **On Close**: Focus returns to trigger element

---

## Usage Patterns

### Pattern 1: Confirmation Dialog

**Use Case**: Confirming destructive actions (delete, archive, cancel)

```tsx
function DeleteListDialog({ listId, listName }: { listId: string; listName: string }) {
  const [open, setOpen] = useState(false);
  
  async function handleDelete() {
    await deleteList(listId);
    setOpen(false);
    // Redirect or update UI
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete List</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete "{listName}"?</DialogTitle>
          <DialogDescription>
            This will permanently delete your list and all associated places.
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleDelete}>
            Delete Permanently
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Pattern 2: Form Input Dialog

**Use Case**: Creating/editing entities without full-page navigation

```tsx
'use client';

import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function CreateListDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createList({ name });
    setOpen(false);
    setName('');
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create New List</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New List</DialogTitle>
            <DialogDescription>
              Start curating your favorite places in a new collection.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">List Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Favorite Coffee Shops"
                required
              />
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Create List</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Pattern 3: Information/Detail View

**Use Case**: Showing additional information without navigation

```tsx
function PlaceDetailsDialog({ place }: { place: Place }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost">View Details</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{place.name}</DialogTitle>
          <DialogDescription>{place.address}</DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4">
          <div>
            <h3 className="font-semibold">Description</h3>
            <p>{place.description}</p>
          </div>
          
          <div>
            <h3 className="font-semibold">Hours</h3>
            <p>{place.hours}</p>
          </div>
          
          {place.imageUrl && (
            <Image
              src={place.imageUrl}
              alt={place.name}
              width={600}
              height={400}
              className="rounded-lg"
            />
          )}
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Styling Customization

### Custom Width

```tsx
<DialogContent className="max-w-2xl">
  {/* Wider dialog (default is max-w-lg) */}
</DialogContent>
```

### Full-Screen on Mobile

```tsx
<DialogContent className="sm:max-w-lg max-w-full h-screen sm:h-auto">
  {/* Full screen on mobile, modal on desktop */}
</DialogContent>
```

### Custom Animation

```tsx
<DialogContent className="data-[state=open]:animate-in data-[state=closed]:animate-out">
  {/* Custom enter/exit animations using Tailwind */}
</DialogContent>
```

---

## Testing Checklist

When implementing dialogs, verify:

- [ ] `DialogTitle` provided for every dialog
- [ ] `DialogDescription` provided for context (if applicable)
- [ ] Trigger uses `asChild` when custom component
- [ ] ESC key closes dialog
- [ ] Overlay click closes dialog (or explicitly prevented)
- [ ] Focus returns to trigger on close
- [ ] Tab navigation stays within dialog
- [ ] Screen reader announces title and description
- [ ] Form validation errors displayed without closing dialog
- [ ] Successful form submission closes dialog

---

## Migration from Other Dialog Libraries

### From react-modal

```tsx
// Before (react-modal)
<Modal isOpen={isOpen} onRequestClose={close}>
  <h2>Title</h2>
  <p>Content</p>
  <button onClick={close}>Close</button>
</Modal>

// After (shadcn Dialog)
<Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    <p>Content</p>
    <DialogFooter>
      <DialogClose asChild>
        <Button>Close</Button>
      </DialogClose>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### From Headless UI

```tsx
// Before (Headless UI)
<Dialog open={isOpen} onClose={setIsOpen}>
  <Dialog.Panel>
    <Dialog.Title>Title</Dialog.Title>
    <Dialog.Description>Description</Dialog.Description>
  </Dialog.Panel>
</Dialog>

// After (shadcn Dialog)
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

---

## Common Pitfalls

### ❌ Missing DialogTitle

```tsx
// BAD - No DialogTitle
<DialogContent>
  <p>Are you sure?</p>
</DialogContent>

// GOOD
<DialogContent>
  <DialogHeader>
    <DialogTitle>Confirm Action</DialogTitle>
  </DialogHeader>
  <p>Are you sure?</p>
</DialogContent>
```

### ❌ Not Using asChild on Custom Triggers

```tsx
// BAD - Button wrapped in default button
<DialogTrigger>
  <Button>Open</Button>
</DialogTrigger>

// GOOD - asChild prevents button nesting
<DialogTrigger asChild>
  <Button>Open</Button>
</DialogTrigger>
```

### ❌ Preventing Close Without Explanation

```tsx
// BAD - User trapped without understanding why
<DialogContent onEscapeKeyDown={(e) => e.preventDefault()}>
  {/* No explanation */}
</DialogContent>

// GOOD - Explain why dialog cannot be closed
<DialogContent onEscapeKeyDown={(e) => e.preventDefault()}>
  <DialogHeader>
    <DialogTitle>Processing...</DialogTitle>
    <DialogDescription>
      Please wait while we save your changes. This dialog will close automatically.
    </DialogDescription>
  </DialogHeader>
</DialogContent>
```

---

## Performance Considerations

### Lazy Loading Dialog Content

```tsx
function LazyDialog() {
  const [open, setOpen] = useState(false);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Open</Button>
      </DialogTrigger>
      {open && (
        <DialogContent>
          {/* Content only rendered when dialog open */}
          <ExpensiveComponent />
        </DialogContent>
      )}
    </Dialog>
  );
}
```

### Memoizing Dialog Content

```tsx
const MemoizedDialogContent = memo(function DialogContent({ data }: Props) {
  return (
    <DialogContent>
      {/* Expensive rendering */}
    </DialogContent>
  );
});
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-04 | Initial API contract for shadcn/ui Dialog component |

---

## Related Documentation

- **Quickstart Guide**: `quickstart.md`
- **Research**: `research.md` (R3: Dialog Accessibility Patterns)
- **Radix UI Docs**: https://www.radix-ui.com/primitives/docs/components/dialog
- **shadcn/ui Docs**: https://ui.shadcn.com/docs/components/dialog
