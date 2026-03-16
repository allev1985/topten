# Implementation Plan: Brand Styling — myfaves Visual Identity

**Branch**: `001-brand-styling` | **Date**: 2026-03-13 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-brand-styling/spec.md`

---

## Summary

Replace the app's generic neutral/zinc palette, Geist/Arial typography, orange MapPin logo, and "myfaves" naming with the **myfaves** brand identity: violet (`#8B5CF6`) as the primary colour, DM Serif Display + DM Sans typefaces, a two-colour wordmark, and branded list-card cover gradients. All changes flow through three levers: (1) CSS custom-property tokens in `globals.css`, (2) Google Fonts loading in `layout.tsx`, and (3) targeted component updates in Header, DashboardSidebar, ListCard, and page metadata. No schema changes required.

---

## Technical Context

**Language/Version**: TypeScript 5 / Node 20  
**Primary Dependencies**: Next.js 16.0.5 (App Router), Tailwind CSS v4, shadcn/ui (new-york), Google Fonts (DM Serif Display, DM Sans)  
**Storage**: N/A for this feature — no schema changes  
**Testing**: Vitest (unit/component), Playwright (E2E)  
**Target Platform**: Web — Vercel deployment, all modern browsers  
**Project Type**: Web application (Next.js)  
**Performance Goals**: No LCP regression; fonts served via Google Fonts CDN with `display=swap`  
**Constraints**: Must not edit `src/components/ui/` directly (shadcn/ui Constitution rule). Token-based approach required; per-component class overrides only as last resort.  
**Scale/Scope**: ~15 source files touched; no database migrations; styling is additive/replacement.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality & Maintainability | ✅ PASS | Token-led approach centralises changes in `globals.css`; component changes are minimal and localised |
| I. Framework Code Integrity | ✅ PASS | `src/components/ui/` is NOT modified. Colour tokens propagate via CSS variables that shadcn/ui reads at runtime. |
| II. Testing Discipline | ✅ PASS | Component tests for Header wordmark + DashboardSidebar wordmark required. Visual/computed-style assertions cover colour tokens. No new business logic requires unit tests. |
| III. UX Consistency | ✅ PASS | The brand change is intentional and consistent across all surfaces. |
| IV. Performance | ✅ PASS | Google Fonts uses `display=swap`; fonts are subset to needed weights. No runtime JS cost. |
| VI. Architecture Integrity | ✅ PASS | Pure styling/presentation — no action, service, or data-layer changes. |
| VII. Data Integrity | ✅ PASS | No schema changes. List cover gradient is render-time only. |
| VIII. Security | ✅ PASS | No secrets, auth, or API key changes. |

