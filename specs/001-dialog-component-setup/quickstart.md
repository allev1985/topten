# Quickstart: Dialog Component and Placeholder Images

**Feature**: 001-dialog-component-setup  
**Date**: 2025-12-04  
**Audience**: Developers implementing modal dialogs in TopTen

## Prerequisites

Before using the Dialog component:

- ✅ Dialog component installed via shadcn CLI
- ✅ Next.js image configuration updated for placehold.co
- ✅ Build succeeds without errors

## Verification

### 1. Verify Dialog Component Installed

```bash
ls src/components/ui/dialog.tsx
```

**Expected**: File exists with Dialog component exports

### 2. Verify Image Configuration

```bash
grep -A 5 "images:" next.config.ts
```

**Expected**: `remotePatterns` includes placehold.co configuration

### 3. Verify Build Succeeds

```bash
pnpm build
```

**Expected**: ✓ Compiled successfully (no errors)

---

## Quick Start: Your First Dialog

### Step 1: Import Dialog Components

Create a new file or add to existing component:

```tsx
// src/components/examples/simple-dialog.tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
```

### Step 2: Create a Simple Dialog

```tsx
export function SimpleDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hello Dialog</DialogTitle>
          <DialogDescription>
            This is a simple dialog example for TopTen.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p>Your dialog content goes here!</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Step 3: Use in a Page

```tsx
// src/app/test-dialog/page.tsx
import { SimpleDialog } from "@/components/examples/simple-dialog";

export default function TestPage() {
  return (
    <main className="container mx-auto py-8">
      <h1 className="mb-4 text-2xl font-bold">Dialog Test</h1>
      <SimpleDialog />
    </main>
  );
}
```

### Step 4: Test It

```bash
pnpm dev
```

Navigate to `http://localhost:3000/test-dialog`

**Expected behavior**:

- ✅ "Open Dialog" button visible
- ✅ Click button → dialog appears with overlay
- ✅ ESC key → dialog closes
- ✅ Click overlay → dialog closes
- ✅ Focus returns to button when closed

---

## Common Use Cases

### Use Case 1: Confirmation Dialog

Perfect for destructive actions like delete, archive, or cancel.

```tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function DeleteListDialog({ listName }: { listName: string }) {
  const [open, setOpen] = useState(false);

  async function handleDelete() {
    // TODO: Call API to delete list
    console.log("Deleting list:", listName);
    setOpen(false);
    // Redirect or show success message
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

**Usage**:

```tsx
<DeleteListDialog listName="My Coffee Shops" />
```

---

### Use Case 2: Form Input Dialog

For creating or editing entities without full-page navigation.

```tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateListDialog() {
  const [open, setOpen] = useState(false);
  const [listName, setListName] = useState("");
  const [description, setDescription] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // TODO: Call API to create list
    console.log("Creating list:", { listName, description });

    // Close dialog and reset form
    setOpen(false);
    setListName("");
    setDescription("");
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
              <Label htmlFor="listName">List Name</Label>
              <Input
                id="listName"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="My Favorite Coffee Shops"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="The best coffee spots in Seattle"
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Create List</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**Usage**:

```tsx
<CreateListDialog />
```

---

### Use Case 3: Information/Detail View

For showing additional information without leaving the current page.

```tsx
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface Place {
  name: string;
  address: string;
  description: string;
  imageUrl?: string;
}

export function PlaceDetailsDialog({ place }: { place: Place }) {
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

        <div className="grid gap-4 py-4">
          {place.imageUrl && (
            <Image
              src={place.imageUrl}
              alt={place.name}
              width={600}
              height={400}
              className="h-auto w-full rounded-lg"
            />
          )}

          <div>
            <h3 className="mb-2 font-semibold">About</h3>
            <p className="text-muted-foreground text-sm">{place.description}</p>
          </div>
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

**Usage**:

```tsx
<PlaceDetailsDialog
  place={{
    name: "Blue Bottle Coffee",
    address: "1103 E Pike St, Seattle, WA",
    description: "Specialty coffee roaster with minimalist aesthetic.",
    imageUrl: "https://placehold.co/600x400?text=Blue+Bottle",
  }}
/>
```

---

## Using Placeholder Images

### Basic Placeholder Image

```tsx
import Image from "next/image";

export function PlaceholderExample() {
  return (
    <Image
      src="https://placehold.co/600x400"
      alt="Placeholder image"
      width={600}
      height={400}
      className="rounded-lg"
    />
  );
}
```

### Placeholder Patterns for TopTen

#### List Hero Image (Landscape)

```tsx
<Image
  src="https://placehold.co/1200x600?text=Coffee+Shops"
  alt="List hero"
  width={1200}
  height={600}
  className="h-auto w-full rounded-lg"
/>
```

#### Place Card Thumbnail (Square)

```tsx
<Image
  src="https://placehold.co/300?text=Place+Name"
  alt="Place thumbnail"
  width={300}
  height={300}
  className="rounded-md object-cover"
/>
```

#### Creator Avatar (Circle)

```tsx
<Image
  src="https://placehold.co/200?text=@username"
  alt="Creator avatar"
  width={200}
  height={200}
  className="rounded-full"
/>
```

#### Category Banner (Wide)

```tsx
<Image
  src="https://placehold.co/1920x400?text=Restaurants"
  alt="Category banner"
  width={1920}
  height={400}
  className="h-auto w-full"
/>
```

### Responsive Placeholder Images

```tsx
<div className="relative aspect-video w-full">
  <Image
    src="https://placehold.co/1200x675?text=Hero+Image"
    alt="Hero"
    fill
    className="rounded-lg object-cover"
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  />
</div>
```

### Placeholder with Custom Colors

```tsx
// Orange background, white text
<Image
  src="https://placehold.co/400x300/orange/white?text=Custom+Colors"
  alt="Colored placeholder"
  width={400}
  height={300}
/>
```

---

## Best Practices

### ✅ DO

- **Always provide DialogTitle** for accessibility
- **Use `asChild` on DialogTrigger** when trigger is custom component (e.g., Button)
- **Provide DialogDescription** for context
- **Test keyboard navigation** (ESC, Tab, Enter)
- **Use controlled state** when you need to programmatically open/close dialog
- **Reset form state** when dialog closes after submission
- **Use meaningful alt text** for placeholder images

### ❌ DON'T

- **Don't nest dialogs** (use single modal at a time)
- **Don't forget to handle form validation** (show errors without closing dialog)
- **Don't override focus management** without good reason
- **Don't prevent dialog close** without explaining why to user
- **Don't ship placeholder images to production** (replace with real content)

---

## Accessibility Checklist

When implementing dialogs, verify:

- [ ] `DialogTitle` provided for every dialog
- [ ] `DialogDescription` provided for context
- [ ] ESC key closes dialog
- [ ] Overlay click closes dialog (or explicitly prevented with explanation)
- [ ] Focus moves to dialog on open
- [ ] Focus returns to trigger on close
- [ ] Tab navigation stays within dialog
- [ ] Screen reader announces title and description
- [ ] All interactive elements have visible focus indicators
- [ ] Form validation errors displayed without closing dialog

---

## Testing Your Dialog

### Manual Testing

1. **Open dialog**: Click trigger button
2. **Keyboard navigation**: Press Tab to cycle through focusable elements
3. **Close with ESC**: Press ESC key
4. **Close with overlay**: Click outside dialog
5. **Focus return**: Verify focus returns to trigger after close

### Automated Testing (Example)

```typescript
// tests/unit/components/simple-dialog.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SimpleDialog } from '@/components/examples/simple-dialog';

test('dialog opens and closes', async () => {
  const user = userEvent.setup();
  render(<SimpleDialog />);

  // Dialog closed initially
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

  // Open dialog
  await user.click(screen.getByRole('button', { name: /open/i }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();

  // Close with ESC
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
```

---

## Troubleshooting

### Problem: Dialog doesn't close with ESC

**Cause**: Event handler preventing default behavior

**Solution**: Remove or conditionally apply `onEscapeKeyDown` handler

```tsx
// BAD
<DialogContent onEscapeKeyDown={(e) => e.preventDefault()}>

// GOOD (only prevent when necessary)
<DialogContent onEscapeKeyDown={(e) => {
  if (isFormDirty) {
    e.preventDefault();
    // Show confirmation
  }
}}>
```

### Problem: Image not loading (broken image icon)

**Cause**: Domain not configured in `next.config.ts`

**Solution**: Verify `remotePatterns` includes correct domain

```bash
grep -A 10 "images:" next.config.ts
```

### Problem: Button inside button warning

**Cause**: Not using `asChild` on DialogTrigger

**Solution**:

```tsx
// BAD
<DialogTrigger>
  <Button>Open</Button>  {/* Button inside button! */}
</DialogTrigger>

// GOOD
<DialogTrigger asChild>
  <Button>Open</Button>  {/* asChild merges props */}
</DialogTrigger>
```

### Problem: Focus not returning to trigger

**Cause**: Trigger element removed from DOM before dialog closes

**Solution**: Keep trigger element mounted, or use controlled state to manage properly

---

## Next Steps

1. ✅ **Read Component API**: See `contracts/dialog-component-api.md` for full prop reference
2. ✅ **Read Image Config**: See `contracts/nextjs-image-config.md` for advanced patterns
3. ✅ **Write tests**: Add accessibility and interaction tests for your dialogs
4. ✅ **Replace placeholders**: Before production, replace all placehold.co URLs with real images

---

## Resources

- **Component API Reference**: `contracts/dialog-component-api.md`
- **Image Configuration**: `contracts/nextjs-image-config.md`
- **Research Findings**: `research.md`
- **Radix UI Dialog Docs**: https://www.radix-ui.com/primitives/docs/components/dialog
- **shadcn/ui Dialog**: https://ui.shadcn.com/docs/components/dialog
- **Next.js Image**: https://nextjs.org/docs/app/api-reference/components/image
- **placehold.co**: https://placehold.co/

---

## Examples in TopTen

After implementation, look for these real-world examples:

- **Delete list confirmation** (destructive action pattern)
- **Create new list form** (form input pattern)
- **Place details view** (information display pattern)
- **Category selection** (selection pattern)

---

**Ready to build?** Start with the simple dialog example above and expand from there!
