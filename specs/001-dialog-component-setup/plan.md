# Implementation Plan: Dialog Component and Image Configuration Setup

**Branch**: `001-dialog-component-setup` | **Date**: 2025-12-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-dialog-component-setup/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature establishes foundational UI infrastructure for TopTen by:
1. Installing the shadcn/ui Dialog component to enable modal overlay functionality for user confirmations, forms, and detailed content viewing
2. Configuring Next.js to allow external placeholder images from placehold.co domain for development and testing purposes

The Dialog component provides accessible, keyboard-navigable modal overlays essential for critical user interactions (delete confirmations, detail views, form submissions). The image configuration enables realistic page layout previews during development using placeholder content.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js >=20.0.0  
**Primary Dependencies**: 
- Next.js 16.0.5 (App Router with React 19.2.0)
- shadcn/ui component library (new-york style, RSC-enabled)
- Radix UI primitives (@radix-ui/react-dialog for Dialog component)
- Tailwind CSS 4.x for styling
- pnpm >=8.0.0 package manager

**Storage**: N/A (UI-only feature, no data persistence)  
**Testing**: 
- Vitest for component unit tests
- React Testing Library for component interaction testing
- Playwright for E2E modal interaction flows

**Target Platform**: Web browsers (Next.js SSR/RSC application)
**Project Type**: Web application (Next.js App Router)  
**Performance Goals**: 
- Modal open/close animations <300ms
- External placeholder images load within 2 seconds on standard network
- No blocking of page interactivity during image loading

**Constraints**: 
- Dialog component must maintain accessibility (WCAG 2.1 AA)
- Keyboard navigation support (ESC, Tab, Enter)
- Screen reader compatibility
- External image domains configured at build time only

**Scale/Scope**: 
- Single Dialog component installation
- One Next.js configuration change (remotePatterns)
- Foundation for future modal-based interactions across application

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality & Maintainability
- ✅ **PASS**: Dialog component installation uses shadcn/ui CLI (standard tooling, no custom implementation)
- ✅ **PASS**: Configuration changes are minimal and follow Next.js documented patterns
- ✅ **PASS**: Reusing existing shadcn/ui infrastructure (components.json already configured)
- ✅ **PASS**: No code duplication - leveraging existing component library pattern established by Button, Card, Alert, etc.

### II. Testing Discipline & Safety Nets
- ✅ **PASS**: Component tests will verify Dialog accessibility (keyboard navigation, ESC key)
- ✅ **PASS**: E2E tests will validate modal open/close/dismiss interactions
- ✅ **PASS**: Build validation ensures no configuration errors
- ✅ **PASS**: Image loading tests verify external domain configuration

### III. User Experience Consistency
- ✅ **PASS**: Dialog follows existing shadcn/ui design system (new-york style, matches Button, Card)
- ✅ **PASS**: Keyboard patterns consistent with standard web accessibility practices
- ✅ **PASS**: Visual consistency maintained through Tailwind theme variables

### IV. Performance & Resource Efficiency
- ✅ **PASS**: Performance targets clearly defined (<300ms animations, 2s image load)
- ✅ **PASS**: External images configured to not block page interactivity
- ✅ **PASS**: Minimal bundle impact (Radix UI Dialog is tree-shakeable)

### V. Observability & Debuggability
- ✅ **PASS**: Build errors will surface immediately if configuration is incorrect
- ✅ **PASS**: Browser DevTools will show image loading errors if domain misconfigured
- ⚠️ **ADVISORY**: Consider adding console warnings if modal stacking occurs (edge case)

**Overall Status**: ✅ **APPROVED** - No constitution violations. All principles satisfied.

## Project Structure

### Documentation (this feature)

```text
specs/001-dialog-component-setup/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output - Dialog component patterns, Next.js image config
├── data-model.md        # Phase 1 output - N/A (no database entities)
├── quickstart.md        # Phase 1 output - Usage examples for Dialog component
├── contracts/           # Phase 1 output - Component API surface
│   └── dialog-component-api.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── components/
│   └── ui/
│       ├── dialog.tsx           # NEW: shadcn/ui Dialog component
│       ├── button.tsx           # Existing (used in Dialog)
│       ├── card.tsx             # Existing
│       ├── input.tsx            # Existing (may be used in Dialog content)
│       └── label.tsx            # Existing (may be used in Dialog content)
├── app/
│   └── globals.css              # Existing (Dialog styles will be added)
└── lib/
    └── utils/
        └── styling/
            └── cn.ts            # Existing (used by all shadcn components)

next.config.ts                    # MODIFIED: Add remotePatterns for placehold.co
components.json                   # Existing (shadcn/ui config, no changes needed)

tests/
├── unit/
│   └── components/
│       └── ui/
│           └── dialog.test.tsx  # NEW: Component accessibility tests
└── e2e/
    └── dialog-interactions.spec.ts  # NEW: Modal flow E2E tests
```