**No violations.** No decision record required.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-brand-styling/
├── spec.md            ✅ complete
├── plan.md            ✅ this file
├── research.md        → Phase 0 output (below)
├── data-model.md      → Phase 1 output (below)
├── contracts/
│   └── wordmark.md    → Phase 1 output (below)
└── tasks.md           → /speckit.tasks command (NOT created here)
```

### Source Code (files changed by this feature)

```text
src/
├── app/
│   ├── layout.tsx                                   # Add Google Fonts <link>, update metadata title
│   ├── page.tsx                                     # Update metadata title + OG tags
│   └── profiles/
│       ├── [vanitySlug]/page.tsx                    # Update "— myfaves" in title/description strings
│       └── [vanitySlug]/lists/[listSlug]/page.tsx   # Update "— myfaves" in title/description strings
├── components/
│   ├── shared/
│   │   └── Header.tsx                               # Replace MapPin+text logo with two-colour wordmark
│   └── dashboard/
│       ├── DashboardSidebar.tsx                     # Replace 📍 myfaves with two-colour wordmark
│       └── ListCard.tsx                             # Add gradient cover strip above CardContent body
└── globals.css                                      # CSS token overhaul + font variables
```

---

## Phase 0: Research

### R-001 — Tailwind CSS v4 `@theme inline` font variable integration

**Decision**: Use `@import url(...)` in `globals.css` for Google Fonts (no `next/font` loader), then declare `--font-sans` and `--font-serif` in both `:root` and `@theme inline`.

**Rationale**: The project currently defines `--font-sans: var(--font-geist-sans)` in `@theme inline`, referencing a CSS variable injected by `next/font/google`. Since this feature removes Geist and replaces it with DM Sans loaded via a plain `<link>` tag in `layout.tsx` head, the simplest reliable approach is: (1) add the Google Fonts `<link>` to `layout.tsx`, (2) redefine `--font-sans` and `--font-serif` as literal font-family strings in `:root`, (3) forward them through `@theme inline`. `next/font` could also be used but adds unnecessary complexity for two commodity Google Fonts that aren't being subset beyond the provided weights.

**Alternative considered**: `next/font/google` — provides automatic subsetting and self-hosting. Rejected for this iteration because it requires a more significant refactor of the font loading pipeline, and the brand spec uses Google Fonts directly. Can be adopted in a follow-up performance pass.

**Alternatives considered**: CSS `@font-face` self-hosting — out of scope per spec assumptions.

---

### R-002 — List card cover gradient (no DB field)

**Decision**: Assign a gradient deterministically by hashing the list UUID modulo 4 at render time. The four brand gradients are defined as a constant array. No new DB column needed for MVP.

**Rationale**: Spec FR-011 says "if a list has no stored gradient, the default MUST be violet→pink". Since no `coverGradient` column exists yet, all lists fall into the default case. Using a deterministic hash gives visual variety across the grid from day one without a migration. A future gradient-picker feature can add the DB column and picker UI.

**Alternatives considered**: Always use the single default gradient — rejected because the grid looks monotonous. Random per-render — rejected because cards would flicker on re-render.

**Hash function**: `uuidToGradientIndex(id: string): 0|1|2|3` — sum of the first 8 hex digit values mod 4.

---

### R-003 — Wordmark markup pattern

**Decision**: Use an inline `<span>` pair with `font-serif` utility class on the parent and explicit colour utility classes on each `<span>`. No dedicated `<Wordmark>` component.

**Rationale**: The wordmark appears in exactly two places (Header, Sidebar). Extracting a component is premature; a simple, copy-able pattern documented in `contracts/wordmark.md` is sufficient. If a third usage appears, extract it then.

**Light variant**: `<span className="font-serif text-[length] tracking-tight"><span className="text-[--color-foreground]">my</span><span className="text-violet-500">faves</span></span>`

**Dark variant** (auto via CSS token): `text-[--color-foreground]` resolves to white in dark mode; add `dark:text-violet-300` to the "faves" span.

---

## Phase 1: Design & Contracts

### data-model.md

No new database entities. The only data-adjacent addition is a **gradient lookup constant**:

```ts
// src/lib/utils/gradient.ts
export const BRAND_GRADIENTS = [
  "linear-gradient(135deg, #8B5CF6, #F472B6)", // violet → pink  (index 0)
  "linear-gradient(135deg, #34D399, #3B82F6)", // mint → blue    (index 1)
  "linear-gradient(135deg, #8B5CF6, #3B82F6)", // violet → blue  (index 2)
  "linear-gradient(135deg, #F472B6, #FBBF24)", // pink → amber   (index 3)
] as const;

/** Deterministically maps a UUID string to one of the four brand gradients. */
export function listCoverGradient(listId: string): string {
  const sum = listId.replace(/-/g, "").slice(0, 8)
    .split("").reduce((acc, c) => acc + parseInt(c, 16), 0);
  return BRAND_GRADIENTS[sum % 4];
}
```

No schema migration needed. `ListCard` will call `listCoverGradient(list.id)` to derive the cover style inline.

---

### contracts/wordmark.md

**Wordmark markup contract** — canonical pattern to be used in Header and Sidebar (and any future surface):

```tsx
{/* Light-mode primary / dark-mode reversed — responsive to CSS tokens */}
<span
  className="font-serif text-[size] leading-none tracking-tight"
  aria-label="myfaves"
>
  <span className="text-foreground">my</span>
  <span className="text-violet-500 dark:text-violet-300">faves</span>
</span>
```

**Rules** (from brand spec):
- Font: DM Serif Display (`font-serif` utility, mapped to `--font-serif` token).
- "my": resolves to near-black (`#111827`) on light, white on dark — achieved via `text-foreground`.
- "faves": `#8B5CF6` on light, `#C4B5FD` on dark — achieved via `text-violet-500 dark:text-violet-300`.
- No icons, no MapPin, no emoji prefix.
- `aria-label="myfaves"` on the parent span for screen readers (the split colour is decorative).
- Minimum rendered width: 80 px. Below that, use the icon mark (`mf` in a rounded square).

