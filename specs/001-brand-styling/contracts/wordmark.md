# UI Contract: myfaves Wordmark

**Branch**: `001-brand-styling` | **Date**: 2026-03-13

---

## Purpose

Documents the canonical markup pattern for the **myfaves** wordmark, to be applied consistently wherever a logo is needed in the application.

---

## Wordmark — Full (Header, Sidebar)

```tsx
{/* Two-colour myfaves wordmark — light and dark mode responsive */}
<span
  className="font-serif text-2xl leading-none tracking-tight"
  aria-label="myfaves"
>
  <span className="text-foreground">my</span>
  <span className="text-violet-500 dark:text-violet-300">faves</span>
</span>
```

### Rules

| Rule | Value |
|------|-------|
| Font | `font-serif` → `'DM Serif Display', Georgia, serif` |
| "my" colour — light | `text-foreground` → `#111827` |
| "my" colour — dark | `text-foreground` → `#ffffff` |
| "faves" colour — light | `text-violet-500` → `#8B5CF6` |
| "faves" colour — dark | `dark:text-violet-300` → `#C4B5FD` |
| Letter spacing | `tracking-tight` (−0.025em) |
| Line height | `leading-none` (1) |
| Minimum size | 80 px wide before needing the icon mark |
| Capitalisation | Always lowercase: `myfaves` — never `MyFaves`, `MYFAVES`, `Myfaves` |
| `aria-label` | Always `"myfaves"` on the parent span (split colour is decorative) |

### Size variants

| Context | Class |
|---------|-------|
| Header (landing + auth pages) | `text-2xl` (24 px) |
| Dashboard sidebar | `text-xl` (20 px) |
| Footer / small lockup | `text-lg` (18 px) |

---

## Icon Mark (future: favicon, PWA, avatar placeholder)

```tsx
{/* mf icon mark — rounded square */}
<div
  className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500 font-serif text-lg font-bold leading-none text-white"
  aria-label="myfaves"
>
  mf
</div>
```

| Variant | Background | Text |
|---------|-----------|------|
| Primary (violet) | `bg-violet-500` | `text-white` |
| Dark | `bg-[#111827]` | `text-white` |
| Light (on white) | `bg-white border border-gray-200` | `text-violet-500` |

Sizes: `h-16 w-16 text-3xl rounded-2xl` (64 px), `h-12 w-12 text-xl rounded-xl` (48 px), `h-8 w-8 text-sm rounded-lg` (32 px).

---

## Don'ts

- ❌ Do not add a `MapPin`, emoji prefix (`📍`), or any icon before the wordmark text.
- ❌ Do not use a solid single colour for both "my" and "faves".
- ❌ Do not use `font-sans` for the wordmark — it must always be `font-serif` (DM Serif Display).
- ❌ Do not capitalise: it is always `myfaves`, never `MyFaves`.
