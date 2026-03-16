# Feature Specification: Brand Styling — myfaves Visual Identity

**Feature Branch**: `001-brand-styling`  
**Created**: 2026-03-13  
**Status**: Draft  
**Input**: User description: "Update all the styling to match the brand specifications and logos as specified in docs/brand/brand-identity.html. Not the name change; not 'myfaves' but 'myfaves'"

---

## Context

The app currently uses a generic neutral/zinc colour palette with the Geist typeface, an orange MapPin logo, and the working title "myfaves". The brand identity system defined in `docs/brand/brand-identity.html` establishes a distinct visual language for **myfaves** — violet-led colours, DM Serif Display + DM Sans typography, a two-colour wordmark ("my" / "faves"), and a set of branded component styles. This spec covers migrating all visual styling to match that identity. Text-string renaming is part of the wordmark/logo work, not a standalone copy-change task.

## User Scenarios & Testing *(mandatory)*

### User Story 1 – See the correct brand on every screen (Priority: P1)

A visitor landing on the app, a user logging in, and an authenticated user on the dashboard all see the **myfaves** wordmark and brand colours consistently — there is no trace of the old orange icon, "myfaves" text, or zinc/neutral palette.

**Why this priority**: Brand coherence is the whole point of this spec. Every other story builds on the correct token foundation.

**Independent Test**: Open `/` (landing), `/login`, and `/dashboard` in a browser. Verify the wordmark renders as "my" (near-black on light / white on dark) + "faves" (violet `#8B5CF6` on light / soft lavender `#C4B5FD` on dark) in DM Serif Display, and no orange MapPin element appears.

**Acceptance Scenarios**:

1. **Given** a user opens the landing page, **When** the page loads, **Then** the header wordmark reads "myfaves" rendered in DM Serif Display with the two-colour split, and the orange MapPin icon is absent.
2. **Given** a user views the dashboard sidebar, **When** the sidebar is visible, **Then** the logo area shows the "myfaves" wordmark (not "📍 myfaves") with the correct colour split.
3. **Given** any page with a `<title>`, **When** the browser tab is examined, **Then** the title contains "myfaves" (not "myfaves" or "myfaves").

---

### User Story 2 – Brand colours replace generic neutrals (Priority: P1)

All interactive elements (buttons, links, focus rings, badges, tags) use the brand colour palette: Core Violet (`#8B5CF6`) as primary, Ghost Tint (`#EDE9FE`) as secondary surface, Near-black (`#111827`) for text and dark backgrounds, Off-white (`#F9FAFB`) for page background.

**Why this priority**: Without correct tokens, every component will look off-brand regardless of font or logo work.

**Independent Test**: Check primary CTA buttons throughout the app — they should have a `#8B5CF6` background. Focus any interactive element — the focus ring should be violet, not the current near-black ring. The page background should read as `#F9FAFB`.

**Acceptance Scenarios**:

1. **Given** a user views the landing page CTA ("Create Your First List"), **When** it is visible, **Then** the button has a violet (`#8B5CF6`) background with white text and a pill border-radius (`border-radius: 999px`).
2. **Given** a user focuses any interactive element, **When** focus is applied, **Then** the focus ring uses the violet colour with a Ghost Tint halo, not the current near-black.
3. **Given** a user views the dashboard list cards, **When** a card cover gradient is displayed, **Then** it uses one of the four brand gradients (violet→pink, mint→blue, violet→blue, pink→amber).
4. **Given** a user applies a badge/tag to a list or category, **When** rendered, **Then** the tag uses the correct brand chip style (e.g., violet chip: `#EDE9FE` bg / `#8B5CF6` text).

---

### User Story 3 – Brand typography is applied throughout (Priority: P2)

Headings and display text use **DM Serif Display**; body copy, labels, and UI chrome use **DM Sans**. The old Geist Sans / Arial fallback is removed.

**Why this priority**: Typography is visually prominent and differentiates myfaves from a generic app, but the app is functional without it once colours are correct.