**Icon mark** (not needed for MVP, documented for future favicon/PWA work):
```tsx
<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500 font-serif text-lg font-bold text-white">
  mf
</div>
```

---

### CSS token map (`globals.css` changes)

**`:root` light-mode tokens** (replaces current defaults):

| Token | Current | New (brand) |
|-------|---------|-------------|
| `--background` | `#ffffff` | `#F9FAFB` |
| `--foreground` | `#171717` | `#111827` |
| `--card` | `#ffffff` | `#ffffff` (unchanged) |
| `--card-foreground` | `#0a0a0a` | `#111827` |
| `--primary` | `#171717` | `#8B5CF6` |
| `--primary-foreground` | `#fafafa` | `#ffffff` |
| `--secondary` | `#f5f5f5` | `#EDE9FE` |
| `--secondary-foreground` | `#171717` | `#8B5CF6` |
| `--muted` | `#f5f5f5` | `#F3F4F6` |
| `--muted-foreground` | `#737373` | `#6B7280` |
| `--accent` | `#f5f5f5` | `#EDE9FE` |
| `--accent-foreground` | `#171717` | `#8B5CF6` |
| `--border` | `#e5e5e5` | `#E5E7EB` |
| `--input` | `#e5e5e5` | `#E5E7EB` |
| `--ring` | `#171717` | `#8B5CF6` |
| `--radius` | `0.5rem` | `0.625rem` |

**`@media (prefers-color-scheme: dark)` tokens** (replaces current dark defaults):

| Token | New (brand dark) |
|-------|-----------------|
| `--background` | `#111827` |
| `--foreground` | `#ffffff` |
| `--card` | `#1F2937` |
| `--card-foreground` | `#ffffff` |
| `--primary` | `#8B5CF6` |
| `--primary-foreground` | `#ffffff` |
| `--secondary` | `rgba(139,92,246,0.2)` |
| `--secondary-foreground` | `#C4B5FD` |
| `--muted` | `#1F2937` |
| `--muted-foreground` | `rgba(255,255,255,0.45)` |
| `--accent` | `rgba(139,92,246,0.2)` |
| `--accent-foreground` | `#C4B5FD` |
| `--border` | `rgba(255,255,255,0.08)` |
| `--input` | `#1F2937` |
| `--ring` | `#C4B5FD` |
| `--destructive` | `#7f1d1d` (unchanged) |

**`@theme inline` additions**:
```css
--font-serif: 'DM Serif Display', Georgia, serif;
--font-sans:  'DM Sans', system-ui, sans-serif;
```

**`body` rule** update:
```css
body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
}
```

---

### quickstart.md

#### Run locally and verify brand changes

```bash
cd /home/alex/Documents/GitHub/topten
pnpm install          # no new deps — Google Fonts loaded via <link>
pnpm dev
```

**Verify checklist** (browser DevTools):

1. **Fonts**: Open DevTools → Elements → Computed → `font-family` on `<body>` resolves to `DM Sans`.
2. **Heading font**: Computed `font-family` on landing `<h1>` resolves to `DM Serif Display`.
3. **Primary button**: Computed `background-color` on "Create Your First List" is `rgb(139, 92, 246)`.
4. **Focus ring**: Tab to any button → focus outline is violet.
5. **Wordmark**: Header shows "myfaves" with two-tone split, no MapPin icon.
6. **Page title**: Browser tab shows "myfaves" (not "myfaves").
7. **Dark mode**: Set OS to dark → background is `rgb(17, 24, 39)`, "faves" is lavender.
8. **List cards**: Each card in the dashboard grid shows a coloured gradient cover strip.

#### Run tests

```bash
pnpm test                  # Vitest unit + component
pnpm exec playwright test  # E2E
```

---

## Complexity Tracking

No constitution violations. No complexity exceptions required.

---

## Agent Context

Run after completing Phase 1 artifacts:

```bash
cd /home/alex/Documents/GitHub/topten && .specify/scripts/bash/update-agent-context.sh copilot
```

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]  
**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]  
**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]  
**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]  
**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]
**Project Type**: [e.g., library/cli/web-service/mobile-app/compiler/desktop-app or NEEDS CLARIFICATION]  
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]  
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]  
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

[Gates determined based on constitution file]

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
