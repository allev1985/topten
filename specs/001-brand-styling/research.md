# Research: Brand Styling — myfaves Visual Identity

**Branch**: `001-brand-styling` | **Date**: 2026-03-13

---

## R-001 — Tailwind CSS v4 Font Variable Integration

**Decision**: Load Google Fonts via a `<link>` tag in `layout.tsx` (no `next/font` loader). Define `--font-sans` and `--font-serif` as literal font-family strings in `:root` and forward through `@theme inline`.

**Rationale**: The current `globals.css` defines `--font-sans: var(--font-geist-sans)` — a CSS variable injected by the `next/font/google` Geist loader. Removing Geist means that pipeline disappears. The simplest swap is a plain Google Fonts `<link>` (`preconnect` + stylesheet), which the brand identity spec uses itself (`docs/brand/brand-identity.html`). The `--font-sans` and `--font-serif` CSS variables then hold literal stack strings, making them fully portable.

**Alternatives considered**:
- `next/font/google` for DM Sans + DM Serif Display — provides automatic subsetting and self-hosting. Valid for a future performance pass (eliminates external network request, improves LCP). Deferred because it requires a more significant refactor of the font loading pipeline and this feature is about visual correctness, not performance optimisation.
- CSS `@font-face` self-hosting — out of scope per spec assumptions.

---

## R-002 — List Card Cover Gradient (No DB Column)

**Decision**: Derive gradient deterministically at render time by summing the first 8 hex digits of the list UUID and taking modulo 4 against the four brand gradients.

**Rationale**: No `coverGradient` column exists in the `lists` table. Spec FR-011 requires a gradient on every card cover with "violet→pink" as default. Using a hash gives each card a visually distinct gradient without any migration. The result is stable across re-renders (same UUID → same gradient). When a gradient-picker feature is built, the DB column will override this logic.

**Hash function**:
```ts
export function listCoverGradient(listId: string): string {
  const sum = listId.replace(/-/g, "").slice(0, 8)
    .split("").reduce((acc, c) => acc + parseInt(c, 16), 0);
  return BRAND_GRADIENTS[sum % 4];
}
```

**Alternatives considered**:
- Always use the single default (violet→pink) — rejected: monotonous grid appearance.
- Random per-render — rejected: cards flicker/change gradient on every render/re-render.
- Index-based (position in list) — rejected: gradients shift when items are reordered or filtered.

---

## R-003 — Wordmark Markup Pattern

**Decision**: Inline `<span>` pair, no dedicated `<Wordmark>` component. Pattern documented in `contracts/wordmark.md`.

**Rationale**: The wordmark appears in exactly two places (Header and DashboardSidebar). Extracting a component now is premature. The pattern is trivial and documented; if a third surface needs it, extract then. Using Tailwind utility classes (`text-foreground`, `text-violet-500 dark:text-violet-300`, `font-serif`) keeps it consistent with the rest of the codebase.

**Alternatives considered**:
- Dedicated `<Wordmark size="lg" />` component — premature abstraction for two usages.
- SVG logo — loses the typographic character; requires separate asset management; not aligned with brand spec which defines the wordmark as live text.

---

## R-004 — "myfaves" String Occurrences

**Full list of files requiring updates** (from codebase grep):

| File | Lines | Type |
|------|-------|------|
| `src/app/layout.tsx` | 5 | `<title>` metadata |
| `src/app/page.tsx` | 5, 9 | `<title>` + OG title metadata |
| `src/components/shared/Header.tsx` | 20, 26 | `aria-label`, visible text |
| `src/components/dashboard/DashboardSidebar.tsx` | 58 | Visible text |
| `src/app/profiles/[vanitySlug]/page.tsx` | 30, 33, 35 | Page titles, OG, description |
| `src/app/profiles/[vanitySlug]/lists/[listSlug]/page.tsx` | 27, 36, 39, 42 | Page titles, OG, description |
| `src/lib/auth/helpers/session.ts` | 2 | Code comment only — no user-visible impact, leave as-is |
| `src/lib/utils/validation/password.ts` | 2 | Code comment only — no user-visible impact, leave as-is |

**Replacement rule**: `"myfaves"` → `"myfaves"` in all user-visible contexts (titles, descriptions, aria-labels). Code comments (`// ... for myfaves`) are out of scope per spec FR-014.