**Independent Test**: Inspect the landing page `<h1>` — it should use DM Serif Display. Inspect body paragraphs and button labels — they should use DM Sans.

**Acceptance Scenarios**:

1. **Given** a user views the landing page hero, **When** the headline renders, **Then** the `<h1>` uses DM Serif Display, and the font is served via Google Fonts (or equivalent).
2. **Given** a user views any button, label, or paragraph, **When** the element renders, **Then** the computed font family resolves to DM Sans (not Geist, Arial, or system-ui alone).
3. **Given** the global CSS `body` rule, **When** inspected, **Then** `font-family` references DM Sans, not Arial/Helvetica.

---

### User Story 4 – Dark mode uses the brand dark palette (Priority: P2)

When the OS/browser preference is dark, the app switches to the brand dark palette: `#111827` background, white text, `#C4B5FD` (soft lavender) for accent/wordmark, `#1F2937` card surfaces, and `rgba(255,255,255,0.08)` borders.

**Why this priority**: Dark mode is second-tier polish; the light-mode identity is the baseline.

**Independent Test**: Set OS to dark mode and open the app. The background should be `#111827` (not pitch `#0a0a0a`). The wordmark "faves" portion should be lavender (`#C4B5FD`). Cards should appear with the `#1F2937` surface.

**Acceptance Scenarios**:

1. **Given** the OS is in dark mode, **When** any page loads, **Then** the body background is `#111827` and foreground text is white.
2. **Given** the OS is in dark mode, **When** the wordmark is visible, **Then** "my" is white and "faves" is `#C4B5FD` (soft lavender).
3. **Given** dark mode is active and a list card is displayed, **When** the card renders, **Then** the card surface is `#1F2937` with an `rgba(255,255,255,0.08)` border.

---

### Edge Cases

- What happens when Google Fonts is unavailable? Font stacks must include fallbacks: `'DM Serif Display', Georgia, serif` and `'DM Sans', system-ui, sans-serif`.
- How do shadcn/ui components that override primary/secondary tokens appear after the token change? Each shadcn component should be visually verified or overridden in Tailwind config if the token approach isn't sufficient.
- What happens if a list cover has no assigned gradient? A default gradient (violet→pink) should be applied rather than a blank or grey block.
- What if a user has the OS in dark mode but the app has no explicit dark-mode overrides on a component? The CSS variable approach must cover all component states.

---

## Requirements *(mandatory)*

### Functional Requirements

**FR-001**: The global CSS `:root` block MUST define brand design tokens mapping to the myfaves colour palette: `--primary: #8B5CF6`, `--background: #F9FAFB`, `--foreground: #111827`, `--secondary: #EDE9FE`, `--secondary-foreground: #8B5CF6`, `--muted: #F3F4F6`, `--muted-foreground: #6B7280`, `--accent: #EDE9FE`, `--accent-foreground: #8B5CF6`, `--border: #E5E7EB`, `--ring: #8B5CF6`.

**FR-002**: The global CSS dark-mode block MUST define: `--background: #111827`, `--foreground: #ffffff`, `--card: #1F2937`, `--border: rgba(255,255,255,0.08)`, `--primary: #8B5CF6`, `--ring: #C4B5FD`.

**FR-003**: The app MUST load DM Serif Display and DM Sans from Google Fonts (or self-hosted equivalent) — weights: DM Serif Display (400 normal), DM Sans (300, 400, 500).

**FR-004**: The `body` font-family MUST be `'DM Sans', system-ui, sans-serif`.

**FR-005**: The Tailwind / CSS theme MUST expose `--font-serif: 'DM Serif Display', Georgia, serif` and `--font-sans: 'DM Sans', system-ui, sans-serif` for component use.

**FR-006**: The `Header` component (`src/components/shared/Header.tsx`) MUST replace the orange MapPin + "myfaves" logo with the myfaves two-colour wordmark: `<span>my</span>` in near-black/white and `<span>faves</span>` in `#8B5CF6`/`#C4B5FD`, rendered in DM Serif Display. The `aria-label` MUST read "myfaves home".

