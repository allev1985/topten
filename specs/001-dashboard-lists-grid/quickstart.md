# Quickstart Guide: Dashboard Lists and Grids

**Feature**: Dashboard Lists and Grids  
**Last Updated**: 2025-12-07  
**Estimated Setup Time**: 15-20 minutes

## Overview

This guide helps developers set up and work on the Dashboard Lists and Grids feature, which displays curator lists as visual cards in a responsive grid layout.

---

## Prerequisites

Before starting, ensure you have:

- ✅ Node.js ≥20.0.0 installed
- ✅ pnpm ≥8.0.0 installed
- ✅ Repository cloned and dependencies installed (`pnpm install`)
- ✅ Local development environment running (`pnpm dev`)
- ✅ Basic familiarity with Next.js App Router, React, TypeScript, and Tailwind CSS

**Verify Prerequisites**:
```bash
node --version    # Should be ≥20.0.0
pnpm --version    # Should be ≥8.0.0
```

---

## Quick Setup (5 minutes)

### 1. Install Required shadcn/ui Components

The feature requires Badge and DropdownMenu components that aren't currently installed:

```bash
# Install Badge component
npx shadcn@latest add badge

# Install DropdownMenu component
npx shadcn@latest add dropdown-menu
```

**Expected Output**:
```
✔ Done. Badge component added to src/components/ui/badge.tsx
✔ Done. DropdownMenu component added to src/components/ui/dropdown-menu.tsx
```

### 2. Configure Next.js for External Images

Add placehold.co to allowed image domains in `next.config.ts`:

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },
};

export default nextConfig;
```

### 3. Verify Installation

Run the development server:

```bash
pnpm dev
```

Visit `http://localhost:3000/dashboard` to see the existing dashboard layout.

---

## Project Structure

Understanding where files are located:

```
topten/
├── src/
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── DashboardContent.tsx      # Existing - Layout wrapper
│   │   │   ├── DashboardHeader.tsx       # Existing - Header component
│   │   │   ├── DashboardSidebar.tsx      # Existing - Navigation sidebar
│   │   │   ├── ListCard.tsx              # TODO - Individual card component
│   │   │   └── ListGrid.tsx              # TODO - Grid container component
│   │   └── ui/
│   │       ├── badge.tsx                 # NEW - Status badge component
│   │       ├── dropdown-menu.tsx         # NEW - Menu component
│   │       ├── card.tsx                  # Existing - Base card
│   │       └── button.tsx                # Existing - Button component
│   ├── types/
│   │   └── list.ts                       # TODO - List type definitions
│   ├── lib/
│   │   └── mocks/
│   │       └── lists.ts                  # TODO - Mock data
│   └── app/
│       └── (dashboard)/
│           └── dashboard/
│               └── page.tsx              # MODIFY - Add ListGrid
├── tests/
│   ├── unit/
│   │   └── components/
│   │       └── dashboard/
│   │           ├── ListCard.test.tsx     # TODO - Card tests
│   │           └── ListGrid.test.tsx     # TODO - Grid tests
│   └── e2e/
│       └── dashboard/
│           └── lists-grid.spec.ts        # TODO - E2E tests
└── specs/
    └── 001-dashboard-lists-grid/
        ├── spec.md                       # Feature specification
        ├── plan.md                       # Implementation plan
        ├── research.md                   # Research findings
        ├── data-model.md                 # Data structures
        ├── contracts/                    # Component contracts
        └── quickstart.md                 # This file
```

---

## Implementation Checklist

Follow this sequence for implementing the feature:

### Phase 1: Type Definitions (5 minutes)

- [ ] **Create** `src/types/list.ts`
  - Define `List` interface
  - Define `ListCardProps` interface
  - Define `ListGridProps` interface
  - See [data-model.md](./data-model.md) for full specification

**Example**:
```typescript
// src/types/list.ts
export interface List {
  id: string;
  title: string;
  heroImageUrl: string;
  isPublished: boolean;
  placeCount: number;
}
```

### Phase 2: Mock Data (5 minutes)