**Structure Decision**: This feature follows the existing Next.js App Router structure with shadcn/ui components in `src/components/ui/`. The Dialog component will be installed via shadcn CLI into the established pattern, maintaining consistency with existing Button, Card, Alert, Input, and Label components. No new directories required - all changes integrate into existing structure.

## Complexity Tracking

> **No complexity violations detected** - This section intentionally left empty as the Constitution Check passed all gates without requiring justification.

---

## Phase 0: Research & Discovery

**Objective**: Resolve technical unknowns and establish best practices for Dialog implementation and Next.js image configuration.

### Research Tasks

#### R1: shadcn/ui Dialog Component Installation
**Question**: What is the exact process and requirements for installing the Dialog component via shadcn CLI?

**Research Areas**:
- shadcn/ui Dialog component dependencies (@radix-ui/react-dialog)
- Installation command syntax and options
- Files generated and modified during installation
- Integration with existing components.json configuration
- Compatibility with Next.js 16 and React 19

**Expected Output**: Step-by-step installation procedure with any prerequisites or configuration requirements.

---

#### R2: Next.js Image Domain Configuration
**Question**: What is the correct syntax and structure for configuring external image domains in Next.js 16?

**Research Areas**:
- Next.js 16 `next.config.ts` image configuration patterns
- `remotePatterns` vs `domains` configuration (Next.js 13+ best practices)
- Protocol, hostname, and path pattern syntax
- TypeScript typing for NextConfig
- Build-time validation and error handling

**Expected Output**: Exact configuration snippet with TypeScript types and explanation of pattern matching rules.

---

#### R3: Dialog Accessibility Patterns
**Question**: What are the WCAG 2.1 AA requirements for modal dialogs and how does Radix UI Dialog satisfy them?

**Research Areas**:
- ARIA roles and attributes for dialogs (`role="dialog"`, `aria-modal`, `aria-labelledby`)
- Focus management (trap, return focus on close)
- Keyboard interactions (ESC to close, Tab navigation)
- Screen reader announcements
- Radix UI Dialog accessibility features out-of-the-box

**Expected Output**: Accessibility checklist and validation strategy for testing.

---

#### R4: Modal Stacking and Edge Cases
**Question**: How should the application handle edge cases like multiple simultaneous modals or navigation during modal display?

**Research Areas**:
- Radix UI Dialog's behavior with multiple instances
- Next.js App Router navigation with open modals
- Focus management across nested dialogs
- Best practices for preventing modal stacking in TopTen's architecture

**Expected Output**: Decision on modal stacking policy and implementation approach.

---

#### R5: Testing Strategy for Dialog Component
**Question**: What testing approach best validates Dialog accessibility and interaction patterns?

**Research Areas**:
- React Testing Library best practices for modal components
- Testing keyboard interactions (ESC, Tab, Enter)
- Testing focus management and ARIA attributes
- Playwright E2E patterns for modal workflows
- Testing external image loading with Next.js Image component

**Expected Output**: Testing approach document with specific test scenarios and tooling recommendations.

---

### Research Deliverable

**File**: `specs/001-dialog-component-setup/research.md`

**Structure**:
```markdown
# Research: Dialog Component and Image Configuration

## R1: shadcn/ui Dialog Installation
- Decision: [installation approach]
- Command: [exact CLI command]
- Dependencies added: [packages]
- Files modified: [list]

## R2: Next.js Image Configuration
- Decision: [remotePatterns vs domains]
- Configuration: [exact code snippet]
- Rationale: [why this approach]

## R3: Accessibility Requirements
- WCAG Requirements: [checklist]
- Radix UI Coverage: [what's provided]
- Additional Implementation: [what we need to add]

## R4: Modal Edge Cases
- Stacking Policy: [allow/prevent multiple modals]
- Navigation Behavior: [what happens on route change]
- Implementation: [approach]

## R5: Testing Strategy
- Unit Tests: [approach and tools]
- E2E Tests: [scenarios and tools]
- Accessibility Tests: [validation method]
```