**FR-007**: The `DashboardSidebar` component (`src/components/dashboard/DashboardSidebar.tsx`) MUST replace the `📍 myfaves` string with the same two-colour wordmark used in the Header.

**FR-008**: The page `<title>` in `src/app/layout.tsx`, `src/app/page.tsx`, and any other files containing "myfaves" metadata MUST be updated to "myfaves".

**FR-009**: Primary buttons MUST use `background: #8B5CF6; color: white; border-radius: 999px` (pill shape). This is achieved via the `--primary` CSS token update; no per-component Tailwind class overrides are required unless a shadcn component does not respect the token.

**FR-010**: Secondary buttons MUST use `background: #EDE9FE; color: #8B5CF6` via the `--secondary` / `--secondary-foreground` token pair.

**FR-011**: List card cover areas MUST display one of the four brand gradients. If a list has no stored gradient, the default MUST be `linear-gradient(135deg, #8B5CF6, #F472B6)` (violet→pink).

**FR-012**: Badge/tag chips for categories MUST follow the brand colour map: violet (`#EDE9FE`/`#8B5CF6`), pink (`#FDF2F8`/`#BE185D`), mint (`#ECFDF5`/`#065F46`), amber (`#FFFBEB`/`#92400E`), gray (`#F3F4F6`/`#374151`).

**FR-013**: The `--radius` token MUST be updated to `0.625rem` (10 px) from the current `0.5rem`, matching the brand's rounded component style.

**FR-014**: All occurrences of the string "myfaves" or "myfaves" in user-visible text (labels, aria attributes, `alt` text, page titles, descriptions) MUST be replaced with "myfaves".

### Key Entities

- **Design token** (`globals.css` `:root` and dark-mode blocks): the CSS custom properties used by Tailwind `@theme inline` and all components. Changing these is the primary lever for the colour and typography system.
- **Wordmark pattern** (inline usage in Header + Sidebar): the two-tone `<span>my</span><span>faves</span>` markup rendered in DM Serif Display — a consistent implementation applied wherever a logo appears.
- **List cover gradient**: a CSS gradient value rendered per list card; determines the coloured cover strip on `ListCard` and public list pages.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All pages pass a visual check where no orange, zinc, or neutral-grey primary interactive elements remain. Zero occurrences of `bg-orange-*`, `text-orange-*`, `bg-zinc-*` on brand-critical elements (logo, primary buttons, focus rings).
- **SC-002**: Computed `font-family` on `<body>`, heading elements, and button elements resolves to DM Sans and/or DM Serif Display in Chromium DevTools.
- **SC-003**: The string "myfaves" or "myfaves" does not appear in any user-visible surface (browser tab title, visible text, `aria-label`, `alt` text) across all pages.
- **SC-004**: Primary CTA buttons on both the landing page and dashboard have a computed background colour of `rgb(139, 92, 246)` (`#8B5CF6`).
- **SC-005**: In dark mode (OS preference), the body background computes to `rgb(17, 24, 39)` (`#111827`) and the wordmark "faves" span computes to `rgb(196, 181, 253)` (`#C4B5FD`).
- **SC-006**: No list card cover shows a plain solid grey/white fill; every cover displays one of the four brand gradients.
- **SC-007**: The `--ring` token change causes focus outlines to render in violet across all keyboard-focusable interactive elements (verified manually or with an accessibility audit tool).

---

## Assumptions

- The app uses Tailwind CSS with `@theme inline` token mapping — updating CSS custom properties in `:root` propagates to all shadcn/ui components automatically.
- Google Fonts is accessible in the deployment environment, or self-hosting will be arranged separately (font hosting is out of scope for this spec).
- Existing list data in the database does not store a `coverGradient` field yet; the default gradient logic will be applied at render time and can be updated when a picker is added.
- Dark mode is driven by `prefers-color-scheme` media query; no manual toggle is in scope for this spec.
- The `<title>` and `<meta>` description values are the only hard-coded occurrences of "myfaves" outside of component source files; a codebase grep will be run during implementation to catch any stragglers.