- [ ] **Create** `src/lib/mocks/` directory
- [ ] **Create** `src/lib/mocks/lists.ts`
  - Export `mockLists` array with 5 list items
  - Include mix of published/draft status
  - Include variety of place counts (0, 1, multiple)
  - Include one long title for truncation testing
  - See [data-model.md](./data-model.md#mock-data-structure) for full data

**Example**:
```typescript
// src/lib/mocks/lists.ts
import type { List } from "@/types/list";

export const mockLists: List[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    title: "Best Coffee Shops in San Francisco",
    heroImageUrl: "https://placehold.co/600x400/png",
    isPublished: true,
    placeCount: 12,
  },
  // ... 4 more items
];
```

### Phase 3: ListCard Component (30 minutes)

- [ ] **Create** `src/components/dashboard/ListCard.tsx`
  - Import required components (Card, Badge, Button, DropdownMenu, Image)
  - Implement props interface
  - Render card structure with all elements
  - Implement click handler with propagation control
  - Add Tailwind classes for styling
  - Ensure accessibility (alt text, ARIA labels, keyboard navigation)
  - See [contracts/component-contracts.md](./contracts/component-contracts.md#1-listcard-component) for full specification

**Key Implementation Points**:
- Use Next.js Image with `fill` layout for hero image
- Use `line-clamp-2` for title truncation
- Badge variant: `default` for published, `secondary` for draft
- Stop propagation on menu button click
- Console.log list ID on card click

### Phase 4: ListGrid Component (15 minutes)

- [ ] **Create** `src/components/dashboard/ListGrid.tsx`
  - Import ListCard component
  - Implement props interface
  - Map lists array to ListCard components
  - Apply responsive grid classes
  - Pass click handler to all cards
  - See [contracts/component-contracts.md](./contracts/component-contracts.md#2-listgrid-component) for full specification

**Key Implementation Points**:
- CSS Grid with `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Gap of `gap-6` (24px)
- No special empty state handling (renders empty grid)

### Phase 5: Dashboard Integration (10 minutes)

- [ ] **Modify** `src/app/(dashboard)/dashboard/page.tsx`
  - Import `mockLists` from `@/lib/mocks/lists`
  - Import `ListGrid` component
  - Define `handleListClick` with console.log
  - Render `ListGrid` within existing layout
  - Add padding container around grid

**Integration Pattern**:
```typescript
import { mockLists } from "@/lib/mocks/lists";
import { ListGrid } from "@/components/dashboard/ListGrid";

export default function DashboardPage() {
  const handleListClick = (listId: string) => {
    console.log("List clicked:", listId);
  };

  return (
    // ... existing layout
    <DashboardContent>
      <div className="mt-16 lg:mt-0">
        <DashboardHeader />
        <div className="p-6">
          <ListGrid lists={mockLists} onListClick={handleListClick} />
        </div>
      </div>
    </DashboardContent>
  );
}
```

### Phase 6: Unit Tests (45 minutes)

- [ ] **Create** `tests/unit/components/dashboard/ListCard.test.tsx`
  - Test all required element rendering
  - Test published vs draft badge variants
  - Test singular/plural place count
  - Test long title truncation (visual regression or class presence)
  - Test click handler called with list ID
  - Test menu button stops propagation
  - Test image alt text
  - See [contracts/component-contracts.md](./contracts/component-contracts.md#testing-contracts) for test requirements

- [ ] **Create** `tests/unit/components/dashboard/ListGrid.test.tsx`
  - Test grid renders all cards
  - Test correct grid classes applied
  - Test empty array handling
  - Test click handler passed to cards

**Example Test**:
```typescript
// tests/unit/components/dashboard/ListCard.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ListCard } from "@/components/dashboard/ListCard";

describe("ListCard", () => {
  const mockList = {
    id: "test-id",
    title: "Test List",
    heroImageUrl: "https://placehold.co/600x400",
    isPublished: true,
    placeCount: 5,
  };

  it("renders all required elements", () => {
    const onClick = vi.fn();
    render(<ListCard list={mockList} onClick={onClick} />);
    
    expect(screen.getByText("Test List")).toBeInTheDocument();
    expect(screen.getByText("Published")).toBeInTheDocument();
    expect(screen.getByText("5 places")).toBeInTheDocument();
  });
});
```

### Phase 7: E2E Tests (30 minutes)

- [ ] **Create** `tests/e2e/dashboard/lists-grid.spec.ts`
  - Test responsive grid at different viewport sizes
  - Test card click logs to console
  - Test menu button isolation
  - Test accessibility (keyboard navigation, screen reader)
  - See [contracts/component-contracts.md](./contracts/component-contracts.md#e2e-test-requirements)

**Example Test**:
```typescript
// tests/e2e/dashboard/lists-grid.spec.ts
import { test, expect } from "@playwright/test";

test("dashboard displays lists in responsive grid", async ({ page }) => {
  await page.goto("/dashboard");
  
  // Desktop: 3 columns
  await page.setViewportSize({ width: 1280, height: 720 });
  const gridDesktop = page.locator('[class*="grid-cols-3"]');
  await expect(gridDesktop).toBeVisible();
  
  // Tablet: 2 columns
  await page.setViewportSize({ width: 768, height: 1024 });
  const gridTablet = page.locator('[class*="md:grid-cols-2"]');
  await expect(gridTablet).toBeVisible();
  
  // Mobile: 1 column
  await page.setViewportSize({ width: 375, height: 667 });
  const gridMobile = page.locator('[class*="grid-cols-1"]');
  await expect(gridMobile).toBeVisible();
});
```

---

## Running Tests

### Unit Tests

```bash
# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test ListCard.test.tsx
```

**Coverage Target**: ≥65% for new components

### E2E Tests

```bash
# Run E2E tests
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui

# Run specific test file
pnpm test:e2e lists-grid.spec.ts
```

### Linting and Type Checking

```bash
# Run linter
pnpm lint

# Fix linting issues
pnpm lint:fix

# Type check
pnpm typecheck
```

---

## Development Workflow

### 1. Start Development Server

```bash
pnpm dev
```

Open `http://localhost:3000/dashboard` in your browser.

### 2. Make Changes

Edit component files in `src/components/dashboard/`.

Changes will hot-reload automatically.

### 3. Test Visually

- Resize browser window to test responsive grid
- Click cards to verify console logging
- Click menu buttons to verify click isolation
- Test keyboard navigation (Tab, Enter, Space)

### 4. Run Tests

```bash
# After making changes, run tests
pnpm test

# Run E2E tests
pnpm test:e2e
```

### 5. Check Code Quality

```bash
# Before committing
pnpm lint
pnpm typecheck
pnpm test:coverage
```

---

## Common Tasks

### Add a New List to Mock Data

Edit `src/lib/mocks/lists.ts`:

```typescript
export const mockLists: List[] = [
  // ... existing items
  {
    id: "550e8400-e29b-41d4-a716-446655440006", // New UUID
    title: "My New List",
    heroImageUrl: "https://placehold.co/600x400/png",
    isPublished: false,
    placeCount: 3,
  },
];
```

### Change Grid Column Layout

Edit `src/components/dashboard/ListGrid.tsx`:

```typescript
// Current: 1/2/3 columns
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"

// Alternative: 1/2/4 columns
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
```

### Customize Badge Styling

Badge uses shadcn/ui component. To customize, wrap it:

```typescript
// DON'T modify src/components/ui/badge.tsx directly

// DO create a wrapper component
export function StatusBadge({ isPublished }: { isPublished: boolean }) {
  return (
    <Badge variant={isPublished ? "default" : "secondary"} className="custom-class">
      {isPublished ? "Published" : "Draft"}
    </Badge>
  );
}
```

### Debug Click Events

Add console.logs to trace event flow:

```typescript
// In ListCard component
const handleCardClick = () => {
  console.log("Card clicked:", list.id);
  onClick(list.id);
};

const handleMenuClick = (e: React.MouseEvent) => {
  console.log("Menu clicked, stopping propagation");
  e.stopPropagation();
};
```

---

## Troubleshooting

### Images Not Loading

**Problem**: Hero images don't display

**Solution**: Verify Next.js config includes placehold.co:

```typescript
// next.config.ts
images: {
  remotePatterns: [
    {
      protocol: "https",
      hostname: "placehold.co",
    },
  ],
}
```

Restart dev server after config changes.

### Badge Component Not Found

**Problem**: Import error for Badge component

**Solution**: Install shadcn/ui Badge:

```bash
npx shadcn@latest add badge
```

### Grid Not Responsive

**Problem**: Grid doesn't change column count at breakpoints

**Solution**: Verify Tailwind classes are correct:

```typescript
// Must use responsive prefixes
"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
```

### Tests Failing

**Problem**: Tests can't find components or elements

**Solution**: 
1. Verify imports are correct
2. Check test IDs or text selectors match component output
3. Ensure test data matches expected format
4. Check for async rendering issues (use `waitFor`)

### TypeScript Errors

**Problem**: Type errors in components

**Solution**:
1. Verify type imports: `import type { List } from "@/types/list"`
2. Run `pnpm typecheck` to see all errors
3. Ensure props match interface definitions

---

## Helpful Commands Reference

```bash
# Development
pnpm dev                    # Start dev server
pnpm build                  # Production build
pnpm start                  # Start production server

# Testing
pnpm test                   # Run unit tests
pnpm test:watch             # Watch mode
pnpm test:coverage          # With coverage
pnpm test:e2e               # E2E tests
pnpm test:e2e:ui            # E2E with UI

# Code Quality
pnpm lint                   # Run ESLint
pnpm lint:fix               # Fix linting issues
pnpm typecheck              # TypeScript check
pnpm format                 # Format code with Prettier
pnpm format:check           # Check formatting

# shadcn/ui
npx shadcn@latest add [component]  # Add component
npx shadcn@latest list             # List available components
```

---

## Resources

### Documentation
- [Feature Specification](./spec.md) - Complete feature requirements
- [Implementation Plan](./plan.md) - Technical planning and architecture
- [Research Findings](./research.md) - Technology decisions and rationale
- [Data Model](./data-model.md) - Entity definitions and validation
- [Component Contracts](./contracts/component-contracts.md) - API specifications

### External References
- [Next.js Image Component](https://nextjs.org/docs/app/api-reference/components/image)
- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [Tailwind CSS Grid](https://tailwindcss.com/docs/grid-template-columns)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)

### Project Resources
- [Project Constitution](../../../.specify/memory/constitution.md) - Code quality standards
- [GitHub Copilot Instructions](../../../.github/copilot-instructions.md) - Project conventions

---

## Getting Help

If you encounter issues:

1. **Check the spec**: Review [spec.md](./spec.md) for requirements
2. **Check the contracts**: Review [component-contracts.md](./contracts/component-contracts.md) for API details
3. **Check existing code**: Look at similar components in `src/components/`
4. **Run diagnostics**: Use `pnpm typecheck`, `pnpm lint`, `pnpm test`
5. **Search issues**: Check GitHub issues for similar problems
6. **Ask for help**: Create an issue with your question and error details

---

## Next Steps After Implementation

Once the feature is complete:

1. ✅ All tests passing (unit + E2E)
2. ✅ Code coverage ≥65%
3. ✅ Linting passes with no errors
4. ✅ Type checking passes
5. ✅ Manual testing on mobile/tablet/desktop
6. ✅ Accessibility audit passes
7. ✅ Code review completed
8. ✅ Documentation updated

**Future Enhancements** (tracked separately):
- Three-dot menu dropdown content (issue #4)
- Navigation to list detail pages
- Real database integration
- List filtering and sorting
- Pagination for large lists

---

## Estimated Timeline

| Phase | Estimated Time | Status |
|-------|----------------|--------|
| Setup | 5 minutes | ⏳ |
| Type definitions | 5 minutes | ⏳ |
| Mock data | 5 minutes | ⏳ |
| ListCard component | 30 minutes | ⏳ |
| ListGrid component | 15 minutes | ⏳ |
| Dashboard integration | 10 minutes | ⏳ |
| Unit tests | 45 minutes | ⏳ |
| E2E tests | 30 minutes | ⏳ |
| Manual testing | 15 minutes | ⏳ |
| **Total** | **~2.5 hours** | - |

---

Good luck with the implementation! 🚀