---

## Phase 1: Design & Contracts

**Objective**: Define component API surface, usage patterns, and configuration contracts.

### D1: Data Model (N/A)

**Status**: Not applicable - this feature involves UI components and configuration only, no database entities.

**File**: `specs/001-dialog-component-setup/data-model.md` will contain:
```markdown
# Data Model: Dialog Component Setup

This feature does not introduce database entities or data models. It provides UI infrastructure only.

See `contracts/dialog-component-api.md` for component API surface.
```

---

### D2: Component API Contract

**File**: `specs/001-dialog-component-setup/contracts/dialog-component-api.md`

**Content Structure**:
```markdown
# Dialog Component API

## Component Export Structure

### Dialog Root Components
- `Dialog` - Root wrapper component
- `DialogTrigger` - Element that opens the dialog
- `DialogContent` - Main content container
- `DialogHeader` - Header section
- `DialogFooter` - Footer section
- `DialogTitle` - Accessible title
- `DialogDescription` - Accessible description
- `DialogClose` - Close trigger element

## Props Interface

### Dialog
```typescript
interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  modal?: boolean;
}
```

### DialogContent
```typescript
interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  className?: string;
  children: React.ReactNode;
}
```

## Usage Examples

### Basic Confirmation Dialog
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Delete List</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button variant="destructive">Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Form Input Dialog
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Create List</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>New List</DialogTitle>
      <DialogDescription>
        Create a new collection of your favorite places.
      </DialogDescription>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" placeholder="My Favorite Coffee Shops" />
      </div>
    </div>
    <DialogFooter>
      <Button type="submit">Create</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Accessibility Contract

- `DialogTitle` MUST be provided for all dialogs
- `DialogDescription` SHOULD be provided for context
- Focus automatically moves to dialog on open
- Focus returns to trigger on close
- ESC key closes dialog
- Clicking overlay closes dialog (configurable)
- Tab navigation trapped within dialog
- ARIA attributes automatically applied by Radix UI
```

---

### D3: Next.js Configuration Contract

**File**: `specs/001-dialog-component-setup/contracts/nextjs-image-config.md`

**Content Structure**:
```markdown
# Next.js Image Configuration Contract

## Configuration Location
File: `next.config.ts`

## Remote Image Pattern for placehold.co

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
```

## Configuration Details

- **Protocol**: `https` only (placehold.co requires HTTPS)
- **Hostname**: `placehold.co` (exact match)
- **Port**: Empty string (default HTTPS port 443)
- **Pathname**: `/**` (matches all paths)

## Usage with Next.js Image Component

```tsx
import Image from 'next/image';

<Image
  src="https://placehold.co/600x400"
  alt="Placeholder image"
  width={600}
  height={400}
/>
```

## Build Validation

The configuration is validated at build time:
- Invalid hostnames will cause build errors
- Missing protocol/pathname will be flagged
- TypeScript ensures correct NextConfig typing
```

---

### D4: Quickstart Guide

**File**: `specs/001-dialog-component-setup/quickstart.md`

**Content Structure**:
```markdown
# Quickstart: Using Dialog Component

## Installation Verification

After installation, verify the Dialog component is available:

```bash
ls src/components/ui/dialog.tsx
```

## Basic Usage

### 1. Import the Dialog components

```tsx
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

### 2. Create a simple dialog

```tsx
export function SimpleDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>
            This is a description of what the dialog is for.
          </DialogDescription>
        </DialogHeader>
        <div>
          {/* Your dialog content here */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 3. Controlled Dialog State

```tsx
'use client';

import { useState } from 'react';

export function ControlledDialog() {
  const [open, setOpen] = useState(false);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Open</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Controlled Dialog</DialogTitle>
        </DialogHeader>
        <Button onClick={() => setOpen(false)}>Close</Button>
      </DialogContent>
    </Dialog>
  );
}
```

## Placeholder Images

### Using placehold.co in Next.js

```tsx
import Image from 'next/image';

<Image
  src="https://placehold.co/400x300"
  alt="Placeholder"
  width={400}
  height={300}
  className="rounded-lg"
/>
```

### Common Placeholder Patterns

- Square: `https://placehold.co/400`
- Landscape: `https://placehold.co/600x400`
- Portrait: `https://placehold.co/400x600`
- Custom text: `https://placehold.co/400x300?text=Your+Text`

## Accessibility Tips

✅ **DO**: Always provide `DialogTitle` and `DialogDescription`
✅ **DO**: Use `asChild` on `DialogTrigger` for custom trigger components
✅ **DO**: Test keyboard navigation (Tab, Esc, Enter)

❌ **DON'T**: Nest dialogs (use single modal at a time)
❌ **DON'T**: Forget to handle form submission in dialog content
❌ **DON'T**: Override focus management without good reason

## Testing Your Dialog

```tsx
// Example test with React Testing Library
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('dialog opens and closes', async () => {
  const user = userEvent.setup();
  render(<SimpleDialog />);
  
  // Dialog should be closed initially
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  
  // Open dialog
  await user.click(screen.getByRole('button', { name: /open/i }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  
  // Close with ESC key
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
```
```

---

### D5: Agent Context Update

**Action**: Run `.specify/scripts/bash/update-agent-context.sh copilot` after completing Phase 1 deliverables.

**Purpose**: Update `.github/copilot-instructions.md` with new Dialog component usage patterns and Next.js image configuration.

**Expected Additions**:
- Dialog component import patterns
- Modal interaction best practices
- External image configuration reference
- Testing patterns for modal components

---

## Phase 2: Task Planning

**Status**: ⏸️ **Phase 2 is executed by `/speckit.tasks` command**

The `/speckit.plan` command stops after Phase 1. Task breakdown will be generated in a separate step.

**Expected Task Categories** (preview for context):

1. **Component Installation Tasks**
   - Run shadcn CLI to install Dialog component
   - Verify generated files and dependencies
   - Validate component imports and exports

2. **Configuration Tasks**
   - Update next.config.ts with remotePatterns
   - Validate build succeeds with new configuration
   - Test image loading from placehold.co

3. **Testing Tasks**
   - Write Dialog component accessibility tests
   - Write E2E tests for modal interactions
   - Write image loading validation tests
   - Verify all tests pass

4. **Documentation Tasks**
   - Update component documentation
   - Add usage examples
   - Document accessibility requirements

5. **Validation Tasks**
   - Run full test suite
   - Verify build succeeds
   - Check accessibility with automated tools
   - Manual QA of keyboard navigation

---

## Constitution Re-Check (Post-Design)

*Re-evaluating constitution compliance after Phase 1 design decisions*

### I. Code Quality & Maintainability
- ✅ **PASS**: Design uses shadcn/ui standard patterns, no custom abstractions
- ✅ **PASS**: Configuration follows Next.js documented approach
- ✅ **PASS**: Component API matches existing shadcn/ui components (Button, Card, etc.)

### II. Testing Discipline & Safety Nets
- ✅ **PASS**: Testing strategy defined with unit, integration, and E2E coverage
- ✅ **PASS**: Accessibility testing approach documented
- ✅ **PASS**: Build validation included in test plan

### III. User Experience Consistency
- ✅ **PASS**: Dialog UX follows standard web patterns (ESC, overlay click, keyboard nav)
- ✅ **PASS**: Visual design consistent with new-york shadcn style
- ✅ **PASS**: Component API matches existing UI component patterns

### IV. Performance & Resource Efficiency
- ✅ **PASS**: Performance targets defined and achievable
- ✅ **PASS**: Image loading configured to not block interactivity
- ✅ **PASS**: Radix UI Dialog uses optimal rendering strategy

### V. Observability & Debuggability
- ✅ **PASS**: Build errors will clearly indicate configuration issues
- ✅ **PASS**: Browser DevTools provide image loading diagnostics
- ✅ **PASS**: React DevTools show Dialog component tree for debugging

**Final Status**: ✅ **APPROVED** - All constitution principles satisfied post-design.

---

## Next Steps

1. ✅ Phase 0 and Phase 1 artifacts generated (this plan)
2. ⏭️ Generate `research.md` with findings from research tasks R1-R5
3. ⏭️ Generate `data-model.md` (N/A marker), `contracts/`, and `quickstart.md`
4. ⏭️ Run agent context update script
5. ⏭️ Execute `/speckit.tasks` command to generate task breakdown in `tasks.md`

**Branch**: `001-dialog-component-setup`
**Implementation Plan**: `/home/runner/work/topten/topten/specs/001-dialog-component-setup/plan.md`
